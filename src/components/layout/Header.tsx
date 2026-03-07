import React from 'react';
import { getSession } from '@/lib/auth';
import LogoutButton from './LogoutButton';

const Header = async () => {
    // Since Header is a Server Component rendered inside a Dashboard Layout, 
    // we can directly fetch the session from cookies here.
    const session = await getSession();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-800">工作台</h2>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {session?.role === 'ADMIN' ? 'A' : 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{session?.name || '未知用户'}</span>
                </div>

                <LogoutButton />
            </div>
        </header>
    );
};

export default Header;
