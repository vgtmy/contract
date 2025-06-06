
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { PerformanceTrackingItem, TrackingStatus } from '../types';
import { MOCK_TRACKING_ITEMS } from '../services/mockData';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Edit3, PlusCircle, ListChecks } from 'lucide-react';

const PerformanceTrackingPage: React.FC = () => {
  const [trackingItems, setTrackingItems] = useState<PerformanceTrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<PerformanceTrackingItem> | null>(null);


  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setTrackingItems(MOCK_TRACKING_ITEMS);
      setIsLoading(false);
    }, 500);
  }, []);
  
  const handleOpenModal = (item?: PerformanceTrackingItem) => {
    if (item) {
        setCurrentItem(item);
    } else {
        // For new item, initialize with some defaults, or leave empty
        // This part is simplified; a real app would link to an existing contract.
        setCurrentItem({ 
            contractName: '', 
            milestone: '', 
            dueDate: new Date().toISOString().split('T')[0], 
            status: TrackingStatus.NOT_STARTED, 
            responsiblePerson: '',
            progress: 0
        });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (itemData: Partial<PerformanceTrackingItem>) => {
    if (currentItem?.id) { // Editing existing
        setTrackingItems(trackingItems.map(t => t.id === currentItem.id ? {...t, ...itemData} as PerformanceTrackingItem : t));
    } else { // Adding new
        const newItem: PerformanceTrackingItem = {
            id: `track-${Date.now()}`,
            contractId: `C-${Date.now()}`, // Placeholder contractId
            ...itemData
        } as PerformanceTrackingItem;
        setTrackingItems([newItem, ...trackingItems]);
    }
    setIsModalOpen(false);
    setCurrentItem(null);
  };


  const getStatusColor = (status: TrackingStatus) => {
    switch (status) {
      case TrackingStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TrackingStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case TrackingStatus.NOT_STARTED: return 'bg-gray-100 text-gray-800';
      case TrackingStatus.DELAYED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const renderTrackingForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(currentItem!); }} className="space-y-4">
        {/* Simplified form: In a real app, contract selection would be a dropdown of existing contracts */}
        <div>
            <label htmlFor="contractName" className="block text-sm font-medium text-gray-700">合同名称</label>
            <input type="text" name="contractName" id="contractName" required value={currentItem?.contractName || ''} 
                   onChange={e => setCurrentItem({...currentItem, contractName: e.target.value})} 
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" 
                   placeholder={currentItem?.id ? "" : "例如: 项目X设计合同"}
            />
        </div>
        <div>
            <label htmlFor="milestone" className="block text-sm font-medium text-gray-700">里程碑/任务</label>
            <input type="text" name="milestone" id="milestone" required value={currentItem?.milestone || ''} 
                   onChange={e => setCurrentItem({...currentItem, milestone: e.target.value})} 
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">截止日期</label>
                <input type="date" name="dueDate" id="dueDate" required value={currentItem?.dueDate || ''} 
                       onChange={e => setCurrentItem({...currentItem, dueDate: e.target.value})} 
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">状态</label>
                <select name="status" id="status" value={currentItem?.status || ''} 
                        onChange={e => setCurrentItem({...currentItem, status: e.target.value as TrackingStatus})} 
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
                    {Object.values(TrackingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="responsiblePerson" className="block text-sm font-medium text-gray-700">负责人</label>
                <input type="text" name="responsiblePerson" id="responsiblePerson" value={currentItem?.responsiblePerson || ''} 
                       onChange={e => setCurrentItem({...currentItem, responsiblePerson: e.target.value})} 
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="progress" className="block text-sm font-medium text-gray-700">进度 (%)</label>
                <input type="number" name="progress" id="progress" min="0" max="100" value={currentItem?.progress || 0} 
                       onChange={e => setCurrentItem({...currentItem, progress: parseInt(e.target.value)})} 
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
            </div>
        </div>
        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">备注</label>
            <textarea name="notes" id="notes" rows={3} value={currentItem?.notes || ''} 
                      onChange={e => setCurrentItem({...currentItem, notes: e.target.value})} 
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button type="submit" variant="primary">保存</Button>
      </div>
    </form>
  );


  if (isLoading) {
    return <LoadingSpinner text="正在加载履约跟踪数据..." />;
  }

  return (
    <div>
      <PageHeader title="合同履行跟踪" actions={
          <Button onClick={() => handleOpenModal()} leftIcon={PlusCircle}>新增跟踪项</Button>
      }/>
      {trackingItems.length === 0 ? (
        <EmptyState 
            title="没有履约跟踪项" 
            message="您可以为合同添加新的里程碑或任务进行跟踪。"
            action={<Button onClick={() => handleOpenModal()} leftIcon={PlusCircle}>新增跟踪项</Button>}
            icon={ListChecks}
        />
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合同名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">里程碑/任务</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">截止日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trackingItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.contractName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.milestone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: `${item.progress || 0}%` }}></div>
                    </div>
                    <span className="text-xs ml-1">{item.progress || 0}%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.responsiblePerson}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)} leftIcon={Edit3} className="text-blue-600 hover:text-blue-800" title="编辑"></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       <Modal title={currentItem?.id ? "编辑跟踪项" : "新增跟踪项"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        {renderTrackingForm()}
      </Modal>
    </div>
  );
};

export default PerformanceTrackingPage;
