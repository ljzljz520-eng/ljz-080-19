# 幸福里社区养老协作平台

面向社区养老场景的协作平台，本次交付**活动报名闭环**（不是单向发公告）：
老人报名健康讲座 / 义剪 / 节日聚餐时登记照护信息，活动当天志愿者凭照护名单签到照护，
活动结束后回填参与记录，用于后续更精准的服务推荐。

## 技术栈

- **前端**：React 19 + TypeScript + Vite，React Router v7
  - 老人/志愿者 H5：antd-mobile（大字号、大按钮、数字键盘签到）
  - 运营管理端 PC：antd v6
  - LESS 主题
- **后端**：Node.js 20 + NestJS 11 + TypeScript
- **数据库**：Supabase Postgres（建表脚本见 `apps/server/supabase/schema.sql`）；
  未配置 Supabase 时自动降级为**内存存储 + 种子数据**，开箱即可演示完整流程。

## 目录

```
apps/
  client/                # 前端（H5 与管理端为同一 SPA 的两个入口）
    src/h5/              # 老人 / 志愿者 H5（/h5）
    src/admin/           # 运营管理端（/admin）
    src/shared/          # 类型、API 封装、常量
  server/                # NestJS 后端
    src/activities/      # 活动发布与名额/轮椅位统计
    src/registrations/   # 报名登记、防重复、志愿者分配、照护名单
    src/checkin/         # 签到码签到 / 名单签到 / 结束活动（爽约标记）
    src/participants/    # 老人档案、参与记录回填、服务推荐
    src/volunteers/      # 志愿者
    src/database/        # Supabase 客户端（内存降级）
    supabase/schema.sql  # 数据表
```

## 本地开发

```bash
npm install

# 后端（默认 3000 端口）
npm run start:dev --workspace=server

# 前端（3000 端口，/api 代理到后端；可通过 VITE_API_TARGET 修改）
npm run dev --workspace=client
```

打开：

- H5：http://localhost:3000/h5 （底部 4 个 Tab：活动报名 / 我的报名 / 活动签到 / 志愿者）
- 管理端：http://localhost:3000/admin （活动与报名管理 / 参与记录与推荐）

Docker：

```bash
docker compose up --build
# 前端 http://localhost:3000，后端 http://localhost:8000
```

配置真实 Supabase：设置环境变量 `SUPABASE_URL`、`SUPABASE_KEY`，并执行 `schema.sql`。

## 业务闭环

1. **发活动**（管理端）：标题、类型（健康讲座/义剪/节日聚餐）、时间地点、
   总名额、**轮椅位数**、是否供餐、是否接送、负责志愿者。
2. **老人报名**（H5）：选择已建档老人或现场新建档，登记
   - 行动能力（自理 / 行动迟缓 / 需助行器 / 依靠轮椅）
   - 是否预留**轮椅位**（与轮椅位数联动，订满即拒）
   - **饮食禁忌**（标签快捷选择 + 自定义，聚餐据此备餐）
   - **接送需求**（不需要 / 接来 / 往返，含接送地址）
   - 紧急联系人与照护备注
   - 提交后生成 **6 位签到码**；系统按默认照护关系/负载自动分配负责志愿者。
   - 校验：名额、轮椅位、重复报名、接送地址、紧急联系电话。
3. **活动当天**：
   - 签到台（H5）输入 6 位码签到，立刻显示该老人的行动能力/禁忌/接送/紧急联系人。
   - 志愿者工作台（H5）只看到**自己负责**的老人名单，按照护优先级排序，
     可左滑或按钮逐个签到；名单含轮椅位、禁忌、接送地址、照护备注、紧急联系人。
   - 管理端总名单可搜索、按状态筛选、手动签到。
4. **结束活动**：未签到者自动标记“爽约”。
5. **回填参与记录**（管理端）：是否参加、实际是否使用轮椅位/接送、聚餐用餐情况、
   照护小结、服务标签；系统再自动补充“使用轮椅位/接送、关注慢病管理”等标签。
6. **服务推荐**：按历史参与标签、慢病备注、行动能力、轮椅/接送需求对后续活动打分，
   轮椅位不足或不提供接送的活动降权，帮助社区推荐更合适的服务。

## 主要接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/POST | `/api/activities` | 活动列表（含报名/轮椅位统计）/ 发布 |
| GET | `/api/activities/:id/roster` | 活动总照护名单 |
| GET | `/api/volunteers/:id/roster?activityId=` | 志愿者本人照护名单 |
| POST | `/api/registrations` | 报名（照护信息登记） |
| POST | `/api/activities/:id/checkin` | 签到码签到 |
| POST | `/api/registrations/:id/checkin` | 名单内确认签到 |
| POST | `/api/activities/:id/finish` | 结束活动并标记爽约 |
| POST | `/api/participation-records` | 回填参与记录 |
| GET | `/api/participants/:id/participation-records` | 老人参与历史 |
| GET | `/api/participants/:id/recommendations` | 后续服务推荐 |

## 演示数据（内存模式）

预置 2 名志愿者、4 位老人（含轮椅老人、糖尿病/海鲜过敏等）、3 场活动与若干报名，
签到码例如：`482910`（张桂兰）、`736502`（赵德海）、`205847`（孙秀珍）。
