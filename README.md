# 社区养老协作平台 — 活动报名与照护协作

面向社区养老场景：**活动报名不是发公告**。老人报名健康讲座、义剪、节日聚餐时
登记行动能力、轮椅位、饮食禁忌与接送需求；活动当天签到后，志愿者在手机上看到
自己负责照护的老人名单；活动结束后回填参与记录，系统据此推荐更合适的后续服务。

## 技术栈

- **前端（双入口）**：React 19 + TypeScript + Vite + LESS
  - 用户端 H5（`index.html`，antd-mobile）：活动浏览/报名、我的报名、志愿者照护名单
  - 管理端 PC（`admin.html`，antd）：活动发布、报名管理、志愿者分工、现场签到台、记录回填、服务推荐
- **后端**：NestJS 11 + TypeScript（REST API，`/api` 前缀）
- **数据库**：Supabase PostgreSQL（建表脚本 `apps/server/supabase/schema.sql`）
  - 当前运行时内置内存存储 + 种子数据（零依赖即可演示）；表结构与 SQL 一一对应，可平滑切换到 Supabase

## 本地运行

```bash
# 安装依赖（根目录 workspace）
npm install --legacy-peer-deps

# 后端（默认 3000）
cd apps/server && npm run start:dev

# 前端（5173，/api 代理到 3000）
cd apps/client && npm run dev
```

- 用户端 H5：http://localhost:5173/  （底部「志愿者」Tab 可切换到志愿者视角）
- 管理端 PC：http://localhost:5173/admin.html

```bash
docker compose up   # 前端 :3000（/admin 为管理端），后端 :8000，DB :5432
```

## 业务流程

```
发布活动(名额/轮椅位/接送车位)
   └─ 老人 H5 报名：行动能力 · 轮椅位 · 饮食禁忌 · 接送地址/时间/联系人 · 备注
        └─ 管理端安排志愿者分工（按照护等级/驾驶能力校验）
             └─ 活动当天现场签到（签到台：待签到/已签到、可撤销）
                  └─ 志愿者 H5 只看自己负责、已签到的老人 + 照护要点 + 一键拨号
                       └─ 活动结束回填参与记录（讲座主题/义剪项目/用餐/健康观察/满意度）
                            └─ 老人档案页生成照护提示与后续活动/服务推荐
```

## 关键规则

- **名额三类独立校验**：总名额、轮椅位数、接送车位数；取消报名自动释放
- **照护信息为报名快照**：默认带出老人档案，允许按本场修改，活动当天以快照为准
- **分工能力校验**：志愿者 `maxCareLevel` 需覆盖老人行动能力；接送分工要求可驾驶
- **签到可见性**：志愿者名单仅包含分配给自己的老人，避免信息过载/越权
- **状态机**：报名中 → 进行中 → 已结束；结束时未签到自动记为缺席并提示回访
- **推荐引擎**：结合慢病、行动能力、饮食禁忌与历史参与（关注主题、缺席、现场观察）输出可解释推荐

## API 摘要

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/POST | `/api/activities` | 活动列表/发布 |
| GET | `/api/activities/:id/detail` | 活动 + 报名名单（含分工、记录） |
| PATCH | `/api/activities/:id/transition` | 开始/结束/取消 |
| POST | `/api/registrations` | 报名（照护信息登记+名额校验） |
| POST | `/api/registrations/:id/assign` | 志愿者照护分工 |
| POST | `/api/activities/:id/checkin` | 现场签到 |
| GET | `/api/activities/:id/roster?volunteerId=` | 志愿者当天照护名单 |
| POST | `/api/records/registrations/:id` | 回填参与记录 |
| GET | `/api/records/elders/:id/recommend` | 后续服务推荐 |

## 项目结构

```
apps/
  client/
    index.html / admin.html      # H5 / PC 双入口
    src/h5/                      # 用户端（活动、报名、我的、志愿者照护台）
    src/admin/                   # 管理端（工作台、活动管理、老人档案与推荐）
    src/api/                     # 共享 API 封装与类型
  server/
    src/activities registrations checkins records elders volunteers
    supabase/schema.sql          # Supabase 建表脚本
    test/app.e2e-spec.ts         # 报名→分工→签到→名单→回填→推荐 e2e
```
