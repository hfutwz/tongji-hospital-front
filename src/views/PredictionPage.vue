<template>
  <div class="prediction-page">

    <!-- 页面标题 -->
    <div class="page-header">
      <h2>时空因导预测</h2>
      <p class="page-desc">基于历史创伤数据，分析各时段、季节、地区的伤因概率分布</p>
    </div>

    <!-- 查询面板 -->
    <el-card class="query-card" shadow="never">
      <el-form :inline="true" :model="form" size="small">

        <el-form-item label="时间段">
          <el-select v-model="form.timePeriod" style="width:150px">
            <el-option v-for="(name, i) in TIME_PERIODS" :key="i" :label="name" :value="i" />
          </el-select>
        </el-form-item>

        <el-form-item label="季节">
          <el-select v-model="form.season" clearable placeholder="不限" style="width:120px">
            <el-option v-for="(name, i) in SEASONS" :key="i" :label="name" :value="i" />
          </el-select>
        </el-form-item>

        <el-form-item label="地区">
          <el-select v-model="form.district" clearable filterable placeholder="全上海（不限区域）" style="width:180px">
            <el-option v-for="d in DISTRICTS" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading" icon="el-icon-search">
            预测分析
          </el-button>
          <el-button @click="handleReset" icon="el-icon-refresh">重置</el-button>
        </el-form-item>

      </el-form>
    </el-card>

    <!-- 置信度与 fallback 提示 -->
    <template v-if="result">
      <el-alert
        v-if="result.confidence === 'low'"
        title="当前条件下历史样本不足（< 20 条），预测结果仅供参考"
        type="warning" show-icon :closable="false" style="margin: 8px 0"
      />
      <el-alert
        v-if="result.is_fallback"
        title="该区域数据不足，已自动降级为全市统计分布"
        type="info" show-icon :closable="false" style="margin: 8px 0"
      />
    </template>

    <!-- 结果区域 -->
    <el-row :gutter="16" style="margin-top:16px" v-if="result">

      <!-- 伤因概率饼图 -->
      <el-col :span="10">
        <el-card shadow="never">
          <div slot="header" class="card-header">
            <span>{{ resultTitle }} · 伤因分布</span>
          </div>
          <div ref="causeChart" style="height:300px"></div>
        </el-card>
      </el-col>

      <!-- 伤因时段/季节分布（选中后查看） -->
      <el-col :span="10">
        <el-card shadow="never">
          <div slot="header" class="card-header">
            <span>历史规律 · </span>
            <el-select v-model="selectedCause" size="mini" style="width:100px" @change="loadTimeDistribution">
              <el-option v-for="(name, i) in CAUSE_NAMES" :key="i" :label="name" :value="i" />
            </el-select>
            <span> 的时段分布</span>
          </div>
          <div ref="timeChart" style="height:300px"></div>
        </el-card>
      </el-col>

      <!-- 置信度信息卡 -->
      <el-col :span="4">
        <el-card shadow="never" class="info-card">
          <div class="info-item">
            <span class="info-label">最高概率伤因</span>
            <span class="info-value top-cause">{{ result.top_cause }}</span>
          </div>
          <el-divider />
          <div class="info-item">
            <span class="info-label">参考样本量</span>
            <span class="info-value">{{ result.sample_n }} 条</span>
          </div>
          <el-divider />
          <div class="info-item">
            <span class="info-label">置信度</span>
            <el-tag size="mini" :type="confidenceTagType">{{ confidenceLabel }}</el-tag>
          </div>
          <el-divider />
          <div class="info-item">
            <span class="info-label">模型版本</span>
            <span class="info-version">{{ result.model_version }}</span>
          </div>
          <el-divider />
          <p class="disclaimer">⚠ 本预测基于历史数据统计，仅供参考</p>
        </el-card>
      </el-col>

    </el-row>

    <!-- 空状态 -->
    <div v-if="!result && !loading" class="empty-state">
      <i class="el-icon-data-analysis empty-icon"></i>
      <p>请选择时间段、季节、地区后点击「预测分析」</p>
    </div>

    <!-- 模型状态浮窗（右下角） -->
    <div class="model-status-btn" @click="showModelDialog = true">
      <i class="el-icon-cpu"></i> 模型状态
    </div>

    <!-- 模型状态对话框 -->
    <el-dialog title="预测模型状态" :visible.sync="showModelDialog" width="520px">
      <div v-if="modelStatus">
        <!-- 版本模式标签 -->
        <div style="margin-bottom:12px">
          <el-tag :type="modelStatus.mode === 'incremental' ? 'success' : 'warning'" size="medium">
            {{ modelStatus.mode === 'incremental' ? '🟢 增量版本' : modelStatus.mode === 'base' ? '🟡 基础版本' : '⚠️ 未初始化' }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="当前版本">
            {{ modelStatus.version_detail && modelStatus.version_detail.current_version || modelStatus.version || '未训练' }}
          </el-descriptions-item>
          <el-descriptions-item label="训练样本">{{ modelStatus.trained_count }} 条</el-descriptions-item>
          <el-descriptions-item label="Excel基础">{{ modelStatus.base_samples || 0 }} 条</el-descriptions-item>
          <el-descriptions-item label="数据库增量">{{ modelStatus.incremental_samples || 0 }} 条</el-descriptions-item>
          <el-descriptions-item label="地区数据">{{ modelStatus.district_count }} 条</el-descriptions-item>
          <el-descriptions-item label="训练时间">
            {{ (modelStatus.version_detail && modelStatus.version_detail.last_training) || modelStatus.created_at | formatDate }}
          </el-descriptions-item>
          <el-descriptions-item label="Top-1准确率" :span="2">
            {{ modelStatus.metrics && modelStatus.metrics.top1_accuracy
               ? (modelStatus.metrics.top1_accuracy * 100).toFixed(1) + '%'
               : '—' }}
          </el-descriptions-item>
        </el-descriptions>

        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
          <el-button size="small" type="warning" @click="handleSyncModel" :loading="updating">
            🔄 同步预测模型
          </el-button>
          <el-button size="small" @click="loadModelStatus" :loading="statusLoading">
            刷新状态
          </el-button>
        </div>

        <!-- 同步结果 -->
        <div v-if="updateResult" style="margin-top:12px;padding:10px;border-radius:6px;font-size:13px"
             :style="{ background: updateResult.status === 'incremental_trained' ? '#f0f9eb' : '#f4f4f5',
                       color: updateResult.status === 'incremental_trained' ? '#67c23a' : '#909399' }">
          {{ updateResultText }}
        </div>
      </div>
      <div v-else style="text-align:center;padding:20px;color:#909399">
        <i class="el-icon-loading"></i> 加载中...
      </div>
    </el-dialog>

  </div>
