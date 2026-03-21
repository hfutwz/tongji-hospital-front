# 创伤可视化系统 — 前端

同济医院创伤急救数据可视化平台前端项目，基于真实急救抢救室病历数据（2151条患者记录、272个字段），为急诊科医生和医院管理者提供地图热力图、统计分析、患者管理等可视化功能。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue.js | 2.6.14 | 前端框架 |
| Vue Router | 3.6.5 | 路由管理（history 模式，含登录守卫） |
| Element UI | 2.15.14 | UI 组件库 |
| ECharts | 5.6.0 | 图表可视化（热力图、旭日图、分布图等） |
| Three.js | 0.180.0 | 3D 渲染（人体伤情图） |
| axios | 1.11.0 | HTTP 请求（携带 credentials，Session 认证） |
| 腾讯地图 API | — | 地图热力图渲染 & 地理编码 |

---

## 项目结构

```
src/
├── App.vue                                  # 根组件（含全局导航栏）
├── main.js                                  # 入口，axios 全局配置（baseURL、interceptors）
├── router/
│   └── index.js                             # 路由定义 & 登录守卫
├── views/                                   # 页面级组件
│   ├── LoginPage.vue                        # 登录页
│   ├── PatientListPage.vue                  # 患者列表（默认首页 /patient-list）
│   ├── MapPage.vue                          # 地图热力图页面
│   ├── DataVisualizationDashboard.vue       # 大屏可视化看板
│   ├── HourlyStatistics.vue                 # 自定义时间段分组统计
│   ├── KeyEventsDistributionPage.vue        # 关键事件正态分布页面
│   └── DataImportPage.vue                   # 数据导入页面
└── components/                              # 可复用组件
    ├── HeatMap.vue                          # 地图热力图（筛选：年份/季节/时段/日期范围）
    ├── MapDataAnimation.vue                 # 月度地图动画（逐月播放）
    ├── PopulationBodyHeatmapWidget.vue      # 人群身体热力图
    ├── BodyRegionSunburstWidget.vue         # 身体区域旭日图（部位×严重程度）
    ├── ISSDistributionChart.vue             # ISS 分布图
    ├── GCSDistributionChart.vue             # GCS 分布图
    ├── RTSDistributionChart.vue             # RTS 分布图
    ├── InjuryCauseDistributionChartCore.vue # 伤因分布图
    ├── MonthlyTimeHeatmapCore.vue           # 月度×时间段热力矩阵
    ├── InterventionTimelineDialog.vue       # 干预时间线弹窗
    ├── InjuryFigureModal.vue                # 人体伤情图弹窗（Three.js）
    ├── PatientListModal.vue                 # 患者列表弹窗（地图点击触发）
    ├── PatientOnAdmissionModal.vue          # 入室信息弹窗
    ├── PatientOffAdmissionModal.vue         # 离室信息弹窗
    ├── PatientInfoOnAdmissionModal.vue      # 入室详情弹窗
    ├── PatientInfoOffAdmissionModal.vue     # 离室详情弹窗
    ├── GcsScoreModal.vue                    # GCS 评分详情弹窗
    ├── RtsScoreModal.vue                    # RTS 评分详情弹窗
    ├── TimeGroupDialog.vue                  # 自定义时间段分组弹窗
    └── ImportLoadingModal.vue               # 数据导入进度弹窗
```

---

## 路由结构

| 路径 | 页面 | 描述 |
|------|------|------|
| `/login` | LoginPage | 登录页（无需认证） |
| `/` | → `/patient-list` | 自动重定向 |
| `/patient-list` | PatientListPage | 患者列表（默认首页） |
| `/map` | MapPage | 地图热力图 |
| `/bigscreen` | DataVisualizationDashboard | 大屏可视化看板 |
| `/hourly` | HourlyStatistics | 自定义时段分组统计 |
| `/key-events-distribution` | KeyEventsDistributionPage | 关键事件正态分布 |
| `/monthly-heatmap` | MapDataAnimation | 月度地图动画 |
| `/data-import` | DataImportPage | 数据导入 |

> 所有页面（除 `/login`）均需登录认证。路由守卫通过 `GET /api/auth/status` 检查 Session 状态，未登录自动跳转 `/login`。

---

## 主要功能模块

### 1. 登录认证
- Session-based 认证，axios 全局启用 `withCredentials`
- 响应拦截器捕获 401，自动跳转登录页

### 2. 患者列表（PatientListPage）
- 分页展示患者信息（支持 10/20/50/100/200 条/页）
- 多条件筛选：患者 ID、性别、年龄范围
- 患者详情弹窗：基础信息、入室/离室信息、GCS/RTS 评分、人体伤情图
- 批量删除

### 3. 地图热力图（HeatMap）
- 腾讯地图渲染创伤发生地热力图
- 筛选维度：年份（多选）、季节、时间段、自定义日期范围
- 点击地点标记，弹出该地点患者列表

### 4. 月度地图动画（MapDataAnimation）
- 按年份逐月播放热力图动态演变
- 支持暂停/继续

### 5. 大屏可视化看板（DataVisualizationDashboard）
- 统计摘要卡片：总患者数、日均接诊、平均干预时间、死亡人数
- ISS 分布图、GCS 分布图、RTS 分布图
- 伤因分布图（5类：交通伤、高坠伤、机械伤、跌倒、其他）
- 身体区域旭日图（6部位×严重程度）
- 人群身体热力图（高频受伤部位热力展示）
- 月度×时间段热力矩阵

### 6. 关键事件正态分布（KeyEventsDistributionPage）
- 干预关键事件（气管插管、心肺复苏、输血等）的时间分布正态曲线
- 非关键干预事件分布对比

### 7. 自定义时段分组统计（HourlyStatistics）
- 用户自定义时间段分组方式
- 各时段伤情统计对比

### 8. 数据导入（DataImportPage）
- Excel 文件上传，拖拽 & 点击均可
- 导入进度实时展示
- 导入结果摘要：成功行数、错误行数及详细错误列表

---

## 时间与季节分段（以代码为准）

### 时间段

| 编号 | 名称 | 时间范围 | key |
|------|------|---------|-----|
| 0 | 夜间 | 00:00–07:59 | night |
| 1 | 早高峰 | 08:00–09:59 | morning_peak |
| 2 | 午高峰 | 10:00–11:59 | noon_peak |
| 3 | 下午 | 12:00–16:59 | afternoon |
| 4 | 晚高峰 | 17:00–19:59 | evening_peak |
| 5 | 晚上 | 20:00–23:59 | evening |

### 季节

| 编号 | 名称 | 月份 |
|------|------|------|
| 0 | 春季 | 3–5月 |
| 1 | 夏季 | 6–9月 |
| 2 | 秋季 | 10–12月 |
| 3 | 冬季 | 1–2月 |

---

## 开发与部署

### 本地开发

```bash
npm install
npm run serve
# 访问 http://localhost:8080
# API 请求通过 vue.config.js proxy 转发到后端 http://localhost:9090
```

### 生产构建

```bash
npm run build:prod
# 产出 dist/ 目录，由 Nginx 托管
# Nginx 反向代理 /api/* → 后端 9090 端口
```

### 环境变量

| 变量 | 说明 |
|------|------|
| `VUE_APP_API_BASE_URL` | API 基础路径（生产留空，使用相对路径由 Nginx 代理） |
| `VUE_APP_ENV` | 环境标识（development / production） |
| `VUE_APP_DEBUG` | 开发环境调试日志开关 |

---

## 相关仓库

- 后端：[tongji-hospital-back](https://github.com/hfutwz/tongji-hospital-back)
