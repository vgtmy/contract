# RBAC 数据模型与接口设计方案 (Sprint 1 核心基座)

为了支撑规划设计院合同管理系统的权限流转，本阶段优先落地部门、角色、用户三层核心架构。
我们推荐采用 **Prisma** 作为 ORM 引擎，以下是设计的 Schema 字典与后台接口规范。

---

## 1. 数据模型设计 (基于 Prisma Schema)

主要包含四张表：`sys_dept` (部门), `sys_role` (角色), `sys_user` (用户), `sys_user_role` (关联映射)。为了保证日志追溯，均附带通用审计字段(`createdAt`, `updatedAt`)。

```prisma
// 核心模型设计参考

// 1. 部门表 (支持树形结构)
model Dept {
  id        String   @id @default(uuid())
  name      String   // 部门名称 (如：市政规划一所)
  parentId  String?  // 父级部门 ID (顶层为空)
  managerId String?  // 部门负责人 ID (选填，对应 User ID)
  sort      Int      @default(0) // 排序号
  
  users     User[]   // 此部门下的员工集合
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("sys_dept")
}

// 2. 角色表
model Role {
  id          String   @id @default(uuid())
  code        String   @unique // 角色编码 (如：PM, FINANCE)
  name        String   // 角色显示名 (如：项目经理, 财务专员)
  description String?  // 职责描述
  
  userRoles   UserRole[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("sys_role")
}

// 3. 用户表
model User {
  id        String   @id @default(uuid())
  username  String   @unique // 登录名/工号
  password  String   // bcrypt hash 处理后的密码
  name      String   // 真实姓名 (如：张三)
  status    Int      @default(1) // 1=正常, 0=停用
  
  deptId    String?  // 冗余所属主要部门
  dept      Dept?    @relation(fields: [deptId], references: [id])
  
  userRoles UserRole[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("sys_user")
}

// 4. 用户与角色多对多映射表
model UserRole {
  userId    String
  roleId    String
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@id([userId, roleId]) // 联合主键
  @@map("sys_user_role")
}
```

*（注：本阶段不做大颗粒度“权限资源表 MenuItem”，留待后续阶段扩展按钮级别控制，第一版以“大角色”鉴权为主，满足最小可用标准。）*

---

## 2. API 接口设计规范 (RESTful 风格)

所有接口统一挂载在 `/api/system/...` 路径下，保持输出结构为 `{ code: 200, data: ANY, message: string }`。

### 部门管理 (Dept)

* `GET /api/system/depts`
  * **作用**：获取所有部门（可传入 `?tree=1` 要求后端返回基于 `parentId` 组装好的层级树，方便前端级联下拉组件渲染）。
* `POST /api/system/depts`
  * **作用**：创建新部门（需传入 `name`, `parentId`）。
* `PUT /api/system/depts/[id]`
  * **作用**：更新/重命名部门及调整上级部门。
* `DELETE /api/system/depts/[id]`
  * **安全要求**：如果该部门下方还关联有子部门或挂载着用户，则拒绝删除并抛出 400 提示。

### 角色管理 (Role)

* `GET /api/system/roles`
  * **作用**：获取全量/分页角色列表，供用户分配时多选。
* `POST /api/system/roles`
  * **入参**：`{ code: "FINANCE", name: "财务专员", description: "审核发票" }`。
* `DELETE /api/system/roles/[id]`
  * **安全要求**：如果有关联用户则给出阻断提示。

### 用户管理 (User)

* `GET /api/system/users`
  * **入参**：支持按 `deptId`、`username` 模糊搜索与分页。
  * **出参**：列表元素需 `include` 其所属的部门名称及当前具备的 `role` 集合的精简快照。
* `POST /api/system/users`
  * **核心逻辑**：
        1. 检查 `username` 是否重复。
        2. 对密码明文进行 bcrypt 加盐 Hash（服务端强制）。
        3. 保存基本信息。
        4. (可选) 同步在 `sys_user_role` 表中插入多条角色绑定关系。
* `PUT /api/system/users/[id]/roles`
  * **作用**：专设一个子资源端点，用于快速调整某人的角色。
  * **入参**：`{ roleIds: ["id1", "id2"] }`，由于是全量覆盖，后端先 `DELETE` 旧关系，再批量 `INSERT` 新关系。
