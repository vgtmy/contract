'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { exportToExcel, CONTRACT_EXPORT_COLUMNS } from '@/lib/excel-export';

const ContractLedgerPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalVolume: 0, totalCount: 0 });
  const [filters, setFilters] = useState({ query: '', status: '', type: '', page: 1 });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // 拉取全量数据（不分页）
      const res = await fetch(`/api/contract/list?query=${filters.query}&status=${filters.status}&type=${filters.type}&pageSize=9999`);
      const json = await res.json();
      if (json.code === 200) {
        await exportToExcel(json.data.list, CONTRACT_EXPORT_COLUMNS, '合同主台账', '合同台账');
      } else {
        alert('导出失败: ' + json.message);
      }
    } catch (e: any) {
      alert('导出异常: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // 状态颜色映射
  const statusConfig: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    PROCESS: 'bg-amber-100 text-amber-700 border-amber-200',
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        query: filters.query,
        status: filters.status,
        type: filters.type,
        page: filters.page.toString()
      }).toString();
      
      const res = await fetch(`/api/contract/list?${qs}`);
      const json = await res.json();
      if (json.code === 200) {
        setData(json.data.list);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error('Fetch Ledger Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters.status, filters.type, filters.page]); // 变更即查

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchList();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Top Banner & Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">合同主台账</h1>
          <p className="text-gray-500 mt-2 font-medium">全院业务合同的全量视图与执行管控</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-w-48">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">合同总额</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-indigo-600">¥ {summary.totalVolume.toLocaleString()}</span>
              <span className="text-xs font-bold text-gray-400">RMB</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 min-w-40">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">合同总数</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-gray-900">{summary.totalCount}</span>
              <span className="text-xs font-bold text-gray-400">份</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[300px] relative">
          <input 
            type="text" 
            placeholder="搜索合同名称、编号、甲方..."
            value={filters.query}
            onChange={(e) => setFilters({...filters, query: e.target.value})}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all font-medium text-sm"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>

        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="px-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">所有状态</option>
          <option value="DRAFT">草案 (DRAFT)</option>
          <option value="ACTIVE">履行中 (ACTIVE)</option>
          <option value="CLOSED">已结清 (CLOSED)</option>
        </select>

        <select 
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
          className="px-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">所有类型</option>
          <option value="勘察设计">勘察设计</option>
          <option value="专项咨询">专项咨询</option>
          <option value="全过程咨询">全过程咨询</option>
        </select>

        <div className="ml-auto flex items-center space-x-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span>{exporting ? '导出中...' : '导出 Excel'}</span>
          </button>
          <Link 
            href="/contract/draft"
            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center space-x-2 hover:bg-black transition-all shadow-lg shadow-gray-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span>起草主合同</span>
          </Link>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-12">#</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">基本信息</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">甲方单位</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">总额</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">负责人</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-gray-400 font-medium">
                  暂未检索到符合条件的合同记录
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-6 py-5 text-center text-xs font-bold text-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                        {item.serialNo} <span className="mx-1">/</span> {item.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-gray-600 truncate max-w-[200px] block">{item.customer.name}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-sm font-black text-gray-900 leading-none block">¥ {item.totalAmount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${statusConfig[item.status]}`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                        {item.pmName[0]}
                      </div>
                      <span className="text-xs font-bold text-gray-600">{item.pmName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end items-center space-x-2">
                       <Link 
                        href={`/contract/detail/${item.id}`}
                        className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-indigo-600 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 hover:text-gray-900 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Placeholder Pagination */}
        <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Showing Page {filters.page}
          </span>
          <div className="flex items-center space-x-2">
            <button className="p-1 px-2 text-xs font-black text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">Prev</button>
            <button className="p-1 px-2 text-xs font-black text-gray-900 border-2 border-indigo-600 rounded-lg">1</button>
            <button className="p-1 px-2 text-xs font-black text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractLedgerPage;
