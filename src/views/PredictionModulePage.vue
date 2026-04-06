<template>
  <div class="prediction-page">
    <!-- Hero 区域 -->
    <div class="page-hero">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="title-icon">🔮</span>
          创伤伤因预测分析
        </h1>
        <p class="hero-subtitle">基于历史数据的时空因导智能预测</p>
      </div>
      <div class="hero-right">
        <div class="hero-stats" v-if="modelStatus">
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(modelStatus.sample_count) || '-' }}</div>
            <div class="stat-label">训练样本</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ modelStatus.version || '-' }}</div>
            <div class="stat-label">模型版本</div>
          </div>
        </div>
        <!-- 模型训练控制 -->
        <div class="model-control">
          <el-dropdown trigger="click" @command="handleTrainingCommand">
            <button class="control-btn" :class="{ 'is-training': training.loading }">
              <span class="btn-icon">⚙️</span>
              <span class="btn-text">模型训练</span>
              <i class="el-icon-arrow-down el-icon--right"></i>
            </button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="full">
                <span class="dropdown-icon">🔄</span>
                <div class="dropdown-content">
                  <div class="dropdown-title">全量训练</div>
                  <div class="dropdown-desc">使用全部历史数据重新训练模型</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="incremental">
                <span class="dropdown-icon">⬆️</span>
                <div class="dropdown-content">
                  <div class="dropdown-title">增量训练</div>
                  <div class="dropdown-desc">仅训练新增数据，更新现有模型</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="history">
                <span class="dropdown-icon">📜</span>
                <div class="dropdown-content">
                  <div class="dropdown-title">训练历史</div>
                  <div class="dropdown-desc">查看模型版本历史记录</div>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 训练状态提示 -->
    <el-alert
      v-if="training.message"
      :title="training.message"
      :type="training.type"
      :closable="true"
      @close="training.message = ''"
      show-icon
      class="training-alert"
    />

    <!-- 预测卡片网格 -->
    <div class="prediction-grid">
      <!-- T1: 伤因分布预测 -->
      <prediction-card
        icon="📊"
        title="伤因分布预测"
        subtitle="根据时段、季节、地区预测伤因概率分布"
        :loading="loading.t1"
        @predict="fetchType1"
      >
        <div class="selector-group">
          <interactive-selector
            v-model="forms.t1.timePeriod"
            :options="timePeriodOptions"
            label="时段"
            icon="⏰"
          />
          <interactive-selector
            v-model="forms.t1.season"
            :options="seasonOptions"
            label="季节"
            icon="🌿"
          />
          <interactive-selector
            v-model="forms.t1.district"
            :options="districtOptions"
            label="地区"
            icon="📍"
            filterable
          />
        </div>
        <prediction-result-enhanced
          :value="payloads.t1"
          type="cause"
          slot="result"
        />
      </prediction-card>

      <!-- T2: 时空分布预测 -->
      <prediction-card
        icon="🌐"
        title="时空分布预测"
        subtitle="查看伤因在时段、季节及地区的分布情况"
        :loading="loading.t2"
        @predict="fetchType2"
      >
        <div class="selector-group single">
          <interactive-selector
            v-model="forms.t2.injuryCause"
            :options="injuryCauseOptions"
            label="伤因"
            icon="🩹"
            size="large"
          />
        </div>
        <prediction-triple-enhanced
          :payload="payloads.t2"
          slot="result"
        />
      </prediction-card>

      <!-- T3: 某地区创伤预测 -->
      <prediction-card
        icon="🏙️"
        title="某地区创伤预测"
        subtitle="查看地区在不同时段、季节及伤因上的分布"
        :loading="loading.t3"
        @predict="fetchType3"
      >
        <div class="selector-group single">
          <interactive-selector
            v-model="forms.t3.district"
            :options="districtOptions"
            label="地区"
            icon="📍"
            size="large"
            filterable
          />
        </div>
        <prediction-profile-enhanced
          :profile="payloads.t3"
          slot="result"
        />
      </prediction-card>

      <!-- T4: 地区分布预测 -->
      <prediction-card
        icon="🗺️"
        title="地区分布预测"
        subtitle="查看特定时段和伤因在各地区的分布"
        :loading="loading.t4"
        @predict="fetchType4"
      >
        <div class="selector-group dual">
          <interactive-selector
            v-model="forms.t4.timePeriod"
            :options="timePeriodOptions"
            label="时段"
            icon="⏰"
          />
          <interactive-selector
            v-model="forms.t4.injuryCause"
            :options="injuryCauseOptions"
            label="伤因"
            icon="🩹"
          />
        </div>
        <prediction-district-map
          :value="payloads.t4"
          slot="result"
        />
      </prediction-card>
    </div>
  </div>
