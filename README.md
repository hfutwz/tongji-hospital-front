# 创伤可视化系统 — 前端

同济医院创伤急救数据可视化平台前端项目，基于真实急救抢救室病历数据（2151条患者记录），提供地图热力图、统计分析、患者管理等可视化功能。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 2.6.14 | 前端框架 |
| Vue Router | 3.6.5 | 路由管理 |
| Element UI | 2.15.14 | UI 组件库 |
| ECharts | 5.6.0 | 图表可视化 |
| axios | 1.11.0 | HTTP 请求 |
| Three.js | 0.180.0 | 3D 渲染（人体图） |
| 高德地图 API | — | 地图热力图 & 地理编码 |

---

## 项目结构

```
src/
├── App.vue                          # 根组件（含全局导航）
├── main.js                          # 入口，axios 全局配置
├── router/
│   └── index.js                     # 路由定义 & 登录守卫
├── views/                           # 页面级组件
│   ├── LoginPage.vue                # 登录页
│   ├── PatientListPage.vue          # 患者列表页（默认首页）
│   ├── MapPage.vue                  # 地图热力图页
│   ├── DataVisualizationDashboard.vue  # 大屏可视化看板
│   ├── HourlyStatistics.vue         # 患者数量时间统计页
│   ├── KeyEventsDistributionPage.vue   # 关键事件分布页（路由保留）
│   └── DataImportPage.vue           # 数据导入页（路由保留）
└── components/                      # 可复用组件
    ├── HeatMap.vue                      # 高德地图热力图核心
    ├── MapDataAnimation.vue             # 月度地图动画
    ├── MonthlyTimeHeatmapCore.vue       # 月度×时间段热力矩阵
    ├── ISSDistributionChart.vue         # ISS 评分分布图
    ├── GCSDistributionChart.vue         # GCS 评分分布图
    ├── RTSDistributionChart.vue         # RTS 评分分布图
    ├── InjuryCauseDistributionChartCore.vue  # 伤因分布图
    ├── BodyRegionSunburstWidget.vue     # 身体区域旭日图
    ├── PopulationBodyHeatmapWidget.vue  # 人群身体热力图
    ├── InjuryFigureModal.vue            # 患者个人人体图弹窗
    ├── InterventionTimelineDialog.vue   # 干预时间线弹窗
    ├── GcsScoreModal.vue                # GCS 评分详情弹窗
    ├── RtsScoreModal.vue                # RTS 评分详情弹窗
    ├── PatientInfoOnAdmissionModal.vue  # 入室前信息弹窗
    ├── PatientInfoOffAdmissionModal.vue # 离室后信息弹窗
    ├── PatientOnAdmissionModal.vue      # 入室前信息展示
    ├── PatientOffAdmissionModal.vue     # 离室后信息展示
    ├── PatientListModal.vue             # 患者列表弹窗（图表联动）
    ├── TimeGroupDialog.vue              # 自定义时间段分组弹窗
    └── ImportLoadingModal.vue           # 数据导入进度弹窗
```

---

## 页面功能说明

### 1. 登录页 `/login`
- Session-based 认证（账号：admin，密码：hos123）
- 未登录自动跳转登录页（路由守卫）

### 2. 患者列表页 `/patient-list`（默认首页）
- 分页展示患者基本信息（支持 10/20/50/100/200 条/页）
- 按患者ID、性别、年龄段筛选
- 批量删除患者（含级联删除所有关联数据）
- 批量 Excel 导入
- 每行操作按钮：
  - **查看受伤程度** → 人体图（InjuryFigureModal）
  - **GCS 评分** → GCS 详情弹窗
  - **RTS 评分** → RTS 详情弹窗
  - **入室前信息** → 生命体征、来院方式等
  - **离室后信息** → 转归、去向等
  - **编辑** → 修改患者基本信息
  - **删除** → 删除患者

### 3. 地图热力图 `/map`
- 高德地图展示创伤发生地点
- 热力图模式（发生次数→颜色深浅）
- 筛选条件：季节 / 时间段 / 年份 / 自定义日期范围
- 点击地图标记点 → 弹出该地点患者列表
- 支持编辑/更新患者创伤发生地（含自动 geocoding）

