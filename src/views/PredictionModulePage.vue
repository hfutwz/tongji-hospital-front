<template>
  <div class="prediction-page">
    <div class="page-hero page-hero--compact">
      <div class="hero-text">
        <h1>创伤伤因预测分析</h1>
      </div>
    </div>

    <el-card class="section-card tabs-card tabs-card--main" shadow="hover">
      <div slot="header" class="card-header card-header--main">
        <div>
          <span class="card-header-title"><i class="el-icon-data-line"></i> 预测结果</span>
          <p class="card-header-sub">
            四类预测：伤因概率、伤因时空分布、地区画像、时段+伤因空间分布。枚举与接口规划见
            <code>docs/prediction-module-plan.md</code>。
          </p>
        </div>
      </div>
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 1. 条件 → 伤因概率分布 -->
        <el-tab-pane label="条件 → 伤因概率" name="t1">
          <p class="tab-desc">根据时段、季节、地区（均可选「全部」）预测伤因概率分布。</p>
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="时段">
                <el-select v-model="forms.t1.timePeriod" placeholder="时段" style="width: 200px">
                  <el-option v-for="o in timePeriodOptions" :key="'tp-' + o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item label="季节">
                <el-select v-model="forms.t1.season" placeholder="季节" style="width: 200px">
                  <el-option v-for="o in seasonOptions" :key="'s-' + o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item label="地区">
                <el-select v-model="forms.t1.district" placeholder="地区" filterable style="width: 200px">
                  <el-option v-for="o in districtOptions" :key="'d-' + o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.t1" @click="fetchType1">预测</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.t1" />
          </div>
        </el-tab-pane>

        <!-- 2. 伤因 → 时段 / 季节 / 地区分布 -->
        <el-tab-pane label="伤因 → 时空分布" name="t2">
          <p class="tab-desc">选择伤因（可选「全部」），查看该伤因在时段、季节及各区县的分布预测。</p>
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="伤因">
                <el-select v-model="forms.t2.injuryCause" placeholder="伤因" style="width: 200px">
                  <el-option v-for="o in injuryCauseOptions" :key="'ic-' + o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.t2" @click="fetchType2">预测</el-button>
              </el-form-item>
            </el-form>
            <prediction-triple-distribution-block :payload="payloads.t2" />
          </div>
        </el-tab-pane>

        <!-- 3. 地区 → 时段 / 季节 / 伤因分布 -->
        <el-tab-pane label="地区 → 时序与伤因" name="t3">
          <p class="tab-desc">选择地区（可选「全部」），查看该地区在时段、季节及伤因上的历史占比（季节在无联合表时为统计近似）。</p>
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="地区">
                <el-select v-model="forms.t3.district" placeholder="地区" filterable style="width: 220px">
                  <el-option
                    v-for="o in districtOptions"
                    :key="'t3d-' + o.v"
                    :label="o.l"
                    :value="o.v"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.t3" @click="fetchType3">预测</el-button>
              </el-form-item>
            </el-form>
            <prediction-district-profile-block :profile="payloads.t3" />
          </div>
        </el-tab-pane>

        <!-- 4. 时段 + 伤因 → 地区分布 -->
        <el-tab-pane label="时段+伤因 → 地区" name="t4">
          <p class="tab-desc">在给定时段与伤因下（均可选「全部」），查看各区县的原始发生人次分布。</p>
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="时段">
                <el-select v-model="forms.t4.timePeriod" placeholder="时段" style="width: 200px">
                  <el-option
                    v-for="o in timePeriodOptions"
                    :key="'t4tp-' + o.v"
                    :label="o.l"
                    :value="o.v"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="伤因">
                <el-select v-model="forms.t4.injuryCause" placeholder="伤因" style="width: 200px">
                  <el-option v-for="o in injuryCauseOptions" :key="'t4ic-' + o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.t4" @click="fetchType4">预测</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.t4" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import PredictionResultBlock from '@/components/PredictionResultBlock.vue'
import PredictionTripleDistributionBlock from '@/components/PredictionTripleDistributionBlock.vue'
import PredictionDistrictProfileBlock from '@/components/PredictionDistrictProfileBlock.vue'
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
    PredictionResultBlock,
    PredictionTripleDistributionBlock,
    PredictionDistrictProfileBlock
  },
  data() {
    return {
      activeTab: 't1',
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
      }
    }
  },
  computed: {},
  methods: {
    toastError(msg) {
      this.$message.error(msg || '请求失败')
    },
    async fetchType1() {
      this.loading.t1 = true
      try {
        const body = {
          time_period: this.forms.t1.timePeriod === PREDICTION_ALL ? null : this.forms.t1.timePeriod,
          season: this.forms.t1.season === PREDICTION_ALL ? null : this.forms.t1.season,
          district:
            this.forms.t1.district === PREDICTION_ALL
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
      // 全选时 injury_cause 传 null
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
      // 全选时 district 传 null
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
      // 全选时传 null
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
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e3a5f 0%, #409eff 100%);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.35);
}

.page-hero--compact {
  padding: 16px 22px;
}

.page-hero h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.section-card {
  margin-bottom: 20px;
  border-radius: 10px;
  border: none;
}

.section-card >>> .el-card__header {
  padding: 14px 18px;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  display: flex;
  align-items: center;
}

.card-header i {
  margin-right: 8px;
  color: #409eff;
}

.card-header--main {
  align-items: flex-start;
  width: 100%;
}

.card-header-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.card-header-sub {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: normal;
  color: #909399;
  line-height: 1.5;
}

.card-header-sub code {
  font-size: 12px;
  padding: 1px 6px;
  background: #f4f4f5;
  border-radius: 4px;
  color: #606266;
}

.tabs-card--main {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.tabs-card--main >>> .el-card__body {
  padding: 16px 18px 20px;
}

.tabs-card >>> .el-tabs--border-card {
  border: none;
  box-shadow: none;
}

.tabs-card >>> .el-tabs__header {
  background: #f0f2f5;
}

.tab-desc {
  margin: 0 0 10px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.tab-form {
  padding: 4px 4px 4px;
  min-height: 120px;
}

</style>