</template>

<script>
import PredictionCard from '@/components/PredictionCard.vue'
import InteractiveSelector from '@/components/InteractiveSelector.vue'
import PredictionResultEnhanced from '@/components/PredictionResultEnhanced.vue'
import PredictionTripleEnhanced from '@/components/PredictionTripleEnhanced.vue'
import PredictionProfileEnhanced from '@/components/PredictionProfileEnhanced.vue'
import PredictionDistrictMap from '@/components/PredictionDistrictMap.vue'

import {
  PREDICTION_ALL,
  DISTRICT_OPTIONS,
  SEASON_OPTIONS,
  TIME_PERIOD_OPTIONS,
  INJURY_CAUSE_OPTIONS
} from '@/utils/predictionOptions.js'

const unwrap = (res) => {
  const body = res && res.data
  if (!body) return null
  if (body.success === false) {
    return { error: body.errorMsg || '请求失败' }
  }
  return body.data
}

/**
 * 将 HTTP 异常解析为对用户友好的提示文字。
 * 屏蔽原始错误报文（如 503 Service Unavailable: [{"detail":"..."}]），
 * 根据状态码和 Python detail 内容匹配已知场景，返回中文提示。
 */
const parseError = (e) => {
  const status = e.response && e.response.status

  // 尝试从响应体提取 Python/Java 的 detail 信息
  let detail = ''
  try {
    const data = e.response && e.response.data
    if (typeof data === 'string') {
      // Java 把 Python 响应直接当字符串转发时
      const match = data.match(/"detail"\s*:\s*"([^"]+)"/)
      if (match) detail = match[1]
    } else if (data && data.errorMsg) {
      detail = data.errorMsg
    } else if (data && data.detail) {
      detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    }
  } catch (_) {}

  // 根据 detail 匹配已知场景
  if (detail.includes('尚未训练') || detail.includes('model/train') || detail.includes('模型未就绪')) {
    return '预测模型尚未训练，请先在「模型管理」中点击「全量训练」初始化模型'
  }
  if (detail.includes('无统计数据') || detail.includes('no_data')) {
    return '该条件下暂无历史数据，请调整筛选条件后重试'
  }

  // 根据状态码给通用提示
  if (status === 503) return '预测服务暂时不可用，请稍后再试或联系管理员'
  if (status === 502 || status === 504) return '预测服务响应超时，请稍后重试'
  if (status === 500) return '预测服务内部错误，请联系管理员'
  if (status === 404) return '该条件下暂无历史数据，请调整筛选条件后重试'
  if (status === 422) return '请求参数有误，请检查筛选条件'
  if (!status) return '网络连接失败，请检查网络或联系管理员'

  return '预测请求失败，请稍后重试'
}

