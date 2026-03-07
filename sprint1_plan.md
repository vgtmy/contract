# 规划设计院合同管理系统 - Sprint 1 详细实施拆解 (基础设施与基座)

基于总体设计方案，本阶段专注于搭建坚实的底层基座，确保后续核心业务流能够稳健运行。

## 1. Sprint 1 的目标

- 构建规范的 Next.js (App Router) 项目骨架。
- 建立前后端通信与错误处理的标准化机制。
- 实现完整的用户鉴权闭环（登录、登出、会话保持）。
- 落地 RBAC (基于角色的访问控制) 数据结构体系。
- 沉淀高频使用的业务公共组件库。
- **阶段性交付物**：一个可登录、可动态渲染左侧菜单（基于权限）、可查看/管理部门与人员的最小可运行基座系统。

## 2. 需要创建的项目目录结构

*这是基于当前上下文的合理假设：项目采用 Next.js 14+ App Router，TypeScript，Tailwind CSS (可选，或标准 CSS Modules)，以及基于 Prisma/Drizzle 等 ORM 的全栈架构。*

```text
src/
├── app/                  # Next.js App Router 目录 (页面与路由)
│   ├── (auth)/           # 路由组：登录验证相关页面 (无需外层 Layout)
│   │   └── login/page.tsx
│   ├── (dashboard)/      # 路由组：需要登录认证的后台页面 (共享内页 Layout)
│   │   ├── layout.tsx    # 核心后台布局 (左侧菜单、顶部 Header)
│   │   ├── page.tsx      # 工作台首页
│   │   └── system/       # 基础架构管理路由 (RBAC 页面)
│   │       ├── users/page.tsx
│   │       ├── roles/page.tsx
│   │       └── depts/page.tsx
│   ├── api/              # 后端 API 目录
│   │   └── [业务模块]/route.ts
├── components/           # 页面级或通用组件库
│   ├── common/           # 跨业务通用组件 (见清单)
│   ├── layout/           # 布局关联组件 (Sidebar, Header, Breadcrumb)
│   └── business/         # 业务抽离组件 (未来使用)
├── lib/                  # 核心基础设施封装
│   ├── db.ts             # 数据库连接单例
│   ├── auth.ts           # 鉴权/Session 管理工具
│   ├── request.ts        # 前端统一请求封装 (axios/fetch interceptor)
│   └── exceptions.ts     # 后端统一错误处理类
├── services/             # 后端业务逻辑层 (供 API 路由调用)
├── types/                # 全局 TypeScript 类型定义
└── utils/                # 纯工具函数库 (日期格式化、树形菜单转换等)
```

## 3. 需要优先建立的技术基础设施

1. **数据库引擎与ORM集成**：如 PostgreSQL + Prisma。需要首先定义好连接池，确保生产级并发下不泄露。
2. **请求响应标准协议封装**：
   - 后端必须输出统一的 JSON 结构，例如：`{ code: 200, data: [...], message: "success" }`。
   - 前端封装全局请求拦截器（携带 Token/Cookie）与响应拦截器（统一拦截 401 踢出登录、403 权限提示、500 服务错误报错）。
3. **全局状态与配置管理**：应用级状态管理（如 Zustand/Jotai）用于保存当前登录用户信息、折叠/展开菜单状态、全局字典缓存。

## 4. 登录与鉴权方案建议

因为是“规划设计院内部使用的 Web 版”，安全性要求极高，不允许绕过权限拦截：

- **方案**：采用 **JWT + HttpOnly Cookie / NextAuth.js (Auth.js)**。
  - **登录动作**：验证账号密码后，服务端签发 JWT 并将其放置于 HttpOnly、Secure 的 Cookie 中。
  - **请求鉴权**：前端发起 API 请求时自动携带 Cookie，避免前端侧 XSS 窃取 Token。
  - **页面级拦截 (Middleware)**：使用 Next.js 的 `middleware.ts` 进行路由守卫，未登录用户访问 `(dashboard)` 下任意路径，立即将其重定向至 `/login`。
  - **细粒度权限 (按钮级)**：登录成功后，返回该用户的 `permissions` 数组（如 `['sys:user:add', 'biz:contract:view']`）缓存在客户端，用于控制关键按钮（如“删除”、“审批”）的显示或禁用。

## 5. RBAC 基础表与基础接口建议

