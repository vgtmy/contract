import Link from 'next/link';
import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 text-white flex flex-col h-full">
      <div className="h-16 flex items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider">规划合同管理</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <Link href="/" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            工作台概览
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">合同中心</p>
          </div>
          <Link href="/contract/draft" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            起草合同
          </Link>
          <Link href="/contract/ledger" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            合同台账
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">客户与项目</p>
          </div>
          <Link href="/customer/list" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            客户管理
          </Link>
          <Link href="/project/list" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            立项管理
          </Link>

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">系统设置</p>
          </div>
          <Link href="/system/users" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors">
            组织与人员
          </Link>
          <Link href="/system/audit-log" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-orange-400/80 hover:text-orange-400">
            审计与安全留痕
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
