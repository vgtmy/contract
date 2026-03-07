'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

interface MenuItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

const Sidebar = () => {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    '合同中心': true,
    '客户与项目': true,
    '系统设置': true,
  });

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const menuGroups: MenuGroup[] = [
    {
      groupTitle: '合同中心',
      items: [
        { title: '起草合同', href: '/contract/draft', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
        { title: '合同台账', href: '/contract/ledger', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m-9-3h9m-9 3h9m-9 3h9m-9 3h9M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" /> },
      ]
    },
    {
      groupTitle: '客户与项目',
      items: [
        { title: '客户管理', href: '/customer/list', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
        { title: '立项管理', href: '/project/list', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
      ]
    },
    {
      groupTitle: '系统设置',
      items: [
        { title: '组织与人员', href: '/system/users', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
        { title: '审计与安全留痕', href: '/system/audit-log', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
      ]
    }
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col h-full shadow-xl">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
          <span className="text-white font-black text-xl">P</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-gray-100">规划合同管理</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-6 px-4">
          {/* Overview Section */}
          <div>
            <Link
              href="/"
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group ${pathname === '/'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <svg className={`mr-3 h-5 w-5 ${pathname === '/' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              工作台概览
            </Link>
          </div>

          {/* Grouped Sections */}
          {menuGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.groupTitle)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-300 transition-colors group"
              >
                <span>{group.groupTitle}</span>
                <svg
                  className={`h-3 w-3 transform transition-transform duration-200 ${openGroups[group.groupTitle] ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`space-y-1 overflow-hidden transition-all duration-300 ${openGroups[group.groupTitle] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                          ? 'bg-gray-800 text-indigo-400 border-l-2 border-indigo-500 rounded-l-none'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                        }`}
                    >
                      {item.icon && (
                        <svg className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {item.icon}
                        </svg>
                      )}
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Account Section can be added here if needed */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/30">
        <div className="flex items-center px-2 py-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          系统服务正常运行
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
