
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS } from '../constants';
import { BookOpenText } from 'lucide-react'; // Main App Icon

const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-slate-800 text-slate-100 flex flex-col print:hidden">
      <div className="flex items-center justify-center h-16 bg-slate-900 shadow-md">
        <BookOpenText size={28} className="text-sky-400 mr-2" />
        <h1 className="text-lg font-semibold text-white">合同管理系统</h1>
      </div>
      <nav className="flex-1 mt-4 px-2 space-y-1">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out
              ${isActive
                ? 'bg-sky-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <link.icon className="mr-3 h-5 w-5" aria-hidden="true" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 mt-auto border-t border-slate-700">
        <p className="text-xs text-slate-400">© 2024 设计院</p>
      </div>
    </div>
  );
};

export default Sidebar;
