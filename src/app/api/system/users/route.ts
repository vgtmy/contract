import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deptId = searchParams.get('deptId');
        const username = searchParams.get('username');

        // Build filter
        const where: any = {};
        if (deptId) {
            where.deptId = deptId;
        }
        if (username) {
            where.username = { contains: username };
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                dept: {
                    select: { id: true, name: true }
                },
                userRoles: {
                    include: {
                        role: {
                            select: { id: true, code: true, name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format output to flatten roles
        const formattedUsers = users.map(u => ({
            ...u,
            password: '', // Never return password hash
            roles: u.userRoles.map(ur => ur.role)
        }));

        return NextResponse.json({ code: 200, data: formattedUsers, message: 'success' });
    } catch (error) {
        console.error('User API Error:', error);
        return NextResponse.json({ code: 500, message: '服务器内部错误' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { username, password, name, deptId, status, roleIds } = await request.json();

        if (!username || !password || !name) {
            return NextResponse.json({ code: 400, message: '核心字段不能为空' }, { status: 400 });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { username }
        });

        if (existing) {
            return NextResponse.json({ code: 400, message: '账号已存在' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                deptId: deptId || null,
                status: status !== undefined ? Number(status) : 1,
                // Transactionally create role bindings
                userRoles: roleIds && roleIds.length > 0 ? {
                    create: roleIds.map((rId: string) => ({ role: { connect: { id: rId } } }))
                } : undefined
            }
        });

        return NextResponse.json({ code: 200, data: { ...user, password: '' }, message: '建档成功' });
    } catch (error) {
        console.error('User Create Error:', error);
        return NextResponse.json({ code: 500, message: '创建失败' }, { status: 500 });
    }
}