</template>

<script>
import * as echarts from 'echarts'
import {
  getComprehensive,
  getCauseByPeriod,
  getTimeDistribution,
  getModelStatus,
  syncModel,
} from '@/api/prediction'

const TIME_PERIODS = ['夜间 00-07', '早高峰 08-09', '午高峰 10-11', '下午 12-16', '晚高峰 17-19', '晚上 20-23']
const SEASONS      = ['春 3-5月', '夏 6-9月', '秋 10-12月', '冬 1-2月']
const DISTRICTS    = [
  '黄浦区','徐汇区','长宁区','静安区','普陀区','虹口区','杨浦区',
  '宝山区','闵行区','嘉定区','浦东新区','松江区','青浦区','奉贤区','金山区','崇明区'
]
const CAUSE_NAMES  = ['交通伤', '高坠伤', '机械伤', '跌倒', '其他']

export default {
  name: 'PredictionPage',

  filters: {
    formatDate(val) {
      if (!val) return '—'
      return val.replace('T', ' ').slice(0, 16)
    }
  },

  data() {
    return {
      form: { timePeriod: 3, season: null, district: null },
      result: null,
      loading: false,
      selectedCause: 0,
      modelStatus: null,
      showModelDialog: false,
      updating: false,
      statusLoading: false,
      updateResult: null,
      // 常量
      TIME_PERIODS, SEASONS, DISTRICTS, CAUSE_NAMES,
      // ECharts 实例
      causeChartInst: null,
      timeChartInst: null,
    }
  },

  computed: {
    confidenceTagType() {
      return { high: 'success', medium: 'warning', low: 'danger' }[this.result?.confidence] || 'info'
    },
    confidenceLabel() {
      return { high: '高', medium: '中', low: '低' }[this.result?.confidence] || '—'
    },
    resultTitle() {
      const p = TIME_PERIODS[this.form.timePeriod] || ''
      const d = this.form.district || '全上海'
      const s = this.form.season !== null && this.form.season !== undefined
        ? SEASONS[this.form.season] : ''
      return [d, s, p].filter(Boolean).join(' · ')
    },
    updateResultText() {
      if (!this.updateResult) return ''
      const r = this.updateResult
      if (r.status === 'incremental_trained')
        return `✅ 同步成功：Excel基础${r.base_samples}条 + 数据库${r.incremental_samples}条 = 共${r.total_samples}条，版本 ${r.incremental_version}`
      if (r.status === 'no_new_data')
        return `ℹ️ 数据库无新增数据（当前${r.current_db_count || 0}条），模型版本未变更`
      if (r.status === 'trained')
        return `✅ 基础模型训练完成，使用 ${r.base_samples} 条 Excel 数据`
      if (r.status === 'skipped') return `ℹ️ 已跳过：${r.reason || r.message}`
      if (r.status === 'error') return `❌ 失败：${r.message}`
      return JSON.stringify(r)
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.causeChartInst = echarts.init(this.$refs.causeChart)
      this.timeChartInst  = echarts.init(this.$refs.timeChart)
    })
    this.loadModelStatus()
  },

  beforeDestroy() {
    if (this.causeChartInst) this.causeChartInst.dispose()
    if (this.timeChartInst)  this.timeChartInst.dispose()
  },

  methods: {
    async handleQuery() {
      this.loading = true
      this.result = null
      try {
        const { timePeriod, season, district } = this.form
        let data
        if (district || season !== null) {
          data = await getComprehensive({
            time_period: timePeriod,
            season: season,
            district: district || undefined
          })
        } else {
          data = await getCauseByPeriod(timePeriod)
        }
        this.result = data
        this.$nextTick(() => {
          this.renderCauseChart(data.probabilities)
          this.loadTimeDistribution()
        })
      } catch (e) {
        this.$message.error(e?.response?.data?.errorMsg || '预测服务不可用，请确认服务已启动')
      } finally {
        this.loading = false
      }
    },

    handleReset() {
      this.form = { timePeriod: 3, season: null, district: null }
      this.result = null
      if (this.causeChartInst) this.causeChartInst.clear()
      if (this.timeChartInst)  this.timeChartInst.clear()
    },

    async loadTimeDistribution() {
      try {
        const data = await getTimeDistribution(this.selectedCause)
        if (data) this.renderTimeChart(data.period)
      } catch (e) {
        // 静默失败，不影响主预测结果
      }
    },

    async loadModelStatus() {
      this.statusLoading = true
      try {
        this.modelStatus = await getModelStatus()
      } catch (e) {
        this.modelStatus = {
          version: null, trained_count: 0, district_count: 0,
          created_at: null, metrics: {}, mode: 'unknown',
          base_samples: 0, incremental_samples: 0, version_detail: null
        }
      } finally {
        this.statusLoading = false
      }
    },

    async handleSyncModel() {
      this.updating = true
      this.updateResult = null
      try {
        this.updateResult = await syncModel({})
        const s = this.updateResult?.status
        if (s === 'incremental_trained' || s === 'trained') {
          this.$message.success('模型同步成功')
          await this.loadModelStatus()
        } else if (s === 'no_new_data') {
          this.$message.info('数据库无新增数据，模型版本未变更')
        } else if (s === 'error') {
          this.$message.error('同步失败：' + (this.updateResult?.message || '未知错误'))
        }
      } catch (e) {
        this.$message.error('模型同步失败，请确认 Python 服务已启动')
      } finally {
        this.updating = false
      }
    },

    // ─── ECharts 渲染 ──────────────────────────────────────────

    renderCauseChart(probabilities) {
      if (!this.causeChartInst || !probabilities) return

      const data = Object.entries(probabilities).map(([name, value]) => ({
        name, value: (value * 100).toFixed(1)
      }))

      this.causeChartInst.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
        legend: { orient: 'vertical', right: 10, top: 'center' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          data,
          label: { formatter: '{b}\n{c}%' },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
        }]
      }, true)
    },

    renderTimeChart(periodData) {
      if (!this.timeChartInst || !periodData) return

      const names = Object.keys(periodData)
      const values = Object.values(periodData).map(v => (v * 100).toFixed(1))

      this.timeChartInst.setOption({
        tooltip: { trigger: 'axis', formatter: p => `${p[0].name}: ${p[0].value}%` },
        xAxis: {
          type: 'category', data: names,
          axisLabel: { interval: 0, rotate: 15, fontSize: 11 }
        },
        yAxis: {
          type: 'value', axisLabel: { formatter: '{value}%' }
        },
        series: [{
          type: 'bar',
          data: values,
          itemStyle: { color: '#667eea' },
          label: { show: true, position: 'top', formatter: '{c}%' }
        }],
        grid: { left: 40, right: 20, top: 30, bottom: 50 }
      }, true)
    }
  }
}
</script>

<style scoped>
.prediction-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}
.page-header h2 {
  font-size: 22px;
  color: #303133;
  margin: 0 0 6px;
}
.page-desc {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.query-card {
  margin-bottom: 16px;
}
.query-card .el-form {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: flex-end;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.info-card {
  height: 100%;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}
.info-label {
  font-size: 12px;
  color: #909399;
}
.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.top-cause {
  color: #667eea;
  font-size: 18px;
}
.info-version {
  font-size: 12px;
  color: #606266;
  font-family: monospace;
}
.disclaimer {
  font-size: 11px;
  color: #C0C4CC;
  margin-top: 8px;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #C0C4CC;
}
.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.model-status-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #667eea;
  color: white;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  z-index: 999;
}
.model-status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.update-result {
  margin-top: 12px;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 4px;
}
.update-result.success { background: #f0f9eb; color: #67c23a; }
.update-result.info    { background: #f4f4f5; color: #909399; }
</style>
