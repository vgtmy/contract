
import React from 'react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, actions }) => {
  return (
    <div className="mb-6 pb-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-2xl font-semibold text-gray-700">{title}</h2>
      {actions && <div className="flex items-center space-x-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
