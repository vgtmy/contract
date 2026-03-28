import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const getJwtSecretKey = () => {
    // In production, this should be pulled from process.env.JWT_SECRET
    // For Sprint 1, we use a hardcoded fallback
    const secret = process.env.JWT_SECRET || 'super-secret-key-for-sprint-1-only';
    return new TextEncoder().encode(secret);
};

export interface TokenPayload {
    userId: string;
    role: string;      // ADMIN | MANAGER | PM
    name: string;
    deptId?: string;   // 所属部门 ID（ADMIN 为空，全局可见）
    deptName?: string; // 部门名称（冗余）
}

export async function signToken(payload: TokenPayload): Promise<string> {
    // Token expires in 8 hours
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(getJwtSecretKey());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey());
        return payload as unknown as TokenPayload;
    } catch (error) {
        return null;
    }
}

export const AUTH_COOKIE_NAME = 'auth_token';

// Server-side helper to get the current user session from the cookie
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;
    return await verifyToken(token);
}

// Helper to set the auth cookie after successful login
export async function setSessionToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
    });
}

// Helper to clear the auth cookie on logout
export async function clearSessionToken() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
}
