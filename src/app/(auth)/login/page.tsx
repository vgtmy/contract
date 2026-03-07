'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('123456');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!username || !password) {
            setErrorMsg('请输入账号和密码');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok && data.code === 200) {
                // Redirect to dashboard on success
                router.push('/');
                router.refresh(); // Force a refresh to update server components with new cookie
            } else {
                setErrorMsg(data.message || '登录失败，请检查账号密码');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(`网络请求失败(${err instanceof Error ? err.message : String(err)})，请检查后端服务是否启动`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">规划院合同管理系统</h1>
                    <p className="text-sm text-gray-500 mt-2">请输入您的账号密码登录</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">账号</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white placeholder-gray-400"
                            placeholder="内部工号或邮箱 (如 admin)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 bg-white placeholder-gray-400"
                            placeholder="请输入密码 (如 123456)"
                        />
                    </div>

                    {errorMsg && (
                        <div className="text-red-500 text-sm">{errorMsg}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {loading ? '登录中...' : '登 录'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
