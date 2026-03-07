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
            {/* 侧边栏 */}
            <Sidebar />

            {/* 右侧主内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
                <Header />

                {/* 内容滚动画布 */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