export default {
  name: 'PredictionModulePage',
  components: {
    PredictionCard,
    InteractiveSelector,
    PredictionResultEnhanced,
    PredictionTripleEnhanced,
    PredictionProfileEnhanced,
    PredictionDistrictMap
  },
  data() {
    return {
      districtOptions: DISTRICT_OPTIONS,
      seasonOptions: SEASON_OPTIONS,
      timePeriodOptions: TIME_PERIOD_OPTIONS,
      injuryCauseOptions: INJURY_CAUSE_OPTIONS,
      forms: {
        t1: {
          timePeriod: PREDICTION_ALL,
          season: PREDICTION_ALL,
          district: PREDICTION_ALL
        },
        t2: { injuryCause: PREDICTION_ALL },
        t3: { district: PREDICTION_ALL },
        t4: { timePeriod: PREDICTION_ALL, injuryCause: PREDICTION_ALL }
      },
      loading: {
        t1: false,
        t2: false,
        t3: false,
        t4: false
      },
      payloads: {
        t1: null,
        t2: null,
        t3: null,
        t4: null
      },
      modelStatus: null,
      training: {
        loading: false,
        message: '',
        type: 'info'
      }
    }
  },
  mounted() {
    this.fetchModelStatus()
  },
  methods: {
    formatNumber(n) {
      if (n == null) return '-'
      return n.toLocaleString()
    },
    toastError(msg) {
      this.$message.error(msg || '请求失败')
    },
    toastSuccess(msg) {
      this.$message.success(msg || '操作成功')
    },
    async handleTrainingCommand(command) {
      if (command === 'history') {
        this.showTrainingHistory()
        return
      }
      
      const isFull = command === 'full'
      const actionName = isFull ? '全量训练' : '增量训练'
      
      try {
        await this.$confirm(
          `确定要执行${actionName}吗？${isFull ? '这将使用全部历史数据重新训练模型，可能需要一些时间。' : '这将使用新增数据更新模型。'}`,
          `${actionName}确认`,
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
      } catch {
        return
      }
      
      this.training.loading = true
      this.training.message = `${actionName}进行中，请稍候...`
      this.training.type = 'info'
      
      try {
        const url = isFull 
          ? '/api/prediction/model/sync'
          : '/api/prediction/model/trigger-update'
        
        const res = await this.$axios.post(url)
        const data = unwrap(res)
        
        if (data && data.error) {
          this.training.message = `${actionName}失败：${data.error}`
          this.training.type = 'error'
          this.toastError(data.error)
          return
        }
        
        // 训练成功
        const status = data?.status || 'success'
        const delta = data?.delta || 0
        const version = data?.version || 'unknown'
        
        if (status === 'success' || status === 'trained') {
          this.training.message = `${actionName}成功！${delta > 0 ? `新增 ${delta} 条样本，` : ''}模型版本：${version}`
          this.training.type = 'success'
          this.toastSuccess(`${actionName}成功！模型已更新`)
          // 刷新模型状态
          await this.fetchModelStatus()
        } else if (status === 'skipped') {
          this.training.message = `${actionName}已跳过：${data.reason || '样本数量不足'}`
          this.training.type = 'warning'
        } else {
          this.training.message = `${actionName}完成：${JSON.stringify(data)}`
          this.training.type = 'info'
        }
      } catch (e) {
        const msg = parseError(e)
        this.training.message = `${actionName}失败：${msg}`
        this.training.type = 'error'
        this.toastError(msg)
      } finally {
        this.training.loading = false
      }
    },
    async showTrainingHistory() {
      try {
        const res = await this.$axios.get('/api/prediction/model/history')
        const data = unwrap(res)
        
        if (!data || data.error) {
          this.toastError(data?.error || '获取历史记录失败')
          return
        }
        
        // 简化展示，实际可以做成弹窗表格
        const history = Array.isArray(data) ? data : [data]
        const historyText = history.map((h, i) => 
          `${i + 1}. ${h.version || 'unknown'} - ${h.sample_count || 0}样本 - ${new Date(h.created_at || Date.now()).toLocaleString()}`
        ).join('\n')
        
        this.$alert(historyText || '暂无历史记录', '模型训练历史', {
          confirmButtonText: '确定',
          callback: () => {}
        })
      } catch (e) {
        this.toastError('获取训练历史失败')
      }
    },
    async fetchModelStatus() {
      try {
        const res = await this.$axios.get('/api/prediction/model/status')
        const data = unwrap(res)
        if (data && !data.error) {
          this.modelStatus = data
        }
      } catch (e) {
        console.warn('获取模型状态失败', e)
      }
    },
    // 辅助函数：检查是否为"全部"选项
    isAllOption(value) {
      return value === PREDICTION_ALL || value === '__ALL__' || value === '' || value == null
    },
    async fetchType1() {
      this.loading.t1 = true
      try {
        const body = {
          time_period: this.isAllOption(this.forms.t1.timePeriod) ? null : this.forms.t1.timePeriod,
          season: this.isAllOption(this.forms.t1.season) ? null : this.forms.t1.season,
          district: this.isAllOption(this.forms.t1.district)
            ? null
            : String(this.forms.t1.district || '').trim() || null
        }
        const res = await this.$axios.post('/api/prediction/comprehensive', body)
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.t1 = data
          this.toastError(data.error)
          return
        }
        this.payloads.t1 = data
      } catch (e) {
        const msg = parseError(e)
        this.payloads.t1 = { error: msg }
        this.toastError(msg)
      } finally {
        this.loading.t1 = false
      }
    },
    async fetchType2() {
      const c = this.forms.t2.injuryCause
      const causeParam = this.isAllOption(c) ? null : c
      this.loading.t2 = true
      try {
        const params1 = causeParam !== null ? { injury_cause: causeParam } : {}
        const params2 = causeParam !== null ? { injury_cause: causeParam } : {}
        const [r1, r2] = await Promise.all([
          this.$axios.get('/api/prediction/time-distribution', { params: params1 }),
          this.$axios.get('/api/prediction/district-distribution', { params: params2 })
        ])
        const d1 = unwrap(r1)
        const d2 = unwrap(r2)
        const err = (d1 && d1.error) || (d2 && d2.error)
        if (err) {
          this.payloads.t2 = { error: typeof err === 'string' ? err : '请求失败' }
          this.toastError(typeof err === 'string' ? err : '请求失败')
          return
        }
        this.payloads.t2 = {
          cause: d1.cause,
          period: d1.period,
          season: d1.season,
          districts: d2 && typeof d2 === 'object' ? d2 : {}
        }
      } catch (e) {
        const msg = parseError(e)
        this.payloads.t2 = { error: msg }
        this.toastError(msg)
      } finally {
        this.loading.t2 = false
      }
    },
    async fetchType3() {
      const districtParam = this.isAllOption(this.forms.t3.district)
        ? null
        : String(this.forms.t3.district || '').trim() || null
      this.loading.t3 = true
      try {
        const params = districtParam !== null ? { district: districtParam } : {}
        const res = await this.$axios.get('/api/prediction/district-profile', { params })
        const data = unwrap(res)
        // 无数据（该地区暂无历史记录）：给出友好提示，不报错
        if (data && data.no_data) {
          this.payloads.t3 = { no_data: true, district: data.district, reason: data.reason }
          return
        }
        if (data && data.error) {
          this.payloads.t3 = { error: data.error }
          this.toastError(data.error)
          return
        }
        this.payloads.t3 = data
      } catch (e) {
        // 兼容旧版本服务仍返回404的情况
        const status = e.response && e.response.status
        if (status === 404) {
          const district = districtParam || '所选地区'
          this.payloads.t3 = {
            no_data: true,
            district,
            reason: `${district}暂无历史创伤数据，无法生成画像`
          }
          return
        }
        const msg = parseError(e)
        this.payloads.t3 = { error: msg }
        this.toastError(msg)
      } finally {
        this.loading.t3 = false
      }
    },
    async fetchType4() {
      const timePeriodParam = this.isAllOption(this.forms.t4.timePeriod) ? null : this.forms.t4.timePeriod
      const injuryCauseParam = this.isAllOption(this.forms.t4.injuryCause) ? null : this.forms.t4.injuryCause
      this.loading.t4 = true
      try {
        const params = {}
        if (timePeriodParam !== null) params.time_period = timePeriodParam
        if (injuryCauseParam !== null) params.injury_cause = injuryCauseParam
        const res = await this.$axios.get('/api/prediction/district-by-period-cause', { params })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.t4 = data
          this.toastError(data.error)
          return
        }
        this.payloads.t4 = data
      } catch (e) {
        const msg = parseError(e)
        this.payloads.t4 = { error: msg }
        this.toastError(msg)
      } finally {
        this.loading.t4 = false
      }
    }
  }
}
</script>

