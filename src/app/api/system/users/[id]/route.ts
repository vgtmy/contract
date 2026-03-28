import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// 1. 修改用户信息 (含修改密码、部门、角色、状态)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { name, deptId, status, password, roleIds } = await request.json();

        // 构造基础数据
        const data: any = {
            name,
            deptId: deptId || null,
            status: status !== undefined ? Number(status) : 1,
        };

        // 如果传了密码，则进行哈希处理
        if (password && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10);
        }

        // 使用事务执行更新及角色重新绑定
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. 更新用户基本信息
            const user = await tx.user.update({
                where: { id },
                data
            });

            // 2. 如果传了角色列表，则全量替换
            if (roleIds) {
                // 先删除旧关联
                await tx.userRole.deleteMany({
                    where: { userId: id }
                });
                // 插入新关联
                if (roleIds.length > 0) {
                    await tx.userRole.createMany({
                        data: roleIds.map((rId: string) => ({
                            userId: id,
                            roleId: rId
                        }))
                    });
                }
            }

            return user;
        });

        return NextResponse.json({ code: 200, data: { ...updatedUser, password: '' }, message: '修改成功' });
    } catch (error) {
        console.error('User Update Error:', error);
        return NextResponse.json({ code: 500, message: '修改失败' }, { status: 500 });
    }
}

// 2. 逻辑删除用户信息 (禁用状态)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        
        // 按照用户要求，执行“逻辑禁用”而不是物理删除
        await prisma.user.update({
            where: { id },
            data: { status: 0 } // 0=停用
        });

        return NextResponse.json({ code: 200, message: '用户已成功禁用' });
    } catch (error) {
        console.error('User Disable Error:', error);
        return NextResponse.json({ code: 500, message: '禁用失败' }, { status: 500 });
    }
}
