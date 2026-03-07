import { NextResponse } from 'next/server';
import { clearSessionToken } from '@/lib/auth';

export async function POST() {
    try {
        await clearSessionToken();

        return NextResponse.json({
            code: 200,
            message: '退出成功'
        });
    } catch (error) {
        return NextResponse.json(
            { code: 500, message: '退出失败' },
            { status: 500 }
        );
    }
}