<style scoped>
.prediction-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  min-height: 100vh;
  box-sizing: border-box;
}

/* Hero 区域 */
.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 32px;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #409eff 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 12px 40px rgba(30, 58, 95, 0.25);
}

.hero-content {
  flex: 1;
}

.hero-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

.hero-subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.85;
  font-weight: 400;
}

.hero-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.hero-stats {
  display: flex;
  gap: 24px;
}

.model-control {
  margin-top: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
}

.control-btn:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-1px);
}

.control-btn.is-training {
  opacity: 0.7;
  pointer-events: none;
}

.btn-icon {
  font-size: 16px;
}

/* 下拉菜单样式 */
.dropdown-icon {
  font-size: 20px;
  margin-right: 12px;
}

.dropdown-content {
  flex: 1;
}

.dropdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.dropdown-desc {
  font-size: 12px;
  color: #909399;
}

/* 训练状态提示 */
.training-alert {
  margin-bottom: 20px;
  border-radius: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px 20px;
  background: rgba(255,255,255,0.12);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

/* 预测网格 */
.prediction-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media (max-width: 1200px) {
  .prediction-grid {
    grid-template-columns: 1fr;
  }
}

/* 选择器组 - 在卡片内联布局中使用 */
.selector-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}

.selector-group.single {
  max-width: 300px;
}

.selector-group.dual {
  gap: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .prediction-page {
    padding: 16px;
  }
  
  .page-hero {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .hero-right {
    align-items: center;
    width: 100%;
  }
  
  .hero-title {
    font-size: 22px;
    justify-content: center;
  }
  
  .hero-stats {
    width: 100%;
    justify-content: center;
  }
  
  .selector-group.single {
    max-width: 100%;
  }
}
</style>
