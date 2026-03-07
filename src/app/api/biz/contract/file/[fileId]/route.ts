import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request, context: any) {
    try {
        const fileId = (await context.params).fileId;

        const fileRecord = await prisma.contractFile.findUnique({
            where: { id: fileId }
        });

        if (!fileRecord) {
            return NextResponse.json({ code: 404, message: '物理档案戳引不存在' }, { status: 404 });
        }

        // Attempt to delete actual local file (silently fail if already missing for robustness)
        try {
            const localPath = path.join(process.cwd(), 'public', fileRecord.fileUrl.replace('/uploads/', 'uploads/'));
            await unlink(localPath);
        } catch (e) {
            console.warn('Local file previously swept or absent:', e);
        }

        await prisma.contractFile.delete({
            where: { id: fileId }
        });

        return NextResponse.json({ code: 200, message: '档案剥离成功' });

    } catch (error) {
        console.error('File DELETE error:', error);
        return NextResponse.json({ code: 500, message: '剥离异常' }, { status: 500 });
    }
}
