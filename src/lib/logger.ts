import prisma from './db';
import { getSession } from './auth';

type AuditModule = 'AUTH' | 'CONTRACT' | 'PAYMENT_PLAN' | 'RECEIPT' | 'INVOICE' | 'FILE' | 'EXPORT';
type AuditAction = 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';

interface LogOptions {
    module: AuditModule;
    action: AuditAction;
    targetId?: string;
    summary: string;
    result?: 'SUCCESS' | 'FAIL';
}

/**
 * 核心服务端操作审计钩子
 * 在任意 Server Component 或 API Route 内注入，无缝收集操作人与动作痕迹
 */
export async function logAction(options: LogOptions) {
    try {
        // 自动抓取当前安全防线的上下文信息
        const session = await getSession();

        // Fallback if not strictly bound to a user context (should rarely happen in secured APIs)
        const operatorId = session?.userId || 'SYSTEM_AUTO';
        const operatorName = session?.name || '系统托管进程';
        const role = session?.role || null;

        // Actually we only mock department in `session` on Manager role previously, 
        // for a fully flushed out system you would query `sys_user` here, but for MVP:
        let deptName = null;
        if (session?.role === 'manager' || session?.role === 'pm') {
            deptName = '所在关联架构';
        }

        await prisma.sysAuditLog.create({
            data: {
                operatorId,
                operatorName,
                deptName,
                role,
                module: options.module,
                actionType: options.action,
                targetId: options.targetId,
                summary: options.summary,
                result: options.result || 'SUCCESS' // defaults to SUCCESS unless specified
            }
        });
    } catch (error) {
        // Audit logs strictly MUST NOT crash the main business transaction line if it fails.
        console.error('CRITICAL: Audit log failure during side-channel emission', error);
    }
}
