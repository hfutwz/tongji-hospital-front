/**
 * 创伤预测模块：下拉枚举（与 docs/prediction-module-plan.md 一致）
 * 「全部」使用字符串哨兵，便于 Element UI 选择器绑定。
 */
export const PREDICTION_ALL = '__ALL__'

export const DISTRICT_OPTIONS = [
  { v: PREDICTION_ALL, l: '全部' },
  { v: '黄浦区', l: '黄浦区' },
  { v: '徐汇区', l: '徐汇区' },
  { v: '长宁区', l: '长宁区' },
  { v: '静安区', l: '静安区' },
  { v: '普陀区', l: '普陀区' },
  { v: '虹口区', l: '虹口区' },
  { v: '杨浦区', l: '杨浦区' },
  { v: '浦东新区', l: '浦东新区' },
  { v: '闵行区', l: '闵行区' },
  { v: '宝山区', l: '宝山区' },
  { v: '嘉定区', l: '嘉定区' },
  { v: '金山区', l: '金山区' },
  { v: '松江区', l: '松江区' },
  { v: '青浦区', l: '青浦区' },
  { v: '奉贤区', l: '奉贤区' },
  { v: '崇明区', l: '崇明区' }
]

export const SEASON_OPTIONS = [
  { v: PREDICTION_ALL, l: '全部' },
  { v: 0, l: '春季（3-5月）' },
  { v: 1, l: '夏季（6-9月）' },
  { v: 2, l: '秋季（10-12月）' },
  { v: 3, l: '冬季（1-2月）' }
]

export const TIME_PERIOD_OPTIONS = [
  { v: PREDICTION_ALL, l: '全部' },
  { v: 0, l: '夜间(0-7时)' },
  { v: 1, l: '早高峰(8-9时)' },
  { v: 2, l: '午高峰(10-11时)' },
  { v: 3, l: '下午(12-16时)' },
  { v: 4, l: '晚高峰(17-19时)' },
  { v: 5, l: '晚上(20-23时)' }
]

export const INJURY_CAUSE_OPTIONS = [
  { v: 0, l: '交通伤' },
  { v: 1, l: '高坠伤' },
  { v: 2, l: '机械伤' },
  { v: 3, l: '跌倒' },
  { v: 4, l: '其他' }
]
