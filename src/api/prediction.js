/**
 * 预测服务 API 封装
 * 对应后端 PredictionController (/api/prediction/*)
 */
import axios from 'axios'

/**
 * T5: 时段（+可选季节）→ 伤因概率分布
 * @param {number} timePeriod 0夜间/1早高峰/2午高峰/3下午/4晚高峰/5晚上
 * @param {number|null} season 0春/1夏/2秋/3冬，null表示不限
 */
export function getCauseByPeriod(timePeriod, season = null) {
  const params = { time_period: timePeriod }
  if (season !== null && season !== undefined) params.season = season
  return axios.get('/api/prediction/cause-by-period', { params }).then(r => r.data.data)
}

/**
 * T2: 季节 → 伤因概率分布
 * @param {number} season 0春/1夏/2秋/3冬
 */
export function getCauseBySeason(season) {
  return axios.get('/api/prediction/cause-by-season', { params: { season } }).then(r => r.data.data)
}

/**
 * T4: 地区 → 伤因概率分布
 * @param {string} district 上海行政区名，如"宝山区"
 */
export function getCauseByDistrict(district) {
  return axios.get('/api/prediction/cause-by-district', { params: { district } }).then(r => r.data.data)
}

/**
 * T1: 综合预测（区域 + 时段 + 季节）
 * @param {object} params { time_period, season, district }
 */
export function getComprehensive(params) {
  return axios.post('/api/prediction/comprehensive', params).then(r => r.data.data)
}

/**
 * T2扩展: 某伤因的时段/季节历史分布
 * @param {number} injuryCause 0交通/1高坠/2机械/3跌倒/4其他
 */
export function getTimeDistribution(injuryCause) {
  return axios.get('/api/prediction/time-distribution', { params: { injury_cause: injuryCause } }).then(r => r.data.data)
}

/**
 * T3/T6: 各区域伤情分布（热力图数据）
 * @param {number|null} injuryCause 按伤因过滤，null表示全部
 */
export function getDistrictDistribution(injuryCause = null) {
  const params = injuryCause !== null ? { injury_cause: injuryCause } : {}
  return axios.get('/api/prediction/district-distribution', { params }).then(r => r.data.data)
}

/**
 * 查看当前模型状态
 */
export function getModelStatus() {
  return axios.get('/api/prediction/model/status').then(r => r.data.data)
}

/**
 * 触发模型增量更新
 */
export function triggerModelUpdate() {
  return axios.post('/api/prediction/model/trigger-update').then(r => r.data.data)
}

/**
 * 历史模型版本列表
 */
export function getModelHistory() {
  return axios.get('/api/prediction/model/history').then(r => r.data.data)
}
