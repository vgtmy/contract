import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { StatusTag } from '@/components/common/StatusTag';

// Next.js 14 server component pattern
export default async function CustomerDetailPage({
    params
}: {
    params: { id: string }
}) {
    const { id } = await params;

    // We fetch directly from DB in Server Components (fastest pipeline)
    const customer = await prisma.customer.findUnique({
        where: { id }
    });

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-gray-700">未找到该客户！</h2>
                <Link href="/customer/list" className="mt-4 text-blue-600 underline">返回客户台账</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/customer/list" className="text-gray-500 hover:text-gray-800">
                    ← 返回
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-blue-600 pl-3">
                    客户档案：{customer.name}
                </h1>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">基本信息登记卡</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">此数据为该客户的主数据锚点，影响后期合同起草主体绑定。</p>
                    </div>
                    <div>
                        <StatusTag type="processing" text="已认证档案" />
                    </div>
                </div>

                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">统一社会信用代码/税号</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                                {customer.taxNumber || '未填写'}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">系统主体性质定位</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {customer.type}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">信用合规评级 (系统风控)</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold text-blue-800">
                                {customer.creditLevel} 级
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">常驻核心对接人</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {customer.contactPerson || '-'}
                                {customer.contactPhone && <span className="ml-3 text-gray-500">({customer.contactPhone})</span>}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">单位注册/通讯地址</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {customer.address || '未填写'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* 预留: 未来接入下钻的关联项目和关联合同列表 */}
            <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col items-center justify-center py-12 border-dashed border-2 border-gray-300">
                <p className="text-gray-500 text-sm">Sprint 3 功能预告：这里将聚合展示该客户产生的所有【立项库】与【历史合同履约流水】。</p>
            </div>

        </div>
    );
}
