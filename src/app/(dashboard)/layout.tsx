import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
            {/* 侧边栏（桌面端常驻 + 移动端抽屉均在组件内处理）*/}
            <Sidebar />

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />

                {/* 内容滚动画布 —— 移动端 padding 缩小 */}
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
