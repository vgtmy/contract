
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import PageHeader from '../components/PageHeader';
import { MOCK_CONTRACTS } from '../services/mockData';
import { Contract, ContractStatus, ContractType, ChartDataItem } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A267F8', '#FF5478'];

const DataAnalysisPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusData, setStatusData] = useState<ChartDataItem[]>([]);
  const [typeData, setTypeData] = useState<ChartDataItem[]>([]);
  const [valueByMonthData, setValueByMonthData] = useState<ChartDataItem[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setContracts(MOCK_CONTRACTS);
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      // Contract Status Distribution
      const statusCounts = contracts.reduce((acc, contract) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {} as Record<ContractStatus, number>);
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

      // Contract Type Distribution (Count)
      const typeCounts = contracts.reduce((acc, contract) => {
        acc[contract.type] = (acc[contract.type] || 0) + 1;
        return acc;
      }, {} as Record<ContractType, number>);
      setTypeData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));
      
      // Contract Value by Signing Month (Simplified)
      const monthlyValues = contracts.reduce((acc, contract) => {
        const month = new Date(contract.signingDate).toLocaleString('default', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + contract.amount;
        return acc;
      }, {} as Record<string, number>);
      
      const sortedMonthlyValues = Object.entries(monthlyValues)
        .map(([name, value]) => ({ name, value: Math.round(value / 10000) })) // Value in 万
        .sort((a, b) => new Date(`01 ${a.name.split(' ')[0]} 20${a.name.split(' ')[1]}`).getTime() - new Date(`01 ${b.name.split(' ')[0]} 20${b.name.split(' ')[1]}`).getTime()); // Sort by month/year
      setValueByMonthData(sortedMonthlyValues);
    }
  }, [contracts]);

  if (isLoading) {
    return <LoadingSpinner text="正在加载分析数据..." />;
  }
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };


  return (
    <div>
      <PageHeader title="数据分析" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contract Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">合同状态分布</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} 个`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-10">暂无状态数据</p>}
        </div>

        {/* Contract Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">合同类型分布 (数量)</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={typeData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, width: 90,  textAnchor: 'end' }} interval={0} />
                <Tooltip formatter={(value: number, name: string) => [`${value} 个`, name]} />
                <Legend />
                <Bar dataKey="value" name="合同数量">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-type-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-10">暂无类型数据</p>}
        </div>
        
        {/* Contract Value by Signing Month */}
        <div className="bg-white p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">月度合同签订金额 (万元)</h3>
          {valueByMonthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={valueByMonthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }}/>
                <YAxis tick={{ fontSize: 12 }} label={{ value: '金额 (万)', angle: -90, position: 'insideLeft', offset: -10, style: {fontSize: '12px'} }}/>
                <Tooltip formatter={(value: number, name: string) => [`${value} 万元`, "合同金额"]} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} activeDot={{ r: 8 }} name="月度签订总额" />
              </LineChart>
            </ResponsiveContainer>
          ): <p className="text-gray-500 text-center py-10">暂无月度金额数据</p>}
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisPage;
