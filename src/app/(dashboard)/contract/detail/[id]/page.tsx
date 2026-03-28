'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const ContractDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileCategory, setFileCategory] = useState('合同原件');

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/contract/${id}`);
      const json = await res.json();
      if (json.code === 200) setData(json.data);
    } catch (err) {
      console.error('Fetch Detail Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contractId', id as string);
    formData.append('category', fileCategory);

    try {
      const res = await fetch('/api/contract/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.code === 200) {
        alert('附件上传并归档成功！');
        fetchDetail(); // 刷新列表
      } else {
        alert('上传失败: ' + json.message);
      }
    } catch (err) {
      alert('上传服务异常');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-bold animate-pulse">正在穿透合同底层数据...</p>
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center text-gray-400 font-bold">未找到该合同详情</div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{data.name}</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              UUID: {data.id} <span className="mx-2">|</span> {data.serialNo}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${
            data.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}>
            当前状态: {data.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Detail Columns */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500 border-l-4 border-indigo-500 pl-3">合同商务条款</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">合同总额</span>
                  <span className="text-xl font-black text-indigo-600">¥ {data.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">合同类型</span>
                  <span className="text-sm font-bold text-gray-700">{data.type}</span>
                </div>
                <div className="flex justify-between items-baseline border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">签订日期</span>
                  <span className="text-sm font-bold text-gray-700">{data.signDate ? new Date(data.signDate).toLocaleDateString() : '未录入'}</span>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 border-l-4 border-emerald-500 pl-3">收款里程碑</h2>
              <div className="space-y-3">
                {data.paymentPlans.map((plan: any, idx: number) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-900">{plan.phase}</span>
                      <span className="text-[10px] font-medium text-gray-400">{plan.condition}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600 leading-none">¥ {plan.expectedAmount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Files / Attachments Section */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-blue-500 border-l-4 border-blue-500 pl-3">电子附件归档 (Archive)</h2>
              <div className="flex items-center space-x-3">
                <select 
                  className="px-3 py-1.5 text-[10px] font-black uppercase bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                >
                  <option>合同原件</option>
                  <option>盖章终版</option>
                  <option>技术附件</option>
                  <option>变更协议</option>
                </select>
                <div className="relative">
                  <button className={`px-4 py-1.5 text-xs font-black text-white rounded-lg transition-all ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {uploading ? '上传中...' : '上传附件'}
                  </button>
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.files?.length === 0 ? (
                <div className="col-span-2 py-10 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-gray-50 rounded-full">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-5-5m0 0l-5 5m5-5v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">暂无关联的数字资产</p>
                </div>
              ) : (
                data.files.map((file: any) => (
                  <div key={file.id} className="group relative flex items-center p-4 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                       <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded text-[8px] font-black uppercase">{file.category}</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                    <a 
                      href={file.fileUrl} 
                      download={file.name}
                      target="_blank"
                      className="p-2 opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-gray-100 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-8l-5-5m0 0l-5 5m5-5v12" />
                      </svg>
                    </a>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right: Relationships */}
        <div className="space-y-8">
           <section className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 border-l-4 border-indigo-400 pl-3">甲乙主体关系</h2>
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">甲方单位</span>
                <p className="text-sm font-black text-indigo-100">{data.customer.name}</p>
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">负责人 (PM)</span>
                <p className="text-sm font-black text-gray-200">{data.pmName}</p>
              </div>
               <div className="pt-4 border-t border-gray-800">
                <div className="bg-indigo-600/20 p-4 rounded-2xl border border-indigo-500/30">
                  <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">系统提醒</p>
                  <p className="text-[11px] leading-relaxed text-indigo-200">附件上传后将关联其所属合同 UID。目前不支持在线预览预览 PDF，如需查看请使用右侧下载按钮。</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailPage;
