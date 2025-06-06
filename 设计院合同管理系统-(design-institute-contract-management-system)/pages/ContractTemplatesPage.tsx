
import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { ContractTemplate, ContractType } from '../types';
import { MOCK_TEMPLATES } from '../services/mockData';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { PlusCircle, Eye, Edit3, Trash2, FilePlus, AlertTriangle } from 'lucide-react';
import { generateContractClauseWithGemini } from '../services/geminiService';


const ContractTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<ContractTemplate> | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedClause, setAiGeneratedClause] = useState('');
  const [isGeneratingClause, setIsGeneratingClause] = useState(false);


  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setTemplates(MOCK_TEMPLATES);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleAddTemplate = () => {
    setCurrentTemplate({
      name: '',
      type: ContractType.DESIGN,
      description: '',
      contentPreview: '',
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEditTemplate = (template: ContractTemplate) => {
    setCurrentTemplate(template);
    setIsModalOpen(true);
  };
  
  const handleViewTemplate = (template: ContractTemplate) => {
    setCurrentTemplate(template);
    setIsViewModalOpen(true);
  };

  const handleSaveTemplate = (templateData: Partial<ContractTemplate>) => {
    if (currentTemplate?.id) {
      setTemplates(templates.map(t => t.id === currentTemplate.id ? { ...t, ...templateData, lastUpdated: new Date().toISOString().split('T')[0] } as ContractTemplate : t));
    } else {
      const newTemplate: ContractTemplate = {
        id: `template-${Date.now()}`,
        lastUpdated: new Date().toISOString().split('T')[0],
        ...templateData,
      } as ContractTemplate;
      setTemplates([newTemplate, ...templates]);
    }
    setIsModalOpen(false);
    setCurrentTemplate(null);
  };
  
  const handleDeleteTemplate = (id: string) => {
    // Add confirmation modal later if needed
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleOpenAiModal = () => {
    setAiPrompt('');
    setAiGeneratedClause('');
    setIsAiModalOpen(true);
  };

  const handleGenerateClause = async () => {
    if (!aiPrompt.trim() || !process.env.API_KEY) {
        if (!process.env.API_KEY) {
            setAiGeneratedClause("API Key 未配置，无法使用 AI 生成条款功能。");
        } else {
            setAiGeneratedClause("请输入有效的提示信息。");
        }
        return;
    }
    setIsGeneratingClause(true);
    try {
        const clause = await generateContractClauseWithGemini(aiPrompt);
        setAiGeneratedClause(clause);
    } catch (error) {
        setAiGeneratedClause(`生成失败: ${error}`);
    } finally {
        setIsGeneratingClause(false);
    }
  };


  const renderTemplateForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(currentTemplate!); }} className="space-y-4">
      <div>
        <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">模板名称</label>
        <input type="text" name="templateName" id="templateName" required value={currentTemplate?.name || ''} onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
      <div>
        <label htmlFor="templateType" className="block text-sm font-medium text-gray-700">模板类型</label>
        <select name="templateType" id="templateType" value={currentTemplate?.type || ''} onChange={e => setCurrentTemplate({...currentTemplate, type: e.target.value as ContractType})} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm">
            {Object.values(ContractType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="templateDescription" className="block text-sm font-medium text-gray-700">描述</label>
        <textarea name="templateDescription" id="templateDescription" rows={3} value={currentTemplate?.description || ''} onChange={e => setCurrentTemplate({...currentTemplate, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
      </div>
       <div>
        <label htmlFor="templateContentPreview" className="block text-sm font-medium text-gray-700">内容预览/主要条款 (实际模板内容会更复杂)</label>
        <textarea name="templateContentPreview" id="templateContentPreview" rows={5} value={currentTemplate?.contentPreview || ''} onChange={e => setCurrentTemplate({...currentTemplate, contentPreview: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"></textarea>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
        <Button type="submit" variant="primary">保存模板</Button>
      </div>
    </form>
  );

  if (isLoading) {
    return <LoadingSpinner text="正在加载合同模板..." />;
  }

  return (
    <div>
      <PageHeader title="合同模板" actions={
        <div className="space-x-2">
            <Button onClick={handleOpenAiModal} variant="ghost" leftIcon={FilePlus}>AI 生成条款</Button>
            <Button onClick={handleAddTemplate} leftIcon={PlusCircle}>新增模板</Button>
        </div>
      } />
      
      {templates.length === 0 ? (
        <EmptyState 
            title="没有合同模板" 
            message="您可以创建新的合同模板，或使用AI辅助生成条款。"
            action={<Button onClick={handleAddTemplate} leftIcon={PlusCircle}>新增模板</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.id} className="bg-white shadow-lg rounded-lg p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
              <div>
                <h3 className="text-xl font-semibold text-sky-700 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-1">类型: <span className="font-medium text-gray-700">{template.type}</span></p>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{template.description}</p>
                <p className="text-xs text-gray-400 mb-4">最后更新: {template.lastUpdated}</p>
              </div>
              <div className="border-t pt-4 mt-auto flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleViewTemplate(template)} leftIcon={Eye}>查看</Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditTemplate(template)} leftIcon={Edit3} className="text-blue-600 hover:text-blue-800">编辑</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)} leftIcon={Trash2} className="text-red-600 hover:text-red-800">删除</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal title={currentTemplate?.id ? "编辑模板" : "新增模板"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg">
        {renderTemplateForm()}
      </Modal>
      
      <Modal title="查看模板详情" isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} size="lg">
        {currentTemplate && (
            <div className="space-y-3">
                <h3 className="text-xl font-semibold text-sky-700">{currentTemplate.name}</h3>
                <p><strong>类型:</strong> {currentTemplate.type}</p>
                <p><strong>描述:</strong> {currentTemplate.description}</p>
                <p><strong>最后更新:</strong> {currentTemplate.lastUpdated}</p>
                <div className="mt-2 pt-2 border-t">
                    <h4 className="font-semibold">内容预览/主要条款:</h4>
                    <pre className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">{currentTemplate.contentPreview || "无内容预览"}</pre>
                </div>
            </div>
        )}
      </Modal>

      <Modal title="AI 生成合同条款" isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} size="xl">
        <div className="space-y-4">
            {!process.env.API_KEY && (
                <div className="p-3 bg-orange-50 text-orange-700 rounded-md flex items-center">
                    <AlertTriangle size={20} className="mr-2" />
                    API Key 未配置，AI 生成条款功能不可用。
                </div>
            )}
            <div>
                <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700">请输入条款要求或描述:</label>
                <textarea 
                    id="aiPrompt" 
                    rows={4} 
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="例如：关于项目保密责任的条款，要求明确保密范围、保密期限和违约责任。"
                    disabled={!process.env.API_KEY}
                />
            </div>
            <Button onClick={handleGenerateClause} isLoading={isGeneratingClause} disabled={isGeneratingClause || !process.env.API_KEY || !aiPrompt.trim()}>
                {isGeneratingClause ? "正在生成..." : "生成条款"}
            </Button>
            {aiGeneratedClause && (
                <div>
                    <h4 className="text-md font-semibold mb-1 text-gray-700">AI 生成结果:</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap overflow-x-auto max-h-60">{aiGeneratedClause}</pre>
                </div>
            )}
        </div>
      </Modal>

    </div>
  );
};

export default ContractTemplatesPage;
