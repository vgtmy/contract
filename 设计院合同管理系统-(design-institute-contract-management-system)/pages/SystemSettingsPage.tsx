
import React from 'react';
import PageHeader from '../components/PageHeader';
import { Settings, UserCog, BellDot, Palette } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="系统设置" />
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center text-sky-600 mb-3">
              <UserCog size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">用户与权限管理</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              管理系统用户账户、角色分配和权限设置。确保合适的访问级别和数据安全。
            </p>
            <button className="text-sm text-sky-600 hover:text-sky-800 font-medium">进入用户管理 &rarr;</button>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center text-green-600 mb-3">
              <BellDot size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">通知设置</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              配置系统通知偏好，如邮件提醒、系统内消息等，针对合同审批、到期等事件。
            </p>
            <button className="text-sm text-green-600 hover:text-green-800 font-medium">配置通知 &rarr;</button>
          </div>

          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center text-purple-600 mb-3">
              <Palette size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">外观与主题</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              自定义系统外观，选择主题颜色、字体大小等，以适应您的品牌或个人偏好。
            </p>
            <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">调整外观 &rarr;</button>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <div className="flex items-center text-orange-600 mb-3">
              <Settings size={24} className="mr-3" />
              <h3 className="text-lg font-semibold">其他系统参数</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              配置其他系统级参数，如默认设置、集成选项等。
            </p>
            <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">查看参数 &rarr;</button>
          </div>

        </div>
        <div className="mt-10 text-center">
          <p className="text-gray-500">此页面为系统设置功能的演示入口。具体功能将在后续版本中实现。</p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
