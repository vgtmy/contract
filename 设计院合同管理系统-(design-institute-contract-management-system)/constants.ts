
import { Home, FileText, CheckSquare, FilePlus, BarChart2, Settings, ClipboardList } from 'lucide-react';
import { NavLinkItem } from './types';

export const APP_TITLE = "设计院合同管理系统";

export const NAV_LINKS: NavLinkItem[] = [
  { path: '/dashboard', label: '首页概览', icon: Home },
  { path: '/contracts', label: '合同管理', icon: FileText },
  { path: '/approvals', label: '审批流程', icon: CheckSquare },
  { path: '/templates', label: '合同模板', icon: FilePlus },
  { path: '/tracking', label: '履行跟踪', icon: ClipboardList },
  { path: '/analysis', label: '数据分析', icon: BarChart2 },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export const API_KEY_ENV_VAR = "API_KEY"; // Placeholder, actual key is in process.env.API_KEY

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";
