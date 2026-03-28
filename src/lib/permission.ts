/**
 * 部门权限隔离工具
 *
 * 权限体系说明：
 * - ADMIN:   全局可见，不受部门限制
 * - MANAGER: 可见本部门内所有合同/项目
 * - PM:      只可见自己负责的合同/项目
 *
 * 使用方式：在 API route 中注入过滤条件
 *   const scopeFilter = buildContractScopeFilter(session);
 *   const contracts = await prisma.contract.findMany({ where: { ...scopeFilter, ...otherFilters } });
 */

import type { TokenPayload } from './auth';

/**
 * 合同查询权限过滤条件
 */
export function buildContractScopeFilter(session: TokenPayload) {
    if (session.role === 'ADMIN') {
        // 超级管理员：全局可见
        return {};
    }

    if (session.role === 'MANAGER' && session.deptId) {
        // 部门负责人：可见本部门所有合同
        return { deptId: session.deptId };
    }

    // PM 或未知角色：只能看自己负责的合同
    return { pmId: session.userId };
}

/**
 * 项目查询权限过滤条件
 */
export function buildProjectScopeFilter(session: TokenPayload) {
    if (session.role === 'ADMIN') {
        return {};
    }

    if (session.role === 'MANAGER' && session.deptId) {
        return { deptId: session.deptId };
    }

    return { pmId: session.userId };
}

/**
 * 收款记录权限过滤（通过合同关联）
 * 注意：Prisma 的嵌套 filter 语法
 */
export function buildReceiptScopeFilter(session: TokenPayload) {
    if (session.role === 'ADMIN') {
        return {};
    }

    const contractFilter = session.role === 'MANAGER' && session.deptId
        ? { deptId: session.deptId }
        : { pmId: session.userId };

    return { contract: contractFilter };
}

/**
 * 判断用户是否有某条数据的修改权限
 */
export function canModifyRecord(session: TokenPayload, record: { pmId: string; deptId: string }): boolean {
    if (session.role === 'ADMIN') return true;
    if (session.role === 'MANAGER' && session.deptId && record.deptId === session.deptId) return true;
    if (record.pmId === session.userId) return true;
    return false;
}