*这是基于当前上下文的合理假设：需要构建经典的五张表来支撑完备的权限体系。*

**核心五张表设计：**

1. `sys_user`：用户表（账号、密码Hash、姓名、状态、所属部门ID）。
2. `sys_dept`：部门表（部门名称、父级ID(组织树)、负责人ID）。
3. `sys_role`：角色表（角色编码、名称，如 `PM`, `FINANCE_AUDITOR`）。
4. `sys_menu`：菜单与按钮权限表（类型(目录/菜单/按钮)、路径标识、权限字符 `sys:user:edit`、父级ID）。
5. 关联中间表：`sys_user_role`（用户-角色多对多映射） 和 `sys_role_menu`（角色-菜单/权限多对多映射）。

**基础接口清单 (Sprint 1 必做)：**

- `POST /api/auth/login` (登录验证与 Token 签发)
- `GET /api/auth/me` (获取当前登录用户信息及拥有的菜单树、权限码集合)
- `GET /api/system/menus/tree` (加载动态左侧导航树)
- `GET /api/system/depts/tree` (部门组织架构树查询)
- `GET /api/system/users` (分页查询用户列表，支持按部门筛选)
- `POST /api/system/users` (新建用户账户)
- `PUT /api/system/users/[id]` (修改用户信息/状态/重置密码)

## 6. 公共组件清单建议

为后续研发提效并保持交互规范，这批组件需优先封装到位：

1. **统一数据表格 (ProTable)**：封装原生或三方(如 Ant Design/Radix)表格，自带分页逻辑、空状态、加载中状态 (`loading` 拦截)、顶部筛选区折叠，这是系统中最重的 UI 组件。
2. **确权按钮 (AuthButton)**：传入权限码串（如 `authCode="sys:user:delete"`），根据当前登录人权限决定渲染、置灰禁用还是直接隐藏。
3. **二次确认操作组件 (ConfirmAction)**：针对删除、停用等高危操作的标准化 Popover/Modal 确认框组件，统一文案与交互习惯。
4. **部门/人员下拉树择器 (DeptTreeSelect / UserSelect)**：高度复用的表单控件，用于后续指定合同负责人、审批节点等。
5. **全局全屏防抖 Loading 层 (Spiner)**：用于保存大表单、上传文件时的防连击遮罩。

## 7. Sprint 1 推荐开发顺序

遵循“基础支撑 -> 后端接口 -> 前端联调”的最快闭环路线：

1. **Step 1: 项目脚手架与基础工程化 (前端主导)**
   - 初始化 Next.js 项目，配置 TS、Lint、格式化工具。
   - 搭建全局布局 `layout.tsx` (空壳左菜单、顶部条)。
2. **Step 2: 数据库迁移与 ORM 对接 (后端主导)**
   - 编写以上 5 张核心 RBAC 表的结构定义并在开发库建表。
   - 植入管理员种子数据 (Admin 账号) 和基础菜单字典。
3. **Step 3: 鉴权基座与登录闭环 (全栈联调)**
   - 实现 `api/auth/login` 接口并签发凭据。
   - 编写前端登录页表单。
   - 配置 Next.js 中间件进行路由守卫。
4. **Step 4: 动态菜单与工作台空壳**
   - 实现 `/api/auth/me` 读取权限并构建左侧菜单树。
   - 前台对接菜单数据，实现点击路由切换。
5. **Step 5: 部门与用户管理 CRUD**
   - 先写接口，再封装 `ProTable` 公共组件，最后接入页面联调数据。
   - 实现新建账号、分配角色。

## 8. 每一步的完成标准

- **Step 1 完成**：运行项目无报错，浏览器能看到空白后台主框架页。
- **Step 2 完成**：数据库中能看到构建好的表，ORM 探针可通。
- **Step 3 完成**：未登录输入内页地址被踢回登录页；输入管理员账密，成功跳转至工作台，F12 能看到安全的验证 Cookie 或 Header；点击退出能清空凭据。
- **Step 4 完成**：登录后，左侧菜单根据管理员数据库配置正确渲染出“系统管理”、“部门管理”等节点，非授权菜单不显示且强制输入 URL 会导向 403/404。
- **Step 5 完成**：能在页面上新增一个“普通测试员工”并分配一个“测试角色”；该员工能用密码登录且只能看到他被授权的最低限度菜单。所有增删改查有合理的成功/失败的界面提示。
