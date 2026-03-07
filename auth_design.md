# 鉴权与登录方案设计 (Sprint 1)

依据“正式商用后台系统”标准，本项目采用 **JWT (JSON Web Token) + HttpOnly Cookie** 的无状态鉴权方案。

## 1. 方案选择与依据

- **安全性高**：Token 存储在 `HttpOnly` Cookie 中，彻底杜绝前端 XSS 攻击窃取凭证。
- **无缝路由拦截**：得益于 Next.js 的机制，`Middleware` 可直接在 Edge 边缘节点读取 Cookie 并验证 JWT 签名，实现未登录访问的瞬间重定向，无白屏闪烁。
- **扩展性强**：无状态 JWT 利于后续多实例部署或微服务拆分。

## 2. 最小运行闭环设计

本阶段不连接真实数据库，采用 Mock 逻辑完成闭环验证：

### 核心节点

1. **统一后端密钥库 (`lib/auth.ts`)**
   - 封装 `signToken` 和 `verifyToken` (使用 `jose` 库以支持 Next.js Edge 运行时)。
   - 封装设置与清除 Cookie 的快捷函数。

2. **登录接口 (`api/auth/login/route.ts`)**
   - 接收 Frontend 提交的账密。
   - **Mock**: 验证若是 `admin/123456`，则签发 JWT 包含 (id=1, role=ADMIN)，并在 Response 设置 HttpOnly Cookie。

3. **用户信息接口 (`api/auth/me/route.ts`)**
   - 从 Request Cookie 中解析 JWT。
   - 返回当前用户的详细菜单和权限树 (Sprint 1 暂时 Mock)。

4. **边缘路由守卫 (`middleware.ts`)**
   - 拦截所有进入 `/` 或 `/(dashboard)/*` 的请求。
   - 检测 Cookie 中的 JWT 并校验有效性。
   - 无效或未登录则实施 `302 Redirect` 至 `/login`。

5. **前端登录视图与状态管理**
   - 更新 `app/(auth)/login/page.tsx`，接入真实 Fetch 调用。
   - 全局状态 (通过 React Context 或 Zustand，本阶段先用简单的 Provider) 注入 `me` 接口数据，供 Header 和 AuthButton 消费。
