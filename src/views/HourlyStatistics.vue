<template>
  <div class="hourly-statistics-container">
    <div class="header">
      <h2>患者数量统计</h2>
      <div class="controls">
        <el-select v-model="filters.year" placeholder="年份(可选)" clearable filterable style="width: 140px; margin-right: 10px;" @change="onFilterChange">
          <el-option v-for="y in yearOptions" :key="y" :value="y" :label="y.toString()" />
        </el-select>
        <el-select v-model="filters.seasons" multiple placeholder="季节(可选, 可多选)" clearable style="width: 300px; margin-right: 10px;" @change="onFilterChange">
          <el-option :value="0" label="春" />
          <el-option :value="1" label="夏" />
          <el-option :value="2" label="秋" />
          <el-option :value="3" label="冬" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          style="width: 300px; margin-right: 10px;"
          @change="onFilterChange"
        />
        <el-button type="info" @click="openTimeGroupDialog" style="margin-right: 10px;">
          <i class="el-icon-setting"></i> 自定义时间段分组
        </el-button>
        <el-button v-if="customGroups.length > 0" type="warning" @click="clearCustomGroups" style="margin-right: 10px;">
          <i class="el-icon-close"></i> 清除分组
        </el-button>
        <el-button type="primary" :loading="loading" @click="fetchData">查询</el-button>
      </div>
    </div>

    <!-- 自定义分组提示 -->
    <div v-if="customGroups.length > 0" class="group-info-banner">
      <el-alert type="success" :closable="false">
        <template slot="title">
          <span>当前使用自定义时间段分组（{{ customGroups.length }} 个分组）</span>
          <el-button type="text" @click="openTimeGroupDialog" style="margin-left: 10px;">重新编辑</el-button>
        </template>
      </el-alert>
    </div>

    <div class="stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">{{ customGroups.length > 0 ? '总病例数' : '总病例数' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ peakLabel }}</div>
            <div class="stat-label">{{ customGroups.length > 0 ? '峰值组别' : '峰值时段' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ averageValue }}</div>
            <div class="stat-label">{{ customGroups.length > 0 ? '每组平均' : '每小时平均' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ countLabel }}</div>
            <div class="stat-label">{{ customGroups.length > 0 ? '分组数量' : '非零小时数' }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="chart-wrapper">
      <div ref="chart" class="chart"></div>
    </div>

    <!-- 时间段分组弹窗 -->
    <TimeGroupDialog
      :visible="timeGroupDialogVisible"
      @update:visible="val => { timeGroupDialogVisible = val }"
      title="自定义时间段分组"
      :value="customGroups"
      @confirm="handleGroupConfirm"
      @cancel="handleGroupCancel"
    />
  </div>
</template>

<script>
import * as echarts from 'echarts'
import TimeGroupDialog from '@/components/TimeGroupDialog.vue'

export default {
  name: 'HourlyStatistics',
  components: {
    TimeGroupDialog
  },
  data() {
    return {
      loading: false,
      filters: {
        year: undefined,
        seasons: [],
        dateRange: []
      },
      yearOptions: [],
      // 原始模式：24小时数据
      seriesData: Array(24).fill(0),
      // 自定义分组模式：分组数据
      groupData: [],
      // 自定义分组配置
      customGroups: [],
      timeGroupDialogVisible: false,
      total: 0,
      peakLabel: '-',
      averageValue: 0,
      countLabel: 0,
      chart: null
    }
  },
  mounted() {
    this.initChart()
    this.loadYears()
    this.fetchData()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    onFilterChange() {
      // 防抖可加，这里直接查询
      this.fetchData()
    },
    async loadYears() {
      // 本地生成当前年往前共11年
      const current = new Date().getFullYear()
      const years = []
      for (let i = 0; i <= 10; i += 1) {
        years.push(current - i)
      }
      this.yearOptions = years
    },
    openTimeGroupDialog() {
      this.timeGroupDialogVisible = true
    },
    handleGroupConfirm(groups) {
      this.customGroups = groups
      this.$message.success(`已设置 ${groups.length} 个时间段分组`)
      // 自动查询
      this.fetchData()
    },
    handleGroupCancel() {
      // 取消时不做任何操作
    },
    clearCustomGroups() {
      this.$confirm('确定要清除自定义分组吗？清除后将恢复为24小时统计模式。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.customGroups = []
        this.$message.success('已清除自定义分组')
        this.fetchData()
      }).catch(() => {})
    },
    async fetchData() {
      this.loading = true
      try {
        // 构建查询参数
        const params = new URLSearchParams()
        if (this.filters.year) params.append('year', this.filters.year)
        if (Array.isArray(this.filters.seasons) && this.filters.seasons.length > 0) {
          this.filters.seasons.forEach(s => params.append('seasons', s))
        }
        if (this.filters.dateRange && this.filters.dateRange.length === 2) {
          params.append('startDate', this.filters.dateRange[0])
          params.append('endDate', this.filters.dateRange[1])
        }

        let data = []
        
        if (this.customGroups.length > 0) {
          // 自定义分组模式：使用POST接口
          const requestBody = {
            groups: this.customGroups.map(g => ({
              groupIndex: g.groupIndex,
              hours: g.hours
            }))
          }
          
          console.log('[HourlyStatistics] 发送分组查询请求:', {
            url: '/api/map/hourly-statistics-by-groups',
            params: params.toString(),
            body: requestBody
          })
          
          const response = await this.$axios.post(
            `/api/map/hourly-statistics-by-groups?${params.toString()}`,
            requestBody
          )
          
          console.log('[HourlyStatistics] 分组查询返回:', response.data)
          
          // 处理响应数据
          if (response.data) {
            if (response.data.code === 200 && response.data.data) {
              data = response.data.data
            } else if (Array.isArray(response.data)) {
              data = response.data
            } else if (response.data.data && Array.isArray(response.data.data)) {
              data = response.data.data
            } else if (response.data.success === false || response.data.code !== 200) {
              const errorMsg = response.data.errorMsg || response.data.msg || '获取数据失败'
              this.$message.error(errorMsg)
              return
            }
          }
          
          if (!Array.isArray(data) || data.length === 0) {
            this.groupData = []
            this.computeStats()
            this.renderChart()
            this.$message.info('暂无数据，建议调整筛选条件或检查后端数据')
            return
          }
          
          // 按组索引排序
          data.sort((a, b) => (a.groupIndex || 0) - (b.groupIndex || 0))
          this.groupData = data
        } else {
          // 原始模式：使用GET接口
          const resp = await fetch(`/api/map/hourly-statistics?${params.toString()}`)
          if (!resp.ok) {
            const msg = `接口错误(${resp.status})`
            this.$message && this.$message.error(msg)
            console.error('[HourlyStatistics] 请求失败:', msg)
            return
          }
          const result = await resp.json()
          console.log('[HourlyStatistics] 接口返回原始数据:', result)
          
          // 兼容 Result 包装结构 { code, data, msg }
          const rawData = Array.isArray(result) ? result : (result && result.data ? result.data : [])
          if (!Array.isArray(rawData) || rawData.length === 0) {
            this.seriesData = Array(24).fill(0)
            this.computeStats()
            this.renderChart()
            this.$message && this.$message.info('暂无数据，建议调整筛选条件或检查后端数据')
            return
          }
          
          const hours = Array(24).fill(0)
          rawData.forEach(item => {
            const h = typeof item.hour === 'number' ? item.hour : parseInt(item.hour, 10)
            if (!isNaN(h) && h >= 0 && h <= 23) {
              hours[h] = typeof item.count === 'number' ? item.count : parseInt(item.count, 10) || 0
            }
          })
          this.seriesData = hours
        }
        
        this.computeStats()
        this.renderChart()
      } catch (e) {
        this.$message && this.$message.error('获取数据失败')
        console.error('[HourlyStatistics] 异常:', e)
        if (e.response) {
          console.error('[HourlyStatistics] 响应状态:', e.response.status)
          console.error('[HourlyStatistics] 响应数据:', e.response.data)
        }
      } finally {
        this.loading = false
      }
    },
    computeStats() {
      if (this.customGroups.length > 0) {
        // 自定义分组模式统计
        const sum = this.groupData.reduce((a, b) => a + (b.count || 0), 0)
        this.total = sum
        this.averageValue = this.groupData.length > 0 ? Math.round(sum / this.groupData.length) : 0
        this.countLabel = this.groupData.length
        
        let max = -1
        let peakGroup = null
        this.groupData.forEach((item) => {
          const count = item.count || 0
          if (count > max) {
            max = count
            peakGroup = item
          }
        })
        this.peakLabel = peakGroup ? `分组 ${(peakGroup.groupIndex || 0) + 1}` : '-'
      } else {
        // 原始模式统计
        const sum = this.seriesData.reduce((a, b) => a + b, 0)
        this.total = sum
        this.averageValue = this.seriesData.length ? Math.round(sum / this.seriesData.length) : 0
        this.countLabel = this.seriesData.filter(v => v > 0).length
        
        let max = -1, idx = -1
        this.seriesData.forEach((v, i) => { 
          if (v > max) { 
            max = v
            idx = i 
          } 
        })
        this.peakLabel = idx >= 0 ? `${idx.toString().padStart(2, '0')}:00-${((idx + 1) % 24).toString().padStart(2, '0')}:00` : '-'
      }
    },
    initChart() {
      this.chart = echarts.init(this.$refs.chart)
      this.renderChart()
    },
    renderChart() {
      if (!this.chart) return
      
      let option = {}
      
      if (this.customGroups.length > 0) {
        // 自定义分组模式：横向柱状图
        if (this.groupData.length === 0) {
          option = {
            title: {
              text: '暂无数据',
              left: 'center',
              top: 'center',
              textStyle: {
                color: '#999',
                fontSize: 16
              }
            },
            xAxis: { type: 'value', name: '病例数' },
            yAxis: { type: 'category', data: [] },
            series: []
          }
        } else {
          // Y轴显示：第一组、第二组等
          const categories = this.groupData.map((item, index) => {
            const groupNumber = (item.groupIndex !== undefined && item.groupIndex !== null) 
              ? item.groupIndex + 1 
              : index + 1
            return `第${groupNumber}组`
          })
          const values = this.groupData.map(item => item.count || 0)
          
          option = {
            tooltip: { 
              trigger: 'axis',
              axisPointer: { type: 'shadow' },
              formatter: (params) => {
                const param = params[0]
                const dataIndex = param.dataIndex
                const group = this.groupData[dataIndex]
                // Tooltip显示具体的时间段
                const timeLabel = group.groupLabel || group.hoursDisplay || '未知时间段'
                return `${timeLabel}<br/>病例数量: ${param.value}人`
              }
            },
            grid: { 
              left: '12%', 
              right: '5%', 
              top: '5%', 
              bottom: '10%', 
              containLabel: false 
            },
            xAxis: { 
              type: 'value', 
              name: '病例数',
              nameLocation: 'middle',
              nameGap: 30,
              axisLabel: {
                show: true,
                fontSize: 12
              }
            },
            yAxis: { 
              type: 'category', 
              data: categories,
              axisLabel: { 
                interval: 0,
                fontSize: 12
              }
            },
            series: [{
              type: 'bar',
              name: '病例数',
              data: values,
              itemStyle: { 
                color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              },
              emphasis: {
                itemStyle: {
                  color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                    { offset: 0, color: '#2378f7' },
                    { offset: 0.7, color: '#2378f7' },
                    { offset: 1, color: '#83bff6' }
                  ])
                }
              },
              label: {
                show: true,
                position: 'right',
                formatter: '{c}'
              }
            }]
          }
        }
      } else {
        // 原始模式：横向柱状图，显示24小时
        // Y轴标签格式：23-24, 00-01, 01-02, ...
        const hours = Array.from({ length: 24 }, (_, i) => {
          const current = i.toString().padStart(2, '0')
          const next = ((i + 1) % 24).toString().padStart(2, '0')
          return `${current}-${next}`
        })
        
        // 用于tooltip的时间段标签
        const hourLabels = Array.from({ length: 24 }, (_, i) => {
          const current = i.toString().padStart(2, '0')
          const next = ((i + 1) % 24).toString().padStart(2, '0')
          return `${current}-${next}`
        })
        
        option = {
          tooltip: { 
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
              const param = params[0]
              const hourLabel = hourLabels[param.dataIndex]
              return `${hourLabel}<br/>病例数量: ${param.value}人`
            }
          },
          grid: { 
            left: '10%', 
            right: '5%', 
            top: '5%', 
            bottom: '10%', 
            containLabel: false 
          },
          xAxis: { 
            type: 'value', 
            name: '病例数',
            nameLocation: 'middle',
            nameGap: 30,
            axisLabel: {
              show: true,
              fontSize: 12
            }
          },
          yAxis: { 
            type: 'category', 
            data: hours,
            axisLabel: { 
              interval: 0,
              fontSize: 12
            }
          },
          series: [{
            type: 'bar',
            name: '病例数',
            data: this.seriesData,
            itemStyle: { 
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' }
                ])
              }
            },
            label: {
              show: true,
              position: 'right',
              formatter: '{c}'
            }
          }]
        }
      }
      
      this.chart.setOption(option)
    },
    handleResize() {
      if (this.chart) this.chart.resize()
    }
  }
}
</script>

<style scoped>
.hourly-statistics-container { 
  padding: 20px; 
  background: #f5f7fa; 
  min-height: 100vh; 
}

.header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 16px; 
  background: #fff; 
  padding: 16px 20px; 
  border-radius: 8px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.08); 
}

.header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.controls { 
  display: flex; 
  align-items: center; 
  flex-wrap: wrap; 
}

.group-info-banner {
  margin-bottom: 16px;
}

.stats { 
  margin-bottom: 16px; 
}

.stat-card { 
  background: #fff; 
  padding: 20px; 
  border-radius: 8px; 
  text-align: center; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.08); 
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.stat-value { 
  font-size: 28px; 
  font-weight: bold; 
  color: #409EFF; 
  margin-bottom: 8px;
}

.stat-label { 
  font-size: 14px; 
  color: #909399; 
}

.chart-wrapper { 
  background: #fff; 
  padding: 20px; 
  border-radius: 8px; 
  box-shadow: 0 2px 12px rgba(0,0,0,0.08); 
}

.chart { 
  width: 100%; 
  height: 600px; 
}
</style>
