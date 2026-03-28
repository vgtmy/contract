import { NextResponse } from 'next/server';
import { signToken, setSessionToken, TokenPayload } from '@/lib/auth';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { code: 400, message: '账号和密码不能为空' },
                { status: 400 }
            );
        }

        // 从数据库查询用户（支持真实密码校验）
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                userRoles: {
                    include: { role: true },
                    take: 1
                },
                dept: { select: { id: true, name: true } }
            }
        });

        // 验证用户存在性
        if (!user || user.status !== 1) {
            await logLoginFailure(username);
            return NextResponse.json(
                { code: 401, message: '账号不存在或已被停用' },
                { status: 401 }
            );
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await logLoginFailure(username);
            return NextResponse.json(
                { code: 401, message: '密码错误' },
                { status: 401 }
            );
        }

        // 构建 Token Payload（携带部门信息，用于权限隔离）
        const primaryRole = user.userRoles[0]?.role?.code || 'PM';
        const payload: TokenPayload = {
            userId: user.id,
            role: primaryRole,
            name: user.name,
            deptId: user.dept?.id || user.deptId || undefined,
            deptName: user.dept?.name || undefined
        };

        const token = await signToken(payload);
        await setSessionToken(token);

        // 记录登录审计日志（异步，不阻塞响应）
        prisma.sysAuditLog.create({
            data: {
                operatorId: user.id,
                operatorName: user.name,
                deptName: user.dept?.name,
                role: primaryRole,
                module: 'AUTH',
                actionType: 'LOGIN',
                summary: `用户 [${user.name}] 成功登录系统`
            }
        }).catch(console.error);

        return NextResponse.json({
            code: 200,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    role: primaryRole,
                    deptId: payload.deptId,
                    deptName: payload.deptName
                }
            }
        });

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { code: 500, message: `服务器内部报错: ${error?.message}` },
            { status: 500 }
        );
    }
}

async function logLoginFailure(username: string) {
    await prisma.sysAuditLog.create({
        data: {
            operatorId: 'system',
            operatorName: 'system',
            module: 'AUTH',
            actionType: 'LOGIN',
            summary: `尝试以账号 [${username}] 登录失败，密码错误或账号不存在`,
            result: 'FAIL'
        }
    }).catch(() => {}); // 静默，不影响响应
}
