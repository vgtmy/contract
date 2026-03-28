/**
 * Excel 导出工具库
 * 使用 SheetJS (CDN) 在纯浏览器端生成真实 .xlsx 文件
 * 无需 npm 安装，通过动态 script 加载
 */

type CellValue = string | number | boolean | null | undefined;

export interface ExcelColumn {
    key: string;
    header: string;
    width?: number;
    formatter?: (val: CellValue, row: any) => CellValue;
}

/**
 * 动态加载 SheetJS CDN
 */
async function loadSheetJS(): Promise<any> {
    if (typeof window === 'undefined') return null;
    if ((window as any).XLSX) return (window as any).XLSX;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js';
        script.onload = () => resolve((window as any).XLSX);
        script.onerror = () => reject(new Error('无法加载 SheetJS，请检查网络连接'));
        document.head.appendChild(script);
    });
}

/**
 * 通用 Excel 导出函数
 * @param data    数据数组
 * @param columns 列定义（包含 key、header、formatter）
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名称
 */
export async function exportToExcel(
    data: any[],
    columns: ExcelColumn[],
    filename: string,
    sheetName: string = 'Sheet1'
): Promise<void> {
    const XLSX = await loadSheetJS();
    if (!XLSX) throw new Error('SheetJS 加载失败');

    // 构建表头行
    const headerRow = columns.map(col => col.header);

    // 构建数据行
    const dataRows = data.map(row =>
        columns.map(col => {
            const val = row[col.key];
            return col.formatter ? col.formatter(val, row) : val ?? '';
        })
    );

    // 合并表头与数据
    const wsData = [headerRow, ...dataRows];

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 设置列宽
    ws['!cols'] = columns.map(col => ({ wch: col.width || 18 }));

    // 设置表头样式（粗体）- 注意：SheetJS 免费版不支持样式，这是最大努力
    // 可升级到 SheetJS Pro 获取样式支持

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 下载文件
    const date = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
}

/**
 * 合同台账导出列定义
 */
export const CONTRACT_EXPORT_COLUMNS: ExcelColumn[] = [
    { key: 'serialNo',    header: '合同编号',    width: 16 },
    { key: 'name',        header: '合同名称',    width: 36 },
    { key: 'type',        header: '合同类型',    width: 14 },
    { key: 'customerName',header: '甲方单位',    width: 28, formatter: (_, row) => row.customer?.name || row.customerName },
    { key: 'totalAmount', header: '合同金额(元)', width: 16, formatter: (v) => Number(v) },
    { key: 'status',      header: '合同状态',    width: 12,
      formatter: (v) => ({ DRAFT: '草稿', PROCESS: '审批中', ACTIVE: '履行中', CLOSED: '已结案' }[String(v)] || String(v)) },
    { key: 'pmName',      header: '负责人',      width: 12 },
    { key: 'deptName',    header: '所属部门',    width: 16 },
    { key: 'signDate',    header: '签订日期',    width: 14,
      formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
    { key: 'startDate',   header: '开始日期',    width: 14,
      formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
    { key: 'endDate',     header: '结束日期',    width: 14,
      formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
    { key: 'remark',      header: '备注',        width: 40 },
];

/**
 * 收款计划导出列定义
 */
export const PAYMENT_PLAN_EXPORT_COLUMNS: ExcelColumn[] = [
    { key: 'contractSerial', header: '合同编号',      width: 16, formatter: (_, row) => row.contract?.serialNo },
    { key: 'contractName',   header: '合同名称',      width: 36, formatter: (_, row) => row.contract?.name },
    { key: 'customerName',   header: '甲方单位',      width: 28, formatter: (_, row) => row.contract?.customer?.name },
    { key: 'phase',          header: '收款期次',      width: 14 },
    { key: 'expectedAmount', header: '计划收款额(元)', width: 16, formatter: (v) => Number(v) },
    { key: 'expectedDate',   header: '预期到款日期',   width: 16,
      formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
    { key: 'condition',      header: '收款条件/里程碑', width: 40 },
    { key: 'status',         header: '节点状态',      width: 12,
      formatter: (v) => ({ UNMET: '未到期', PENDING: '待收款', RECEIVED: '已收款', OVERDUE: '已逾期' }[String(v)] || String(v)) },
];

/**
 * 进账记录导出列定义
 */
export const RECEIPT_EXPORT_COLUMNS: ExcelColumn[] = [
    { key: 'contractSerial', header: '合同编号',    width: 16, formatter: (_, row) => row.contract?.serialNo },
    { key: 'contractName',   header: '合同名称',    width: 36, formatter: (_, row) => row.contract?.name },
    { key: 'customerName',   header: '甲方单位',    width: 28, formatter: (_, row) => row.contract?.customer?.name },
    { key: 'phase',          header: '关联节点',    width: 14, formatter: (_, row) => row.plan?.phase || '未关联' },
    { key: 'amount',         header: '到账金额(元)', width: 16, formatter: (v) => Number(v) },
    { key: 'receiptDate',    header: '到账日期',    width: 14,
      formatter: (v) => v ? new Date(v as string).toLocaleDateString('zh-CN') : '' },
    { key: 'paymentMethod',  header: '收款方式',    width: 14,
      formatter: (v) => ({ BANK_TRANSFER: '银行转账', ACCEPTANCE: '承兑汇票', CASH: '现金', OTHER: '其他' }[String(v)] || String(v)) },
    { key: 'voucherNo',      header: '凭证号',      width: 20 },
    { key: 'handlerName',    header: '经办人',      width: 12 },
    { key: 'remark',         header: '备注',        width: 30 },
];
