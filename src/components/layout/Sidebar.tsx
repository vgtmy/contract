'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';

interface MenuNode {
    id: string;
    name: string;
    type: 'DIR' | 'MENU' | 'BUTTON';
    path?: string;
    icon?: string;
    children?: MenuNode[];
}

// 图标字典
const iconPaths: Record<string, string> = {
    'HomeIcon':        'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    'FolderIcon':      'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    'DocumentTextIcon':'M9 17v-2m3 2v-4m3 2v-6m-9-3h9m-9 3h9m-9 3h9m-9 3h9M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z',
    'CurrencyYenIcon': 'M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    'CogIcon':         'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    'UsersIcon':       'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    'CustomerIcon':    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
};

const IconResolver = ({ name, active }: { name?: string; active: boolean }) => {
    const colorClass = active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300';
    const d = name ? (iconPaths[name] || iconPaths['DocumentTextIcon']) : iconPaths['DocumentTextIcon'];
    return (
        <svg className={`mr-3 h-5 w-5 transition-colors flex-shrink-0 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        </svg>
    );
};

// ======= 侧边栏内容（共用于桌面端和移动端抽屉）=======
const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => {
    const pathname = usePathname();
    const [menus, setMenus] = useState<MenuNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const res = await fetch('/api/system/menus/tree');
                const json = await res.json();
                if (json.code === 200) {
                    setMenus(json.data);
                    const initialOpen: Record<string, boolean> = {};
                    json.data.forEach((m: MenuNode) => {
                        if (m.type === 'DIR') initialOpen[m.id] = true;
                    });
                    setOpenGroups(initialOpen);
                }
            } catch {}
            finally { setLoading(false); }
        };
        fetchMenus();
    }, []);

    const toggleGroup = (id: string) => {
        setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                    <span className="text-white font-black text-xl">P</span>
                </div>
                <h1 className="text-lg font-bold tracking-tight text-gray-100 uppercase italic">Contract Pro</h1>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-6">
                <nav className="space-y-4 px-4">
                    {loading ? (
                        <div className="space-y-4 pt-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-10 bg-gray-800/50 animate-pulse rounded-lg mx-2" />
                            ))}
                        </div>
                    ) : (
                        menus.map((node) => (
                            <div key={node.id} className="space-y-1">
                                {node.type === 'DIR' ? (
                                    <>
                                        <button
                                            onClick={() => toggleGroup(node.id)}
                                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-gray-300 transition-colors group"
                                        >
                                            <div className="flex items-center">
                                                <IconResolver name={node.icon} active={false} />
                                                <span>{node.name}</span>
                                            </div>
                                            <svg className={`h-3 w-3 transform transition-transform duration-200 ${openGroups[node.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className={`space-y-1 overflow-hidden transition-all duration-300 ${openGroups[node.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            {node.children?.map((child) => {
                                                const isActive = pathname === child.path;
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={child.path || '#'}
                                                        onClick={onNavClick}
                                                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${isActive
                                                            ? 'bg-indigo-600/10 text-indigo-400'
                                                            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                                                        )}
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-4 transition-all flex-shrink-0 ${isActive ? 'bg-indigo-400 scale-125' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
                                                        {child.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <Link
                                        href={node.path || '#'}
                                        onClick={onNavClick}
                                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${pathname === node.path
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        <IconResolver name={node.icon || 'HomeIcon'} active={pathname === node.path} />
                                        {node.name}
                                    </Link>
                                )}
                            </div>
                        ))
                    )}
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                <div className="flex items-center px-2 py-2 text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    System Online
                </div>
            </div>
        </div>
    );
};

// ======= 主 Sidebar 组件（桌面端常驻 + 移动端抽屉）=======
const Sidebar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);

    // 路由变化时关闭抽屉
    const pathname = usePathname();
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // 阻止 body 滚动
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    return (
        <>
            {/* ===== 桌面端：常驻侧边栏 ===== */}
            <div className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 text-white flex-col h-full shadow-xl flex-shrink-0">
                <SidebarContent />
            </div>

            {/* ===== 移动端：汉堡按钮（外部注入到 Header，这里提供全局悬浮触发） ===== */}
            {/* 触发按钮 —— 悬浮在左下角，仅移动端可见 */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed bottom-6 left-4 z-40 w-12 h-12 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95"
                aria-label="打开导航菜单"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* ===== 移动端：遮罩层 ===== */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* ===== 移动端：抽屉侧边栏 ===== */}
            <div className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 text-white z-50 shadow-2xl flex-col transform transition-transform duration-300 ease-out ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            } flex`}>
                {/* 关闭按钮 */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </div>
        </>
    );
};

export default Sidebar;
