<template>
  <div class="triple-block">
    <el-alert v-if="payload && payload.error" type="error" :title="payload.error" :closable="false" show-icon />
    <template v-else-if="!hasData">
      <p class="placeholder">暂无数据，请先查询</p>
    </template>
    <template v-else>
      <div class="panel-title">「{{ payload.cause || '当前伤因' }}」— 时段、季节与地区分布</div>
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :md="12">
          <div class="subchart-title">时段分布</div>
          <div ref="periodEl" class="echart-box" />
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="subchart-title">季节分布</div>
          <div ref="seasonEl" class="echart-box" />
        </el-col>
      </el-row>
      <div class="subchart-title district-title">地区分布</div>
      <div ref="districtEl" class="echart-box echart-district" />
    </template>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'PredictionTripleDistributionBlock',
  props: {
    payload: { type: Object, default: null }
  },
  data() {
    return {
      periodChart: null,
      seasonChart: null,
      districtChart: null
    }
  },
  computed: {
    hasData() {
      const p = this.payload
      if (!p || p.error) return false
      return !!(p.period && p.season && p.districts && typeof p.districts === 'object')
    },
    districtRows() {
      const d = this.payload && this.payload.districts
      if (!d || typeof d !== 'object') return []
      return Object.keys(d)
        .map((name) => ({ name, count: d[name] }))
        .sort((a, b) => b.count - a.count)
    }
  },
  watch: {
    payload: {
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
    onResize() {
      const charts = [this.periodChart, this.seasonChart, this.districtChart]
      charts.forEach((c) => {
        if (c) c.resize()
      })
    },
    disposeCharts() {
      const charts = [this.periodChart, this.seasonChart, this.districtChart]
      charts.forEach((c) => {
        if (c) c.dispose()
      })
      this.periodChart = null
      this.seasonChart = null
      this.districtChart = null
    },
    barOption(names, vals, colorEnd) {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (items) => {
            const i = items[0]
            if (!i) return ''
            const pct = (Number(i.value) * 100).toFixed(2)
            return `${i.name}<br/>占比：${i.value}（${pct}%）`
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
      }
    },
    updateCharts() {
      this.disposeCharts()
      this.$nextTick(() => {
        if (!this.hasData) return
        const p = this.payload
        const period = p.period || {}
        const season = p.season || {}
        const pNames = Object.keys(period)
        const pVals = pNames.map((k) => Number(period[k]) || 0)
        const sNames = Object.keys(season)
        const sVals = sNames.map((k) => Number(season[k]) || 0)

        const pEl = this.$refs.periodEl
        const sEl = this.$refs.seasonEl
        const dEl = this.$refs.districtEl
        if (pEl) {
          this.periodChart = echarts.init(pEl)
          this.periodChart.setOption(this.barOption(pNames, pVals, '#409eff'))
        }
        if (sEl) {
          this.seasonChart = echarts.init(sEl)
          this.seasonChart.setOption(this.barOption(sNames, sVals, '#67c23a'))
        }
        if (dEl) {
          const rows = this.districtRows
          const names = rows.map((r) => r.name)
          const vals = rows.map((r) => r.count)
          const h = Math.max(320, Math.min(560, names.length * 22 + 100))
          dEl.style.height = `${h}px`
          this.districtChart = echarts.init(dEl)
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
            dataZoom: names.length > 14 ? [{ type: 'slider', yAxisIndex: 0, width: 16, right: 4 }] : [],
            series: [
              {
                type: 'bar',
                data: vals,
                barMaxWidth: 20,
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
      })
    }
  }
}
</script>

<style scoped>
.triple-block {
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
  margin-bottom: 12px;
}
.subchart-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}
.district-title {
  margin-top: 8px;
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
.echart-district {
  min-height: 320px;
}
</style>
