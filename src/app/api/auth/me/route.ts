import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json(
                { code: 401, message: '未授权或会话已过期' },
                { status: 401 }
            );
        }

        // In a real application, you might hit the DB here to get full user details, 
        // permissions, and dynamic menus based on the session.userId 
        // For Sprint 1, we return the JWT payload directly
        return NextResponse.json({
            code: 200,
            message: 'success',
            data: {
                user: session,
                permissions: ['sys:user:view', 'biz:contract:view'], // Mock permissions
            }
        });

    } catch (error) {
        console.error('Me API Error:', error);
        return NextResponse.json(
            { code: 500, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
