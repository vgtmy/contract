import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import { StatusTag } from '@/components/common/StatusTag';

// Server component
export default async function ProjectDetailPage({
    params
}: {
    params: { id: string }
}) {
    const { id } = await params;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            customer: true
        }
    });

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-gray-700">找不到该项目案卷</h2>
                <Link href="/project/list" className="mt-4 text-blue-600 underline">返回大项目库</Link>
            </div>
        );
    }

    const mapStatus = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { type: 'success' as const, text: '推进流转中' };
            case 'PAUSED': return { type: 'warning' as const, text: '挂起停滞' };
            case 'CLOSED': return { type: 'default' as const, text: '封卷了账' };
            default: return { type: 'default' as const, text: status };
        }
    };

    const statusDisplay = mapStatus(project.status);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/project/list" className="text-gray-500 hover:text-gray-800">
                    ← 台账
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
                    立项母体：{project.name}
                </h1>
                <div className="ml-2">
                    <StatusTag type={statusDisplay.type} text={statusDisplay.text} />
                </div>
            </div>

            {/* Overview Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">核心承办要素</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">此看板汇总了整个大工程的目标定调参数，它将继承到下辖的所有子合同身上。</p>
                    </div>
                </div>

                <div className="border-t border-gray-200">
                    <dl>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">母项目追踪标号</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                                {project.serialNo}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">业主方（甲方客商）</dt>
                            <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2 text-blue-600 hover:underline">
                                <Link href={`/customer/detail/${project.customerId}`}>
                                    {project.customer?.name}
                                </Link>
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">项目类型大类</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium text-indigo-800">
                                {project.type}
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">院内承办及考核落地</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                <span className="font-medium mr-4">实施所/室：{project.deptName}</span>
                                <span className="font-medium">主责PM：{project.pmName}</span>
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">匡算总纲（计划产值）</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">
                                ￥{Number(project.budget).toLocaleString()} 元
                            </dd>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">排期占位</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {project.startDate ? project.startDate.toLocaleDateString() : '-'}
                                <span className="mx-2 text-gray-400">至</span>
                                {project.endDate ? project.endDate.toLocaleDateString() : '-'}
                            </dd>
                        </div>
                        <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">备忘及批注</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {project.remark || '无'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="mt-6 bg-white shadow sm:rounded-lg p-6 flex flex-col items-center justify-center py-12 border-dashed border-2 border-gray-300">
                <p className="text-gray-500 text-sm">此区域预留：未来将透视挂载到此项目身上的所有【子合同】列表及收口金额汇总统计。</p>
            </div>
        </div>
    );
}
