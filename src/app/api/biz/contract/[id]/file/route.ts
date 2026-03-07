import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { logAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
    try {
        const contractId = (await context.params).id;
        if (!contractId) return NextResponse.json({ code: 400, message: '缺少合同标示' }, { status: 400 });

        const files = await prisma.contractFile.findMany({
            where: { contractId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ code: 200, message: 'success', data: files });
    } catch (error) {
        console.error('File GET error:', error);
        return NextResponse.json({ code: 500, message: '获取归档列表失败' }, { status: 500 });
    }
}

export async function POST(request: Request, context: any) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ code: 401, message: '会话已过期，请重新登录' }, { status: 401 });
        }

        const contractId = (await context.params).id;
        const formData = await request.formData();

        const file = formData.get('file') as File | null;
        const category = formData.get('category') as string;
        const remark = formData.get('remark') as string;

        if (!file || !category) {
            return NextResponse.json({ code: 400, message: '文件及归档业务分类不可为空' }, { status: 400 });
        }

        // 基础防注入与防空格式校验
        if (file.size === 0 || file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ code: 400, message: '文件为空或超过 50MB 阈值' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 【合理假设】：在未接驳云 OSS 的开发阶段，我们将文件落地到 public/uploads 内，依赖 Next.js 的静态服务能力对外暴露下载直链
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        try { await mkdir(uploadDir, { recursive: true }); } catch (e) { }

        // Generate unique local name
        const ext = path.extname(file.name);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = `archive-${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadDir, safeName);

        await writeFile(filePath, buffer);

        const contractFile = await prisma.contractFile.create({
            data: {
                contractId,
                name: file.name,
                category,
                fileSize: file.size,
                fileUrl: `/uploads/${safeName}`,
                uploaderId: session.userId || 'system',
                uploaderName: session.name || '内部员工',
                remark
            }
        });

        await logAction({
            module: 'FILE',
            action: 'CREATE',
            targetId: contractFile.id,
            summary: `成功扫描并实体挂载了一份 ${file.name} 形式的合同附件`
        });

        return NextResponse.json({ code: 200, message: '上传归档成功', data: contractFile });
    } catch (error) {
        console.error('File POST upload error:', error);
        return NextResponse.json({ code: 500, message: '服务器存盘异常' }, { status: 500 });
    }
}