### 4. 每月地图热力图 `/monthly-heatmap`
- 选择年份后逐月动态播放地图热力分布变化
- 展示当月患者总数

### 5. 大屏可视化看板 `/bigscreen`
顶部统计卡片：总患者人数 / 日均患者人数 / 平均干预时间 / 死亡人数（可点击查看死亡患者列表）

图表组件（均支持年份/时间段/日期范围联动筛选）：

| 组件 | 功能 |
|------|------|
| 月度×时间段热力矩阵 | 6个时间段 × 13个月（含汇总列）的二维热力图 |
| ISS 评分分布图 | 轻伤(≤16) / 重伤(16-25) / 严重伤(>25) 占比 |
| GCS 评分分布图 | 意识清楚(15) / 轻度障碍(12-14) / 中度(9-11) / 昏迷(3-8) |
| RTS 评分分布图 | 按 RTS 分值（0-4）分布 |
| 伤因分布图 | 交通伤 / 高坠伤 / 机械伤 / 跌倒 / 其他 |
| 身体区域旭日图 | 部位（头颈/面部/胸部/腹部/四肢/体表）× 严重程度层级 |
| 人群身体热力图 | 按年龄组 / 性别 / 严重程度过滤，显示群体受伤部位分布 |

点击图表元素 → 弹出对应条件的患者列表。

### 6. 患者数量统计 `/hourly`
- 按时间段展示患者数量分布（柱状图）
- 支持**自定义时间段分组**（用户可合并任意小时区间）
- 筛选：年份 / 季节 / 自定义日期范围
- 展示汇总统计：总病例数 / 峰值组别 / 每组平均 / 分组数量

### 7. 关键事件分布 `/key-events-distribution`（路由保留，导航已隐藏）
- 展示所有关键医疗干预事件的正态分布曲线
- 含均值线、标准差、质控线

### 8. 数据导入 `/data-import`（路由保留，导航已隐藏）
- 上传 Excel 文件，一次性导入 9 张数据库表
- 字段校验 + 错误报告（CSV 格式，可下载）
- 错误超过 50 条时展示前 50 条，其余引导下载完整报告

---

## 时间分段规则

| 编号 | 名称 | 时间范围 |
|------|------|---------|
| 0 | 夜间 | 00:00–07:59 |
| 1 | 早高峰 | 08:00–09:59 |
| 2 | 午高峰 | 10:00–11:59 |
| 3 | 下午 | 12:00–16:59 |
| 4 | 晚高峰 | 17:00–19:59 |
| 5 | 晚上 | 20:00–23:59 |

## 季节分段规则

| 编号 | 名称 | 月份范围 |
|------|------|---------|
| 0 | 春季 | 3–5月 |
| 1 | 夏季 | 6–9月 |
| 2 | 秋季 | 10–12月 |
| 3 | 冬季 | 1–2月 |

---

## 本地开发

### 环境要求
- Node.js ≥ 14
- npm ≥ 6

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run serve
# 默认运行在 http://localhost:8001
# API 请求代理到 http://localhost:9090
```

### 生产打包
```bash
npm run build        # 生产环境（API 使用相对路径，由 Nginx 代理）
npm run build:dev    # 开发环境配置打包（测试用）
```

### 环境变量
| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境，`VUE_APP_API_BASE_URL=http://localhost:9090` |
| `.env.production` | 生产环境，`VUE_APP_API_BASE_URL=`（空，由 Nginx 反向代理） |

---

## 后端配合

后端项目：[tongji-hospital-back](https://github.com/hfutwz/tongji-hospital-back)

- 后端默认端口：`9090`
- 前端开发时通过 `vue.config.js` 的 proxy 代理 `/api` 请求
- 生产部署时由 Nginx 将 `/api` 反向代理至后端

---

## 开发分支规范

- **main 分支禁止直接开发**
- 每次新需求从 main 签出新分支：`git checkout -b feature/xxx`
- 开发完成后 push 到远端，由项目负责人发起 PR 合并

---

## 待开发

- 预测功能（时空因导算法）：根据历史数据预测某地某时段某种创伤的发生概率
