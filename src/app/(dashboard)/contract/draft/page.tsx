'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  serialNo: string;
}

interface PaymentPlanRow {
  phase: string;
  amount: number;
  expectedDate: string;
  condition: string;
}

const DraftForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // 从 URL 获取预填项
  const urlProjectId = searchParams.get('projectId') || '';
  const urlCustomerId = searchParams.get('customerId') || '';

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    serialNo: '',
    type: '勘察设计',
    totalAmount: 0,
    customerId: urlCustomerId,
    projectId: urlProjectId,
    remark: '',
    signDate: new Date().toISOString().split('T')[0],
  });

  // 收款计划行
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlanRow[]>([
    { phase: '首付款', amount: 0, expectedDate: '', condition: '合同签订后 7 个工作日内' }
  ]);

  // 下拉数据
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch('/api/system/customers/list'),
          fetch('/api/project/list')
        ]);
        const cData = await cRes.json();
        const pData = await pRes.json();
        if (cData.code === 200) setCustomers(cData.data);
        if (pData.code === 200) setProjects(pData.data);
      } catch (err) {
        console.error('Failed to fetch basis data:', err);
      }
    };
    fetchData();
  }, []);

  // 监听 URL 参数变化并强制同步到表单（解决 Hydration 后参数延迟到达的问题）
  useEffect(() => {
    if (urlCustomerId || urlProjectId) {
      setFormData(prev => ({
        ...prev,
        customerId: urlCustomerId || prev.customerId,
        projectId: urlProjectId || prev.projectId
      }));
    }
  }, [urlCustomerId, urlProjectId]);

  // 计算逻辑
  const allocatedAmount = paymentPlans.reduce((sum, p) => sum + Number(p.amount), 0);
  const unallocatedAmount = formData.totalAmount - allocatedAmount;
  const isBalanced = unallocatedAmount === 0 && formData.totalAmount > 0;

  // 动态行操作
  const addRow = () => {
    setPaymentPlans([...paymentPlans, { phase: `第 ${paymentPlans.length + 1} 期`, amount: 0, expectedDate: '', condition: '' }]);
  };

  const removeRow = (index: number) => {
    setPaymentPlans(paymentPlans.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof PaymentPlanRow, value: any) => {
    const newPlans = [...paymentPlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setPaymentPlans(newPlans);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert(`金额不平衡：尚有 ${unallocatedAmount.toLocaleString()} 元未分配到收款节点！`);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/contract/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, paymentPlans }),
      });
      const json = await res.json();
      if (json.code === 200) {
        alert('合同起草成功！');
        router.push('/contract/ledger');
      } else {
        alert('保存失败: ' + json.message);
      }
    } catch (err) {
      alert('系统错误，请检查网络或控制台。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-6 border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">合同起草中心</h1>
          <p className="text-gray-500 mt-2 font-medium">录入新的业务合同及其收款节点计划</p>
        </div>
        <div className="flex space-x-3">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200"
          >
            取消
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-8 py-2.5 text-sm font-black text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all ${
              isBalanced ? 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02]' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? '保存中...' : '提交审批'}
          </button>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500 border-l-4 border-indigo-500 pl-3">核心商务条款</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">合同名称</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：XX 城市更新概念性规划设计合同"
                  className="w-full px-5 py-3.5 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-medium text-gray-900" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">合同编号</label>
                <input 
                  type="text" 
                  value={formData.serialNo}
                  onChange={(e) => setFormData({...formData, serialNo: e.target.value})}
                  placeholder="HT-2026-0001"
                  className="w-full px-5 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">合同类型</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-bold"
                >
                  <option>勘察设计</option>
                  <option>专项咨询</option>
                  <option>全过程咨询</option>
                  <option>施工图审查</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">合同金额 (元)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                  <input 
                    type="number" 
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                    className="w-full pl-10 pr-5 py-3 bg-indigo-50/30 border-2 border-indigo-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-black text-indigo-600 text-lg" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">签订日期</label>
                <input 
                  type="date" 
                  value={formData.signDate}
                  onChange={(e) => setFormData({...formData, signDate: e.target.value})}
                  className="w-full px-5 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl transition-all font-bold" 
                />
              </div>
            </div>
          </div>

          {/* Payment Plans */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
             <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 border-l-4 border-emerald-500 pl-3">收款节点拆解</h2>
              <button type="button" onClick={addRow} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <svg className="w-5 h-5 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              {paymentPlans.map((plan, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 p-4 bg-gray-50/50 rounded-2xl border border-transparent">
                  <div className="col-span-3 space-y-1">
                    <input type="text" value={plan.phase} onChange={e => updateRow(idx, 'phase', e.target.value)} className="w-full bg-white border-none py-1.5 px-3 rounded-lg text-sm font-bold shadow-sm" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <input type="number" value={plan.amount} onChange={e => updateRow(idx, 'amount', Number(e.target.value))} className="w-full bg-white border-none py-1.5 px-3 rounded-lg text-sm font-black text-indigo-600 shadow-sm" />
                  </div>
                  <div className="col-span-5 space-y-1">
                    <input type="text" value={plan.condition} onChange={e => updateRow(idx, 'condition', e.target.value)} placeholder="触发条件" className="w-full bg-white border-none py-1.5 px-3 rounded-lg text-sm font-medium shadow-sm" />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button type="button" onClick={() => removeRow(idx)} className="text-gray-300 hover:text-rose-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-3xl shadow-xl text-white space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 border-l-4 border-indigo-400 pl-3">主体关联</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">关联甲方</label>
                <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-5 py-3 bg-gray-800 rounded-2xl text-sm font-bold">
                  <option value="">-- 请选择甲方单位 --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">关联项目</label>
                <select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-5 py-3 bg-gray-800 rounded-2xl text-sm font-bold">
                  <option value="">-- 如有请关联对应项目 --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.serialNo} | {p.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const ContractDraftPage = () => {
    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse font-black uppercase tracking-widest text-[10px]">正在加载起草引擎...</div>}>
            <DraftForm />
        </Suspense>
    );
};

export default ContractDraftPage;
