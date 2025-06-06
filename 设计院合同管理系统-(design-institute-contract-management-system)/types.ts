
export enum ContractStatus {
  DRAFT = '草稿',
  PENDING_APPROVAL = '审批中',
  ACTIVE = '已生效',
  COMPLETED = '已完成',
  TERMINATED = '已终止',
}

export enum ContractType {
  DESIGN = '设计合同',
  CONSULTANCY = '咨询合同',
  CONSTRUCTION = '施工合同',
  PROCUREMENT = '采购合同',
  OTHER = '其他合同',
}

export interface Contract {
  id: string;
  name: string;
  number: string;
  partyA: string;
  partyB: string;
  amount: number;
  signingDate: string; // ISO string
  effectiveDate: string; // ISO string
  expiryDate: string; // ISO string
  status: ContractStatus;
  type: ContractType;
  responsiblePerson: string;
  description?: string;
  attachments?: File[]; // Simplified for now
}

export enum ApprovalStatus {
  PENDING = '待审批',
  APPROVED = '已批准',
  REJECTED = '已驳回',
}

export interface ApprovalItem {
  id: string;
  contractId: string;
  contractName: string;
  applicant: string;
  applicationDate: string; // ISO string
  currentApprover: string;
  status: ApprovalStatus;
  comments?: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  type: ContractType;
  description: string;
  lastUpdated: string; // ISO string
  contentPreview: string; // A snippet or summary
}

export enum TrackingStatus {
  NOT_STARTED = '未开始',
  IN_PROGRESS = '进行中',
  COMPLETED = '已完成',
  DELAYED = '已延迟',
}

export interface PerformanceTrackingItem {
  id: string;
  contractId: string;
  contractName: string;
  milestone: string;
  dueDate: string; // ISO string
  status: TrackingStatus;
  responsiblePerson: string;
  progress?: number; // 0-100
  notes?: string;
}

export interface NavLinkItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

export interface ChartDataItem {
  name: string;
  value: number;
}
