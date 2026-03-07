import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request, context: any) {
    try {
        const id = (await context.params).id;
        const { password, name, deptId, status, roleIds } = await request.json();

        const dataToUpdate: any = {
            name,
            deptId: deptId || null,
            status: status !== undefined ? Number(status) : undefined,
        };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, 10);
        }

        // Role IDs handle if provided in the master update endpoint
        if (roleIds !== undefined) {
            dataToUpdate.userRoles = {
                deleteMany: {}, // Clear old
                create: roleIds.map((rId: string) => ({ role: { connect: { id: rId } } }))
            };
        }

        const user = await prisma.user.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json({ code: 200, data: { ...user, password: '' }, message: '更新成功' });
    } catch (error) {
        console.error('User Update Error:', error);
        return NextResponse.json({ code: 500, message: '更新失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: any) {
    try {
        const id = (await context.params).id;

        // Optional Check: don't allow to delete user with specific admin roles, or self
        // For simplicity, we just delete with cascade constraints handled by Prisma 
        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ code: 200, message: '删除成功' });
    } catch (error) {
        console.error('User Delete Error:', error);
        return NextResponse.json({ code: 500, message: '删除失败' }, { status: 500 });
    }
}
