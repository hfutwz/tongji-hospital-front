<template>
  <div class="result-block">
    <el-alert v-if="value && value.error" type="error" :title="value.error" :closable="false" show-icon />
    <template v-else-if="value == null || value === ''">
      <p class="placeholder">暂无数据，请先查询</p>
    </template>

    <template v-else-if="isCausePrediction">
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="13">
          <div class="panel-title">伤因概率分布</div>
          <div ref="causeChartEl" class="echart-box" />
        </el-col>
        <el-col :xs="24" :lg="11">
          <el-descriptions :column="1" border size="small" class="desc">
            <el-descriptions-item label="主因">{{ value.top_cause || '-' }}</el-descriptions-item>
            <el-descriptions-item label="置信度">{{ value.confidence || '-' }}</el-descriptions-item>
            <el-descriptions-item label="样本量">{{ value.sample_n != null ? value.sample_n : '-' }}</el-descriptions-item>
            <el-descriptions-item label="降级">{{ value.is_fallback ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="模型版本">{{ value.model_version || '-' }}</el-descriptions-item>
          </el-descriptions>
          <el-table :data="probRows" size="small" stripe class="mini-table">
            <el-table-column prop="cause" label="伤因" width="100" />
            <el-table-column label="概率">
              <template slot-scope="scope">
                <el-progress
                  :percentage="pct(scope.row.p)"
                  :format="() => String(scope.row.p)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>
    </template>

    <template v-else-if="isTimeDistribution">
      <div class="panel-title">「{{ value.cause || '当前伤因' }}」在历史数据中的分布</div>
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :md="12">
          <div class="subchart-title">时段占比</div>
          <div ref="periodChartEl" class="echart-box" />
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="subchart-title">季节占比</div>
          <div ref="seasonChartEl" class="echart-box" />
        </el-col>
      </el-row>
      <el-collapse class="raw-collapse" accordion>
        <el-collapse-item title="查看原始数据（JSON）" name="1">
          <pre class="json-block flat">{{ jsonStr }}</pre>
        </el-collapse-item>
      </el-collapse>
    </template>

    <template v-else-if="isDistrictDistribution">
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :lg="14">
          <div class="panel-title">各行政区伤情发生量（可滚动查看长列表）</div>
          <div ref="districtChartEl" class="echart-box echart-tall" />
        </el-col>
        <el-col :xs="24" :lg="10">
          <el-table :data="districtRows" size="small" stripe max-height="360" class="mini-table">
            <el-table-column type="index" label="#" width="48" />
            <el-table-column prop="name" label="行政区" min-width="100" show-overflow-tooltip />
            <el-table-column prop="count" label="人次" width="88" align="right" />
          </el-table>
        </el-col>
      </el-row>
      <el-collapse class="raw-collapse" accordion>
        <el-collapse-item title="查看原始数据（JSON）" name="1">
          <pre class="json-block flat">{{ jsonStr }}</pre>
        </el-collapse-item>
      </el-collapse>
    </template>

    <template v-else>
      <pre class="json-block">{{ jsonStr }}</pre>
    </template>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'PredictionResultBlock',
  props: {
    value: { type: [Object, Array, String, Number], default: null }
  },
  data() {
    return {
      causeChart: null,
      periodChart: null,
      seasonChart: null,
      districtChart: null
    }
  },
  computed: {
    jsonStr() {
      try {
        return JSON.stringify(this.value, null, 2)
      } catch (e) {
        return String(this.value)
      }
    },
    probRows() {
      const v = this.value
      if (!v || !v.probabilities) return []
      return Object.keys(v.probabilities).map((k) => ({
        cause: k,
        p: v.probabilities[k]
      }))
    },
    isCausePrediction() {
      const v = this.value
      return v && typeof v === 'object' && v.probabilities && typeof v.probabilities === 'object' && !v.error
    },
    isTimeDistribution() {
      const v = this.value
      if (!v || typeof v !== 'object' || v.error) return false
      return (
        v.period &&
        typeof v.period === 'object' &&
        v.season &&
        typeof v.season === 'object'
      )
    },
    isDistrictDistribution() {
      const v = this.value
      if (!v || typeof v !== 'object' || v.error) return false
      if (this.isCausePrediction || this.isTimeDistribution) return false
      const keys = Object.keys(v)
      if (!keys.length) return false
      return keys.every((k) => typeof v[k] === 'number' && !Number.isNaN(v[k]))
    },
    districtRows() {
      if (!this.isDistrictDistribution) return []
      return Object.keys(this.value)
        .map((name) => ({ name, count: this.value[name] }))
        .sort((a, b) => b.count - a.count)
    }
  },
  watch: {
    value: {
      deep: true,
      handler() {
        this.$nextTick(() => this.updateCharts())
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
    this.$nextTick(() => this.updateCharts())
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    this.disposeCharts()
  },
  methods: {
    pct(p) {
      const n = Number(p)
      if (Number.isNaN(n)) return 0
      return Math.min(100, Math.round(n * 10000) / 100)
    },
    onResize() {
      const charts = [this.causeChart, this.periodChart, this.seasonChart, this.districtChart]
      charts.forEach((c) => {
        if (c) c.resize()
      })
    },
    disposeCharts() {
      const charts = [this.causeChart, this.periodChart, this.seasonChart, this.districtChart]
      charts.forEach((c) => {
        if (c) {
          c.dispose()
        }
      })
      this.causeChart = null
      this.periodChart = null
      this.seasonChart = null
      this.districtChart = null
    },
    updateCharts() {
      this.disposeCharts()
      this.$nextTick(() => {
        if (this.isCausePrediction) this.initCauseChart()
        else if (this.isTimeDistribution) this.initTimeCharts()
        else if (this.isDistrictDistribution) this.initDistrictChart()
      })
    },
    baseGrid() {
      return { left: '3%', right: '4%', bottom: '3%', top: 48, containLabel: true }
    },
    initCauseChart() {
      const el = this.$refs.causeChartEl
      if (!el) return
      const rows = this.probRows
      const names = rows.map((r) => r.cause)
      const vals = rows.map((r) => Number(r.p) || 0)
      this.causeChart = echarts.init(el)
      this.causeChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (items) => {
            const i = items[0]
            if (!i) return ''
            const p = (Number(i.value) * 100).toFixed(2)
            return `${i.name}<br/>概率：${i.value}（${p}%）`
          }
        },
        grid: this.baseGrid(),
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: '#606266', interval: 0, rotate: names.length > 5 ? 24 : 0 }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          axisLabel: {
            color: '#909399',
            formatter: (v) => `${Math.round(v * 100)}%`
          },
          splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
        },
        series: [
          {
            name: '概率',
            type: 'bar',
            data: vals,
            barMaxWidth: 48,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#66b1ff' },
                { offset: 1, color: '#409eff' }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      })
    },
    initTimeCharts() {
      const pEl = this.$refs.periodChartEl
      const sEl = this.$refs.seasonChartEl
      if (!pEl || !sEl) return
      const period = this.value.period || {}
      const season = this.value.season || {}
      const pNames = Object.keys(period)
      const pVals = pNames.map((k) => Number(period[k]) || 0)
      const sNames = Object.keys(season)
      const sVals = sNames.map((k) => Number(season[k]) || 0)

      const barOption = (names, vals, colorEnd) => ({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (items) => {
            const i = items[0]
            if (!i) return ''
            const p = (Number(i.value) * 100).toFixed(2)
            return `${i.name}<br/>占比：${i.value}（${p}%）`
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: 28, containLabel: true },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: '#606266', interval: 0, rotate: names.length > 6 ? 20 : 0 }
        },
        yAxis: {
          type: 'value',
          min: 0,
          axisLabel: {
            color: '#909399',
            formatter: (v) => `${Math.round(v * 100)}%`
          },
          splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
        },
        series: [
          {
            type: 'bar',
            data: vals,
            barMaxWidth: 36,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#a0cfff' },
                { offset: 1, color: colorEnd }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      })

      this.periodChart = echarts.init(pEl)
      this.periodChart.setOption(barOption(pNames, pVals, '#409eff'))
      this.seasonChart = echarts.init(sEl)
      this.seasonChart.setOption(barOption(sNames, sVals, '#67c23a'))
    },
    initDistrictChart() {
      const el = this.$refs.districtChartEl
      if (!el) return
      const rows = this.districtRows
      const names = rows.map((r) => r.name)
      const vals = rows.map((r) => r.count)
      const h = Math.max(280, Math.min(520, names.length * 22 + 80))
      el.style.height = `${h}px`
      this.districtChart = echarts.init(el)
      this.districtChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '8%', bottom: '3%', top: 16, containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#909399' },
          splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
        },
        yAxis: {
          type: 'category',
          data: names,
          inverse: true,
          axisLabel: { color: '#606266', width: 72, overflow: 'truncate' }
        },
        dataZoom: names.length > 12 ? [{ type: 'slider', yAxisIndex: 0, width: 16, right: 4 }] : [],
        series: [
          {
            type: 'bar',
            data: vals,
            barMaxWidth: 18,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#e6a23c' },
                { offset: 1, color: '#f56c6c' }
              ]),
              borderRadius: [0, 4, 4, 0]
            }
          }
        ]
      })
    }
  }
}
</script>

<style scoped>
.result-block {
  margin-top: 16px;
}
.placeholder {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}
.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}
.subchart-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}
.chart-row {
  margin-top: 4px;
}
.echart-box {
  width: 100%;
  height: 300px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}
.echart-tall {
  height: 360px;
}
.desc {
  margin-bottom: 12px;
}
.mini-table {
  margin-top: 0;
}
.json-block {
  margin: 0;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.45;
  overflow: auto;
  max-height: 320px;
}
.json-block.flat {
  max-height: 240px;
}
.raw-collapse {
  margin-top: 12px;
  border: none;
}
.raw-collapse >>> .el-collapse-item__header {
  font-size: 13px;
  color: #909399;
  height: 40px;
  line-height: 40px;
  background: transparent;
  border-bottom: none;
}
.raw-collapse >>> .el-collapse-item__wrap {
  border-bottom: none;
}
.raw-collapse >>> .el-collapse-item__content {
  padding-bottom: 0;
}
</style>
