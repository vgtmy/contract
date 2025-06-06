
import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action, icon: Icon = Inbox }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-sm">
      <Icon className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
