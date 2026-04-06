<template>
  <div class="profile-block">
    <el-alert v-if="profile && profile.error" type="error" :title="profile.error" :closable="false" show-icon />
    <template v-else-if="!hasData">
      <p class="placeholder">暂无数据，请先查询</p>
    </template>
    <template v-else>
      <div class="panel-title">地区画像：{{ profile.district }}</div>
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
      <div class="subchart-title cause-title">伤因分布</div>
      <div ref="causeEl" class="echart-box echart-cause" />
    </template>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'PredictionDistrictProfileBlock',
  props: {
    profile: { type: Object, default: null }
  },
  data() {
    return {
      periodChart: null,
      seasonChart: null,
      causeChart: null
    }
  },
  computed: {
    hasData() {
      const p = this.profile
      if (!p || p.error) return false
      return !!(p.period && p.season && p.causes)
    }
  },
  watch: {
    profile: {
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
      const charts = [this.periodChart, this.seasonChart, this.causeChart]
      charts.forEach((c) => {
        if (c) c.resize()
      })
    },
    disposeCharts() {
      const charts = [this.periodChart, this.seasonChart, this.causeChart]
      charts.forEach((c) => {
        if (c) c.dispose()
      })
      this.periodChart = null
      this.seasonChart = null
      this.causeChart = null
    },
    shareBarOption(names, vals, colorEnd, valueLabel = '占比') {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (items) => {
            const i = items[0]
            if (!i) return ''
            const pct = (Number(i.value) * 100).toFixed(2)
            return `${i.name}<br/>${valueLabel}：${i.value}（${pct}%）`
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
          max: 1,
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
            barMaxWidth: 40,
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
        const p = this.profile
        const period = p.period || {}
        const season = p.season || {}
        const causes = p.causes || {}
        const pNames = Object.keys(period)
        const pVals = pNames.map((k) => Number(period[k]) || 0)
        const sNames = Object.keys(season)
        const sVals = sNames.map((k) => Number(season[k]) || 0)
        const cNames = Object.keys(causes)
        const cVals = cNames.map((k) => Number(causes[k]) || 0)

        const pEl = this.$refs.periodEl
        const sEl = this.$refs.seasonEl
        const cEl = this.$refs.causeEl
        if (pEl) {
          this.periodChart = echarts.init(pEl)
          this.periodChart.setOption(this.shareBarOption(pNames, pVals, '#409eff'))
        }
        if (sEl) {
          this.seasonChart = echarts.init(sEl)
          this.seasonChart.setOption(this.shareBarOption(sNames, sVals, '#67c23a'))
        }
        if (cEl) {
          this.causeChart = echarts.init(cEl)
          this.causeChart.setOption(this.shareBarOption(cNames, cVals, '#e6a23c', '占比'))
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-block {
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
.cause-title {
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
.echart-cause {
  height: 280px;
}
</style>
