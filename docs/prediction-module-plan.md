# 创伤预测模块实施规划（四类预测）

本文档对应产品需求的四类预测能力，说明**前端展示**、**后端代理**与**预测服务**的分工与改造要点。  
**说明**：类型 1「全部」聚合、类型 3/4 新接口及 Java 代理已实现；前端已对接。

---

## 一、需求对照表

| 类型 | 业务描述 | 查询条件 | 展示内容 | 现有能力 | 缺口 |
|------|----------|----------|----------|----------|------|
| **1** | 在给定时空与行政条件下，预测**伤因概率分布** | 时段、季节、地区（均支持「全部」） | 伤因概率分布图（+ 明细表） | `POST /api/prediction/comprehensive` 支持时段 + 可选季节 + 可选地区 | 时段、季节、地区任一为「全部」时需**服务端聚合**（当前综合预测要求明确 `time_period`） |
| **2** | 对**某一伤因**，看其在历史数据中的**时间**与**空间**分布 | 伤因 | 季节分布、时段分布、**地区分布** | `GET .../time-distribution`（时段+季节）；`GET .../district-distribution?injury_cause=`（地区计数） | 前端合并两次请求即可；若需单一接口可再封装 |
| **3** | 对**某一地区**，看创伤的**时间**与**伤因**分布 | 地区 | 季节分布、时段分布、伤因分布 | 无 | 需新接口：如 `GET /predict/by-district-profile?district=` 返回 `{ period, season, causes }` 或等价结构 |
| **4** | 在**某时段**某**伤因**下，看**空间（地区）分布** | 时段、伤因 | 地区分布 | `district-distribution` 可按伤因过滤，**未按时段过滤** | 需新接口：如 `GET /predict/district-by-period-cause?time_period=&injury_cause=` |

### 枚举口径（与界面一致）

- **地区**：黄浦区、徐汇区、长宁区、静安区、普陀区、虹口区、杨浦区、浦东新区、闵行区、宝山区、嘉定区、金山区、松江区、青浦区、奉贤区、崇明区，以及 **全部**。
- **季节**：春季（3–5 月）、夏季（6–9 月）、秋季（10–12 月）、冬季（1–2 月），以及 **全部**（与模型内 `0–3` 索引一致）。
- **时段**：夜间(0–7 时)、早高峰(8–9 时)、午高峰(10–11 时)、下午(12–16 时)、晚高峰(17–19 时)、晚上(20–23 时)，以及 **全部**（与模型内 `0–5` 索引一致）。
- **伤因**：交通伤、高坠伤、机械伤、跌倒、其他（与模型 `0–4` 一致）。

---

## 二、前端该怎么做

1. **信息架构**  
   - 使用 **4 个页签**（或分组）一一对应上表类型，避免与旧版「时段→伤因 / 季节→伤因」多入口重复。  
   - 统一从 `src/utils/predictionOptions.js` 读取下拉枚举，保证文案与「全部」语义一致。

2. **类型 1**  
   - 表单：时段、季节、地区三列下拉（含「全部」）。  
   - 展示：复用 `PredictionResultBlock`（`probabilities` 柱状图 + 表）。  
   - **当前**：若选「全部时段」，不调接口并提示需后端支持；否则调用 `comprehensive`，季节/地区为「全部」时不传对应字段。

3. **类型 2**  
   - 表单：仅伤因。  
   - 请求：`Promise.all` 并行 `time-distribution` 与 `district-distribution`（带 `injury_cause`）。  
   - 展示：独立组件 `PredictionTripleDistributionBlock`（上排时段+季节柱图，下排地区条形图）。

4. **类型 3、4**  
   - 表单与布局先就绪；结果区 **占位提示**「接口待对接」，并在本文档中锁定契约，避免前后端理解偏差。

5. **体验**  
   - 各页签独立 `loading` / 错误提示；窗口 `resize` 时图表 `resize`（在图表组件内处理）。

---

## 三、后端该怎么做（后续迭代）

1. **代理层**（`PredictionController` 等）  
   - 保留现有路径；新增类型 3、4 的转发方法，路径建议：  
     - `GET /api/prediction/district-profile?district=`  
     - `GET /api/prediction/district-by-period-cause?time_period=&injury_cause=`  
   - 类型 1 扩展：若预测服务支持「全部」维度，可增加可选参数或单独聚合接口，由 Spring 透传。

2. **统一响应**  
   - 继续封装为 `Result<T>`；错误信息与现网一致。

3. **参数校验**  
   - 地区名与白名单一致（防止注入与脏数据）；`time_period`、`injury_cause` 范围与模型一致。

---

## 四、预测服务（Python）该怎么改（后续迭代）

1. **类型 1**  
   - 在统计模型中实现：某一维为「全部」时对相应边际分布求和/归一化，输出与现有 `_fmt` 相同结构的 `probabilities` + `top_cause` 等。  
   - `comprehensive` 或新路由接收可选 `time_period` / `season` / `district`，允许 `null` 表示「全部」。

2. **类型 2**  
   - 已具备能力时可不改动；若需性能可合并为单接口减少往返。

3. **类型 3**（新）  
   - 输入：`district`（字符串）。  
   - 输出示例：`{ "period": { "<时段名>": 占比 }, "season": { ... }, "causes": { "<伤因名>": 占比 } }`，与前端图表组件字段对齐。

4. **类型 4**（新）  
   - 输入：`time_period`、`injury_cause`。  
   - 输出：与现 `district-distribution` 相同形态（`{ "<区名>": 计数或占比 }`），或增加 `normalized: true` 字段由前端统一处理。

5. **文档与版本**  
   - OpenAPI / README 更新；模型版本号写入响应供大屏展示。

---

## 五、执行顺序建议

1. 前端：四类 Tab + 枚举常量 + 类型 1/2 对接现有接口 + 类型 3/4 占位（**当前仓库迭代**）。  
2. 预测服务：实现类型 3、4 与类型 1「全部」聚合。  
3. 后端：增加代理与集成测试。  
4. 前端：去掉占位，联调真实数据。

---

## 六、修订记录

- 2026-04-06：初版（与前端 `predictionOptions.js`、预测页重构同步）。
- 2026-04-06：预测服务 `comprehensive` 支持 `time_period`/`season`/`district` 为 null（全部）；新增 `GET /predict/district-profile`、`GET /predict/district-by-period-cause`；Java `PredictionController` 增加 `/api/prediction/district-profile`、`/api/prediction/district-by-period-cause` 及地区白名单校验。
