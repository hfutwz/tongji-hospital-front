<template>
  <div class="prediction-page">
    <div class="page-hero">
      <div class="hero-text">
        <h1>创伤伤因预测</h1>
        <p class="hero-desc">
          基于时空因导统计模型，对接后端 <code>/api/prediction/*</code> 与 Python 预测服务联调。
          本页仅使用当前预测服务已提供的 9 个接口（6 项预测 + 模型状态 / 增量更新 / 历史版本）。
        </p>
      </div>
      <div class="hero-badge">
        <el-tag type="success" effect="dark" size="medium">联调入口</el-tag>
      </div>
    </div>

    <!-- 模型管理 -->
    <el-card class="section-card" shadow="hover">
      <div slot="header" class="card-header">
        <span><i class="el-icon-cpu"></i> 模型管理</span>
      </div>
      <el-row :gutter="16">
        <el-col :xs="24" :md="8">
          <div class="mini-panel">
            <h4>模型状态</h4>
            <p class="hint">GET /api/prediction/model/status</p>
            <el-button type="primary" size="small" :loading="loading.status" @click="fetchModelStatus">
              刷新状态
            </el-button>
            <pre v-if="payloads.status" class="json-block">{{ formatJson(payloads.status) }}</pre>
            <p v-else class="placeholder">点击按钮查看版本、样本量等信息</p>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="mini-panel">
            <h4>增量更新</h4>
            <p class="hint">POST /api/prediction/model/trigger-update</p>
            <el-button type="warning" size="small" :loading="loading.trigger" @click="triggerModelUpdate">
              触发增量更新
            </el-button>
            <pre v-if="payloads.trigger" class="json-block">{{ formatJson(payloads.trigger) }}</pre>
            <p v-else class="placeholder">导入新数据后可手动触发模型重训</p>
          </div>
        </el-col>
        <el-col :xs="24" :md="8">
          <div class="mini-panel">
            <h4>历史版本</h4>
            <p class="hint">GET /api/prediction/model/history</p>
            <el-button type="default" size="small" :loading="loading.history" @click="fetchModelHistory">
              加载历史
            </el-button>
            <pre v-if="payloads.history" class="json-block">{{ formatJson(payloads.history) }}</pre>
            <p v-else class="placeholder">查看已保存的模型版本列表</p>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 预测分析 -->
    <el-card class="section-card tabs-card" shadow="hover">
      <div slot="header" class="card-header">
        <span><i class="el-icon-data-analysis"></i> 预测分析</span>
      </div>
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="时段 → 伤因" name="period">
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="时段">
                <el-select v-model="forms.period.timePeriod" placeholder="时段" style="width: 200px">
                  <el-option v-for="o in timePeriodOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item label="季节（可选）">
                <el-select v-model="forms.period.season" clearable placeholder="不传则仅按时段" style="width: 160px">
                  <el-option v-for="o in seasonOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.period" @click="fetchCauseByPeriod">查询</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.period" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="季节 → 伤因" name="season">
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="季节">
                <el-select v-model="forms.season.season" placeholder="季节" style="width: 160px">
                  <el-option v-for="o in seasonOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.season" @click="fetchCauseBySeason">查询</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.season" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="地区 → 伤因" name="district">
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="行政区">
                <el-input v-model="forms.district.district" placeholder="如：宝山区" style="width: 220px" clearable />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.district" @click="fetchCauseByDistrict">查询</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.district" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="综合预测" name="comprehensive">
          <div class="tab-form">
            <el-form label-width="100px" size="small" class="stack-form">
              <el-form-item label="时段" required>
                <el-select v-model="forms.comprehensive.timePeriod" style="width: 240px">
                  <el-option v-for="o in timePeriodOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item label="季节（可选）">
                <el-select v-model="forms.comprehensive.season" clearable placeholder="不选则按其它规则降级" style="width: 240px">
                  <el-option v-for="o in seasonOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item label="行政区（可选）">
                <el-input v-model="forms.comprehensive.district" clearable placeholder="如：宝山区" style="width: 240px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.comprehensive" @click="fetchComprehensive">提交预测</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.comprehensive" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="伤因 → 时段/季节分布" name="timeDist">
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="伤因">
                <el-select v-model="forms.timeDist.injuryCause" style="width: 220px">
                  <el-option v-for="o in injuryCauseOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.timeDist" @click="fetchTimeDistribution">查询</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.timeDist" :raw="true" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="各区域伤情分布" name="districtDist">
          <div class="tab-form">
            <el-form :inline="true" size="small" @submit.native.prevent>
              <el-form-item label="伤因（可选）">
                <el-select v-model="forms.districtDist.injuryCause" clearable placeholder="全部伤因" style="width: 220px">
                  <el-option v-for="o in injuryCauseOptions" :key="o.v" :label="o.l" :value="o.v" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="loading.districtDist" @click="fetchDistrictDistribution">查询</el-button>
              </el-form-item>
            </el-form>
            <prediction-result-block :value="payloads.districtDist" :raw="true" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import PredictionResultBlock from '@/components/PredictionResultBlock.vue'

/**
 * 仅调用预测服务已对接的 9 个后端代理接口：
 * GET  cause-by-period, cause-by-season, cause-by-district
 * POST comprehensive
 * GET  time-distribution, district-distribution
 * GET  model/status, model/history
 * POST model/trigger-update
 */
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
    PredictionResultBlock
  },
  data() {
    return {
      activeTab: 'period',
      timePeriodOptions: [
        { v: 0, l: '夜间 0–7' },
        { v: 1, l: '早高峰 8–9' },
        { v: 2, l: '午高峰 10–11' },
        { v: 3, l: '下午 12–16' },
        { v: 4, l: '晚高峰 17–19' },
        { v: 5, l: '晚上 20–23' }
      ],
      seasonOptions: [
        { v: 0, l: '春' },
        { v: 1, l: '夏' },
        { v: 2, l: '秋' },
        { v: 3, l: '冬' }
      ],
      injuryCauseOptions: [
        { v: 0, l: '交通伤' },
        { v: 1, l: '高坠伤' },
        { v: 2, l: '机械伤' },
        { v: 3, l: '跌倒' },
        { v: 4, l: '其他' }
      ],
      forms: {
        period: { timePeriod: 3, season: null },
        season: { season: 0 },
        district: { district: '宝山区' },
        comprehensive: { timePeriod: 3, season: 2, district: '宝山区' },
        timeDist: { injuryCause: 0 },
        districtDist: { injuryCause: null }
      },
      loading: {
        status: false,
        trigger: false,
        history: false,
        period: false,
        season: false,
        district: false,
        comprehensive: false,
        timeDist: false,
        districtDist: false
      },
      payloads: {
        status: null,
        trigger: null,
        history: null,
        period: null,
        season: null,
        district: null,
        comprehensive: null,
        timeDist: null,
        districtDist: null
      }
    }
  },
  methods: {
    formatJson(obj) {
      try {
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return String(obj)
      }
    },
    toastError(msg) {
      this.$message.error(msg || '请求失败')
    },
    async fetchModelStatus() {
      this.loading.status = true
      try {
        const res = await this.$axios.get('/api/prediction/model/status')
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.status = null
          this.toastError(data.error)
          return
        }
        this.payloads.status = data
      } catch (e) {
        this.toastError(e.message || '网络错误')
      } finally {
        this.loading.status = false
      }
    },
    async triggerModelUpdate() {
      this.loading.trigger = true
      try {
        const res = await this.$axios.post('/api/prediction/model/trigger-update')
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.trigger = null
          this.toastError(data.error)
          return
        }
        this.payloads.trigger = data
        this.$message.success('已提交增量更新请求')
      } catch (e) {
        this.toastError(e.message || '网络错误')
      } finally {
        this.loading.trigger = false
      }
    },
    async fetchModelHistory() {
      this.loading.history = true
      try {
        const res = await this.$axios.get('/api/prediction/model/history')
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.history = null
          this.toastError(data.error)
          return
        }
        this.payloads.history = data
      } catch (e) {
        this.toastError(e.message || '网络错误')
      } finally {
        this.loading.history = false
      }
    },
    async fetchCauseByPeriod() {
      this.loading.period = true
      try {
        const p = { time_period: this.forms.period.timePeriod }
        if (this.forms.period.season != null && this.forms.period.season !== '') {
          p.season = this.forms.period.season
        }
        const res = await this.$axios.get('/api/prediction/cause-by-period', { params: p })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.period = data
          this.toastError(data.error)
          return
        }
        this.payloads.period = data
      } catch (e) {
        this.payloads.period = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.period = false
      }
    },
    async fetchCauseBySeason() {
      this.loading.season = true
      try {
        const res = await this.$axios.get('/api/prediction/cause-by-season', {
          params: { season: this.forms.season.season }
        })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.season = data
          this.toastError(data.error)
          return
        }
        this.payloads.season = data
      } catch (e) {
        this.payloads.season = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.season = false
      }
    },
    async fetchCauseByDistrict() {
      const d = (this.forms.district.district || '').trim()
      if (!d) {
        this.$message.warning('请输入行政区名称')
        return
      }
      this.loading.district = true
      try {
        const res = await this.$axios.get('/api/prediction/cause-by-district', {
          params: { district: d }
        })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.district = data
          this.toastError(data.error)
          return
        }
        this.payloads.district = data
      } catch (e) {
        this.payloads.district = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.district = false
      }
    },
    async fetchComprehensive() {
      this.loading.comprehensive = true
      try {
        const body = { time_period: this.forms.comprehensive.timePeriod }
        if (this.forms.comprehensive.season != null && this.forms.comprehensive.season !== '') {
          body.season = this.forms.comprehensive.season
        }
        const dist = (this.forms.comprehensive.district || '').trim()
        if (dist) body.district = dist
        const res = await this.$axios.post('/api/prediction/comprehensive', body)
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.comprehensive = data
          this.toastError(data.error)
          return
        }
        this.payloads.comprehensive = data
      } catch (e) {
        this.payloads.comprehensive = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.comprehensive = false
      }
    },
    async fetchTimeDistribution() {
      this.loading.timeDist = true
      try {
        const res = await this.$axios.get('/api/prediction/time-distribution', {
          params: { injury_cause: this.forms.timeDist.injuryCause }
        })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.timeDist = data
          this.toastError(data.error)
          return
        }
        this.payloads.timeDist = data
      } catch (e) {
        this.payloads.timeDist = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.timeDist = false
      }
    },
    async fetchDistrictDistribution() {
      this.loading.districtDist = true
      try {
        const params = {}
        if (this.forms.districtDist.injuryCause != null && this.forms.districtDist.injuryCause !== '') {
          params.injury_cause = this.forms.districtDist.injuryCause
        }
        const res = await this.$axios.get('/api/prediction/district-distribution', { params })
        const data = unwrap(res)
        if (data && data.error) {
          this.payloads.districtDist = data
          this.toastError(data.error)
          return
        }
        this.payloads.districtDist = data
      } catch (e) {
        this.payloads.districtDist = { error: e.message || '网络错误' }
        this.toastError(e.message)
      } finally {
        this.loading.districtDist = false
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
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e3a5f 0%, #409eff 100%);
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.35);
}

.page-hero h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.hero-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.92;
  max-width: 820px;
}

.hero-desc code {
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.hero-badge {
  flex-shrink: 0;
  padding-top: 4px;
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
}

.card-header i {
  margin-right: 8px;
  color: #409eff;
}

.mini-panel {
  background: #fafbfc;
  border-radius: 8px;
  padding: 14px;
  border: 1px solid #ebeef5;
  min-height: 200px;
}

.mini-panel h4 {
  margin: 0 0 6px;
  font-size: 15px;
  color: #303133;
}

.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #909399;
}

.placeholder {
  margin: 10px 0 0;
  font-size: 13px;
  color: #c0c4cc;
}

.json-block {
  margin-top: 12px;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.45;
  overflow: auto;
  max-height: 280px;
}

.tabs-card >>> .el-tabs--border-card {
  border: none;
  box-shadow: none;
}

.tabs-card >>> .el-tabs__header {
  background: #f0f2f5;
}

.tab-form {
  padding: 12px 4px 8px;
}

.stack-form {
  max-width: 520px;
}
</style>
