
import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit3, Trash2, Eye, Search, Filter, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Contract, ContractStatus, ContractType } from '../types';
import { MOCK_CONTRACTS } from '../services/mockData';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { summarizeTextWithGemini } from '../services/geminiService'; // Assuming API_KEY is set

const ContractManagementPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentContract, setCurrentContract] = useState<Partial<Contract> | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('');
  const [filterType, setFilterType] = useState<ContractType | ''>('');

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Simulate fetching contracts
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setContracts(MOCK_CONTRACTS);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleAddContract = () => {
    setCurrentContract({
      name: '',
      number: '',
      partyA: '',
      partyB: '',
      amount: 0,
      signingDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      status: ContractStatus.DRAFT,
      type: ContractType.DESIGN,
      responsiblePerson: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEditContract = (contract: Contract) => {
    setCurrentContract(contract);
    setIsModalOpen(true);
  };

  const handleViewDetails = async (contract: Contract) => {
    setCurrentContract(contract);
    setIsDetailsModalOpen(true);
    setSummary(null); // Reset summary
    if (contract.description && process.env.API_KEY) { // Only summarize if API key available and description exists
        setIsSummarizing(true);
        try {
            const contractTextToSummarize = `合同名称: ${contract.name}\n合同编号: ${contract.number}\n甲方: ${contract.partyA}\n乙方: ${contract.partyB}\n金额: ${contract.amount}\n状态: ${contract.status}\n类型: ${contract.type}\n描述: ${contract.description || '无'}`;
            const result = await summarizeTextWithGemini(contractTextToSummarize);
            setSummary(result);
        } catch (error) {
            console.error("Failed to summarize:", error);
            setSummary("摘要生成失败。");
        } finally {
            setIsSummarizing(false);
        }
    } else if (contract.description) {
        setSummary("API Key未配置，无法生成摘要。");
    } else {
        setSummary("无描述内容可供摘要。");
    }
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteContract = () => {
    if (contractToDelete) {
      setContracts(contracts.filter(c => c.id !== contractToDelete.id));
      setIsDeleteModalOpen(false);
      setContractToDelete(null);
    }
  };

  const handleSaveContract = (contractData: Partial<Contract>) => {
    if (currentContract && currentContract.id) {
      // Update existing contract
      setContracts(contracts.map(c => c.id === currentContract.id ? { ...c, ...contractData } as Contract : c));
    } else {
      // Add new contract
      const newContract: Contract = {
        id: `contract-${Date.now()}`, // simple id generation
        ...contractData
      } as Contract;
      setContracts([newContract, ...contracts]);
    }
    setIsModalOpen(false);
    setCurrentContract(null);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.partyA.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.partyB.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? contract.status === filterStatus : true;
    const matchesType = filterType ? contract.type === filterType : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  const renderContractForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveContract(currentContract!); }} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">合同名称</label>
        <input type="text" name="name" id="name" required value={currentContract?.name || ''} onChange={e => setCurrentContract({...currentContract, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-gray-700">合同编号</label>
          <input type="text" name="number" id="number" required value={currentContract?.number || ''} onChange={e => setCurrentContract({...currentContract, number: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">合同金额 (元)</label>
          <input type="number" name="amount" id="amount" required value={currentContract?.amount || 0} onChange={e => setCurrentContract({...currentContract, amount: parseFloat(e.target.value)})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="partyA" className="block text-sm font-medium text-gray-700">甲方</label>
          <input type="text" name="partyA" id="partyA" required value={currentContract?.partyA || ''} onChange={e => setCurrentContract({...currentContract, partyA: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="partyB" className="block text-sm font-medium text-gray-700">乙方</label>
          <input type="text" name="partyB" id="partyB" required value={currentContract?.partyB || ''} onChange={e => setCurrentContract({...currentContract, partyB: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label htmlFor="signingDate" className="block text-sm font-medium text-gray-700">签订日期</label>
            <input type="date" name="signingDate" id="signingDate" required value={currentContract?.signingDate || ''} onChange={e => setCurrentContract({...currentContract, signingDate: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700">生效日期</label>
            <input type="date" name="effectiveDate" id="effectiveDate" required value={currentContract?.effectiveDate || ''} onChange={e => setCurrentContract({...currentContract, effectiveDate: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">截止日期</label>
            <input type="date" name="expiryDate" id="expiryDate" value={currentContract?.expiryDate || ''} onChange={e => setCurrentContract({...currentContract, expiryDate: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">合同状态</label>
          <select name="status" id="status" value={currentContract?.status || ''} onChange={e => setCurrentContract({...currentContract, status: e.target.value as ContractStatus})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
            {Object.values(ContractStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
         <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">合同类型</label>
          <select name="type" id="type" value={currentContract?.type || ''} onChange={e => setCurrentContract({...currentContract, type: e.target.value as ContractType})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
            {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
       <div>
          <label htmlFor="responsiblePerson" className="block text-sm font-medium text-gray-700">负责人</label>
          <input type="text" name="responsiblePerson" id="responsiblePerson" value={currentContract?.responsiblePerson || ''} onChange={e => setCurrentContract({...currentContract, responsiblePerson: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">合同描述/备注</label>
        <textarea name="description" id="description" rows={3} value={currentContract?.description || ''} onChange={e => setCurrentContract({...currentContract, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
        <Button type="submit" variant="primary">保存</Button>
      </div>
    </form>
  );

  const renderContractDetails = () => {
    if (!currentContract) return null;
    return (
        <div className="space-y-4">
            <p><strong>合同名称:</strong> {currentContract.name}</p>
            <p><strong>合同编号:</strong> {currentContract.number}</p>
            <p><strong>甲方:</strong> {currentContract.partyA}</p>
            <p><strong>乙方:</strong> {currentContract.partyB}</p>
            <p><strong>合同金额:</strong> {currentContract.amount?.toLocaleString()} 元</p>
            <p><strong>签订日期:</strong> {currentContract.signingDate}</p>
            <p><strong>生效日期:</strong> {currentContract.effectiveDate}</p>
            <p><strong>截止日期:</strong> {currentContract.expiryDate || 'N/A'}</p>
            <p><strong>合同状态:</strong> {currentContract.status}</p>
            <p><strong>合同类型:</strong> {currentContract.type}</p>
            <p><strong>负责人:</strong> {currentContract.responsiblePerson}</p>
            <p><strong>描述/备注:</strong> {currentContract.description || '无'}</p>
            
            {process.env.API_KEY && (
                <div className="mt-4 pt-4 border-t">
                    <h4 className="text-md font-semibold mb-2 text-gray-700">AI 合同摘要:</h4>
                    {isSummarizing && <LoadingSpinner size="sm" text="正在生成摘要..." />}
                    {!isSummarizing && summary && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{summary}</p>}
                    {!isSummarizing && !summary && !currentContract.description && <p className="text-sm text-gray-500">无描述内容可供摘要。</p>}
                </div>
            )}
             {!process.env.API_KEY && currentContract.description && (
                <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded flex items-center">
                        <AlertTriangle size={18} className="mr-2"/> API Key 未配置，无法使用 AI 摘要功能。
                    </p>
                </div>
            )}
        </div>
    );
};


  if (isLoading) {
    return <LoadingSpinner text="正在加载合同数据..." />;
  }

  return (
    <div>
      <PageHeader 
        title="合同管理" 
        actions={<Button onClick={handleAddContract} leftIcon={PlusCircle}>新增合同</Button>} 
      />

      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="sr-only">搜索</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="搜索合同名称、编号、甲乙方..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="filterStatus" className="sr-only">按状态筛选</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ContractStatus | '')}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">所有状态</option>
              {Object.values(ContractStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filterType" className="sr-only">按类型筛选</label>
            <select
              id="filterType"
              value={filterType}
              onChange={e => setFilterType(e.target.value as ContractType | '')}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              <option value="">所有类型</option>
              {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredContracts.length === 0 ? (
        <EmptyState 
            title="没有找到合同" 
            message="尝试调整搜索或筛选条件，或添加新的合同。"
            action={<Button onClick={handleAddContract} leftIcon={PlusCircle}>新增合同</Button>}
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">签订日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map(contract => (
                <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.amount.toLocaleString()} 元</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      contract.status === ContractStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                      contract.status === ContractStatus.PENDING_APPROVAL ? 'bg-yellow-100 text-yellow-800' :
                      contract.status === ContractStatus.COMPLETED ? 'bg-blue-100 text-blue-800' :
                      contract.status === ContractStatus.DRAFT ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800' // TERMINATED
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.signingDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.responsiblePerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(contract)} leftIcon={Eye} title="查看详情"></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditContract(contract)} leftIcon={Edit3} className="text-blue-600 hover:text-blue-800" title="编辑"></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteContract(contract)} leftIcon={Trash2} className="text-red-600 hover:text-red-800" title="删除"></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={currentContract?.id ? "编辑合同" : "新增合同"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="2xl">
        {renderContractForm()}
      </Modal>

      <Modal title="合同详情" isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} size="xl">
        {renderContractDetails()}
      </Modal>
      
      <Modal title="确认删除" isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} size="sm">
        <p>您确定要删除合同 "{contractToDelete?.name}" 吗？此操作无法撤销。</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>取消</Button>
          <Button variant="danger" onClick={confirmDeleteContract}>删除</Button>
        </div>
      </Modal>

    </div>
  );
};

export default ContractManagementPage;
