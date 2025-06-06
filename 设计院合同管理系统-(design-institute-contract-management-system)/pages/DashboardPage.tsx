
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageHeader from '../components/PageHeader';
import { MOCK_CONTRACTS, MOCK_APPROVALS, MOCK_TRACKING_ITEMS } from '../services/mockData';
import { Contract, ContractStatus, ApprovalStatus, TrackingStatus, ChartDataItem } from '../types';
import { AlertTriangle, CheckCircle, Clock, FileText, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DashboardPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
  const [contractStatusData, setContractStatusData] = useState<ChartDataItem[]>([]);
  const [contractValueByTypeData, setContractValueByTypeData] = useState<ChartDataItem[]>([]);
  
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === ContractStatus.ACTIVE).length;
  const pendingApprovals = MOCK_APPROVALS.filter(a => a.status === ApprovalStatus.PENDING).length;
  const overdueTasks = MOCK_TRACKING_ITEMS.filter(t => t.status === TrackingStatus.DELAYED).length;

  useEffect(() => {
    // Process contract status data
    const statusCounts = contracts.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<ContractStatus, number>);
    
    setContractStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
    );

    // Process contract value by type data
    const valueByType = contracts.reduce((acc, contract) => {
      acc[contract.type] = (acc[contract.type] || 0) + contract.amount;
      return acc;
    }, {} as Record<string, number>);

    setContractValueByTypeData(
      Object.entries(valueByType).map(([name, value]) => ({ name, value: value / 10000 })) // in 万
    );

  }, [contracts]);

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
        <Icon size={24} className={color} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );


  return (
    <div>
      <PageHeader title="首页概览" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="总合同数" value={totalContracts} icon={FileText} color="text-blue-500" />
        <StatCard title="生效合同" value={activeContracts} icon={CheckCircle} color="text-green-500" />
        <StatCard title="待审批" value={pendingApprovals} icon={Clock} color="text-yellow-500" />
        <StatCard title="逾期任务" value={overdueTasks} icon={AlertTriangle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">合同状态分布</h3>
          {contractStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contractStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {contractStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">暂无数据</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">合同类型金额 (万元)</h3>
           {contractValueByTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contractValueByTypeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number, name: string) => [`${value} 万元`, name]} />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="合同金额">
                  {contractValueByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">暂无数据</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
