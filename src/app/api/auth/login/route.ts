import { NextResponse } from 'next/server';
import { signToken, setSessionToken } from '@/lib/auth';
import { logAction } from '@/lib/logger';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // TODO: Connect to actual DB for verification in Step 2.
        // Mock Validation for Sprint 1 / Sprint 3 Permissions
        let payload: any = null;
        if (username === 'admin' && password === '123456') {
            payload = { userId: 'admin-1', role: 'ADMIN', name: '系统管理员' };
        } else if (username === 'manager' && password === '123456') {
            payload = { userId: 'manager-1', role: 'MANAGER', name: '规划一所所长', deptId: 'dept-1' };
        } else if (username === 'pm' && password === '123456') {
            payload = { userId: 'pm-1', role: 'PM', name: '业务员小李', deptId: 'dept-1' };
        }

        if (payload) {
            // Sign JWT
            const token = await signToken(payload);
            await setSessionToken(token);

            // Record Login Audit Log
            // A bit of hack: temporarily mock a session in logAction if the auth context is just established but not globally bound yet... but logAction fetches the session. 
            // We just call it after setSessionToken, Next.js cookies() will have the value set for request flow.
            await logAction({
                module: 'AUTH',
                action: 'LOGIN',
                summary: `用户 [${payload.name}] 利用身份登入系统`
            });

            return NextResponse.json({
                code: 200,
                message: '登录成功',
                data: {
                    user: payload
                }
            });

        } else {
            await logAction({
                module: 'AUTH',
                action: 'LOGIN',
                summary: `尝试以户名 ${username} 强行登入失败`,
                result: 'FAIL'
            });

            return NextResponse.json(
                { code: 401, message: '账号或密码错误 (Sprint1测试账号：admin / 123456)' },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json(
            { code: 500, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
