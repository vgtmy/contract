
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { ApprovalItem, ApprovalStatus } from '../types';
import { MOCK_APPROVALS } from '../services/mockData';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

const ApprovalWorkflowPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | ''>('');


  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setApprovals(MOCK_APPROVALS);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleUpdateStatus = (id: string, newStatus: ApprovalStatus) => {
    setApprovals(prevApprovals => 
      prevApprovals.map(appr => 
        appr.id === id ? { ...appr, status: newStatus, currentApprover: newStatus !== ApprovalStatus.PENDING ? '系统（已处理）' : appr.currentApprover } : appr
      )
    );
    // In a real app, this would be an API call
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          approval.currentApprover.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? approval.status === filterStatus : true;
    return matchesSearch && matchesStatus;
  });
  

  if (isLoading) {
    return <LoadingSpinner text="正在加载审批数据..." />;
  }

  return (
    <div>
      <PageHeader title="审批流程" />

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="searchApprovals" className="sr-only">搜索审批</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="searchApprovals"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="搜索合同名称、申请人、审批人..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filterApprovalStatus" className="sr-only">按状态筛选</label>
            <select
              id="filterApprovalStatus"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ApprovalStatus | '')}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">所有状态</option>
              {Object.values(ApprovalStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredApprovals.length === 0 ? (
         <EmptyState 
            title="没有找到审批项" 
            message="当前没有符合条件的审批流程记录。"
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前审批人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备注</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApprovals.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.contractName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.applicant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.applicationDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.currentApprover}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === ApprovalStatus.APPROVED ? 'bg-green-100 text-green-800' :
                      item.status === ApprovalStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800' // REJECTED
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={item.comments}>{item.comments || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    {item.status === ApprovalStatus.PENDING && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(item.id, ApprovalStatus.APPROVED)} leftIcon={CheckCircle} className="text-green-600 hover:text-green-800" title="批准"></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleUpdateStatus(item.id, ApprovalStatus.REJECTED)} leftIcon={XCircle} className="text-red-600 hover:text-red-800" title="驳回"></Button>
                      </>
                    )}
                    {item.status !== ApprovalStatus.PENDING && (
                      <span className="text-xs text-gray-400">已处理</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflowPage;
