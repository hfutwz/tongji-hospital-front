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
      <div class="hero-stats" v-if="modelStatus">
        <div class="stat-item">
          <div class="stat-value">{{ modelStatus.sample_count || '-' }}</div>
          <div class="stat-label">训练样本</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ modelStatus.version || '-' }}</div>
          <div class="stat-label">模型版本</div>
        </div>
      </div>
    </div>

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
      modelStatus: null
    }
  },
  mounted() {
    this.fetchModelStatus()
  },
  methods: {
    toastError(msg) {
      this.$message.error(msg || '请求失败')
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
    async fetchType1() {
      this.loading.t1 = true
      try {
        const body = {
          time_period: this.forms.t1.timePeriod === PREDICTION_ALL ? null : this.forms.t1.timePeriod,
          season: this.forms.t1.season === PREDICTION_ALL ? null : this.forms.t1.season,
          district: this.forms.t1.district === PREDICTION_ALL
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
        this.payloads.t1 = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.t1 = false
      }
    },
    async fetchType2() {
      const c = this.forms.t2.injuryCause
      const causeParam = (c === PREDICTION_ALL || c === '' || c == null) ? null : c
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
        this.payloads.t2 = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.t2 = false
      }
    },
    async fetchType3() {
      const raw = this.forms.t3.district
      const districtParam = (raw === PREDICTION_ALL || raw === '' || raw == null) ? null : String(raw).trim()
      this.loading.t3 = true
      try {
        const params = districtParam !== null ? { district: districtParam } : {}
        const res = await this.$axios.get('/api/prediction/district-profile', { params })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.t3 = { error: data.error }
          this.toastError(data.error)
          return
        }
        this.payloads.t3 = data
      } catch (e) {
        this.payloads.t3 = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.t3 = false
      }
    },
    async fetchType4() {
      const tp = this.forms.t4.timePeriod
      const ic = this.forms.t4.injuryCause
      const timePeriodParam = (tp === PREDICTION_ALL || tp == null) ? null : tp
      const injuryCauseParam = (ic === PREDICTION_ALL || ic === '' || ic == null) ? null : ic
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
        this.payloads.t4 = { error: e.message || '网络错误' }
        this.toastError(e.message)
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

.hero-stats {
  display: flex;
  gap: 24px;
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

/* 选择器组 */
.selector-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
}

.selector-group.single {
  justify-content: center;
}

.selector-group.dual {
  justify-content: center;
  gap: 24px;
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
  
  .hero-title {
    font-size: 22px;
    justify-content: center;
  }
  
  .hero-stats {
    width: 100%;
    justify-content: center;
  }
  
  .selector-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
