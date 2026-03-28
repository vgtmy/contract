import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '未授权或登录已过期' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const contractId = formData.get('contractId') as string;
        const category = formData.get('category') as string || '其他说明';
        const remark = formData.get('remark') as string || '';

        if (!file || !contractId) {
            return NextResponse.json({ code: 400, message: '请上传物理文件并关联有效合同 ID' }, { status: 400 });
        }

        // 1. 准备物理存储路径
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 规范化文件名，防止冲突
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${extension}`;
        
        // 我们在本地 F 盘该项目的 public/uploads 导出
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        
        // 确保目录存在
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // 目录已存在或权限问题，继续执行
        }

        const filePath = join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // 2. 写入数据库
        const result = await prisma.contractFile.create({
            data: {
                contractId,
                name: originalName,
                category,
                fileSize: file.size,
                fileUrl: `/uploads/${fileName}`,
                uploaderId: session.userId,
                uploaderName: session.name,
                remark,
            }
        });

        return NextResponse.json({ code: 200, data: result, message: '上传并归档成功' });
    } catch (error: any) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ code: 500, message: '附件上传失败: ' + error.message }, { status: 500 });
    }
}
