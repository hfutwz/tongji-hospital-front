<template>
  <div class="key-events-distribution-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>关键事件正态分布分析</h2>
        <p class="page-description">展示所有关键事件的正态分布图，包括均值线、质控标准线和完整分布曲线</p>
      </div>
      <div class="header-right">
        <!-- 计算按钮 -->
        <el-button 
          type="primary" 
          size="medium" 
          @click="calculateStatistics"
          :loading="loading"
          icon="el-icon-data-analysis"
        >
          计算并展示正态分布
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-loading :loading="loading" text="正在计算统计数据..."></el-loading>
    </div>

    <!-- 图表展示区域 -->
    <div v-if="!loading && eventStatistics.length > 0" class="charts-container">
      <div 
        v-for="(eventStat, index) in eventStatistics" 
        :key="index"
        class="chart-card"
      >
        <div class="chart-header">
          <h3 class="chart-title">{{ eventStat.eventName }}</h3>
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-label">均值(μ):</span>
              <span class="stat-value">{{ eventStat.meanTime?.toFixed(2) }} 分钟</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标准差(σ):</span>
              <span class="stat-value">{{ eventStat.standardDeviation?.toFixed(2) }} 分钟</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">质控标准线:</span>
              <span class="stat-value highlight">{{ eventStat.qualityControlLine?.toFixed(2) }} 分钟</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">有效数据:</span>
              <span class="stat-value">{{ eventStat.validDataCount }} 条</span>
            </div>
          </div>
        </div>
        <div 
          :ref="`chart-${index}`" 
          class="chart-content"
          :style="{ height: '400px' }"
        ></div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && eventStatistics.length === 0" class="empty-state">
      <i class="el-icon-data-line empty-icon"></i>
      <p class="empty-text">点击上方按钮计算并展示正态分布图</p>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'KeyEventsDistributionPage',
  data() {
    return {
      loading: false,
      eventStatistics: [],
      chartInstances: []
    }
  },
  mounted() {
    // 页面加载时不自动计算，等待用户点击按钮
  },
  beforeDestroy() {
    // 销毁所有图表实例
    this.chartInstances.forEach(chart => {
      if (chart) {
        chart.dispose()
      }
    })
    this.chartInstances = []
  },
  methods: {
    /**
     * 计算并展示所有关键事件的正态分布
     */
    async calculateStatistics() {
      this.loading = true
      try {
        const response = await this.$axios.get('/api/intervention/all-key-events-statistics')
        
        if (response.data.success) {
          const data = response.data.data
          this.eventStatistics = data.eventStatistics || []
          const errorData = data.errorData || []
          const errorCount = data.errorCount || 0
          
          // 更新全局错误数据
          if (this.$root.updateErrorData) {
            this.$root.updateErrorData(errorData, errorCount)
          }
          
          // 等待DOM更新后初始化图表
          this.$nextTick(() => {
            this.initAllCharts()
          })
          
          if (errorCount > 0) {
            this.$message.warning(`发现 ${errorCount} 条错误数据，已记录到文件并可在导航栏通知中查看`)
          } else {
            this.$message.success('计算完成，未发现错误数据')
          }
        } else {
          this.$message.error(response.data.errorMsg || '获取统计数据失败')
        }
      } catch (error) {
        console.error('计算统计数据失败:', error)
        this.$message.error('计算统计数据失败: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 初始化所有图表
     */
    initAllCharts() {
      // 先销毁所有现有图表
      this.chartInstances.forEach(chart => {
        if (chart) {
          chart.dispose()
        }
      })
      this.chartInstances = []
      
      // 为每个事件创建图表
      this.eventStatistics.forEach((eventStat, index) => {
        this.$nextTick(() => {
          const chartRef = this.$refs[`chart-${index}`]
          if (chartRef && chartRef[0]) {
            const chart = echarts.init(chartRef[0])
            this.chartInstances.push(chart)
            this.updateChart(chart, eventStat)
            
            // 响应式调整
            window.addEventListener('resize', () => {
              if (chart) {
                chart.resize()
              }
            })
          }
        })
      })
    },
    
    /**
     * 计算正态分布概率密度函数 (PDF)
     */
    normalPDF(x, mean, stdDev) {
      if (stdDev <= 0) return 0
      const coefficient = 1.0 / (stdDev * Math.sqrt(2 * Math.PI))
      const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2)
      return coefficient * Math.exp(exponent)
    },
    
    /**
     * 生成正态分布曲线数据点
     * @param mean 均值 (μ)
     * @param stdDev 标准差 (σ)
     * @param pointCount 数据点数量
     * @returns 曲线数据点数组 [[x1, y1], [x2, y2], ...]
     */
    generateNormalDistributionCurve(mean, stdDev, pointCount = 500) {
      if (stdDev <= 0) {
        return [[mean, 1.0]]
      }
      
      // 从 μ-2σ 到 μ+2σ，包含负半轴（不限制最小值）
      const minX = mean - 2 * stdDev
      const maxX = mean + 2 * stdDev
      const step = (maxX - minX) / (pointCount - 1)
      
      const curve = []
      for (let i = 0; i < pointCount; i++) {
        const x = minX + i * step
        const y = this.normalPDF(x, mean, stdDev)
        curve.push([x, y])
      }
      
      return curve
    },
    
    /**
     * 更新单个图表
     */
    updateChart(chart, eventStat) {
      const mean = eventStat.meanTime || 0
      const std = eventStat.standardDeviation || 0
      const qualityControlLine = eventStat.qualityControlLine || 0
      
      if (std <= 0 || mean === 0) {
        chart.setOption({
          title: {
            text: '暂无有效数据',
            left: 'center',
            top: 'middle',
            textStyle: {
              color: '#909399',
              fontSize: 16
            }
          }
        })
        return
      }
      
      // 在前端生成完整的正态分布曲线（从μ-2σ到μ+2σ，包含负半轴）
      const curveData = this.generateNormalDistributionCurve(mean, std, 500)
      
      // 计算关键点
      const keyPoints = {
        minus2D: mean - 2 * std,
        minusD: mean - std,
        mean: mean,
        plusD: mean + std,
        plus2D: mean + 2 * std,
        zero: 0
      }
      
      // X轴范围：从μ-2σ到μ+2σ（包含负半轴）
      const xAxisMin = mean - 2 * std
      const xAxisMax = mean + 2 * std
      
      // 计算Y轴最大值
      const maxY = Math.max(...curveData.map(p => p[1]))
      
      const option = {
        title: {
          text: `${eventStat.eventName} - 正态分布图`,
          left: 'center',
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: (params) => {
            let result = `时间: ${params[0].value[0].toFixed(2)} 分钟<br/>`
            if (params[0].seriesName === '正态分布曲线') {
              result += `概率密度: ${params[0].value[1].toFixed(4)}<br/>`
            }
            result += `均值(μ): ${mean.toFixed(2)} 分钟<br/>`
            result += `标准差(σ): ${std.toFixed(2)} 分钟<br/>`
            result += `质控标准线: ${qualityControlLine.toFixed(2)} 分钟`
            return result
          }
        },
        legend: {
          data: ['正态分布曲线', '均值线', '质控标准线'],
          top: 35
        },
        grid: {
          left: '8%',
          right: '4%',
          bottom: '12%',  // 增加底部空间，用于显示标注
          top: '15%',
          containLabel: true,
          show: false,  // 不显示网格背景
          borderWidth: 0  // 不显示边框
        },
        xAxis: {
          type: 'value',
          name: '时间（分钟）',
          nameLocation: 'middle',
          nameGap: 50,  // 增加间距，避免与底部标注重合
          min: xAxisMin,
          max: xAxisMax,
          splitNumber: 20,
          axisLabel: {
            show: false  // X轴不显示数值标签，所有标注通过graphic组件在底部显示
          },
          axisTick: {
            show: true  // 显示刻度线
          },
          splitLine: {
            show: false  // 不显示网格线
          }
        },
        yAxis: {
          type: 'value',
          name: '概率密度',
          nameLocation: 'middle',
          nameGap: 50,
          min: 0,
          max: maxY * 1.1,  // 稍微扩展Y轴范围以便更好地显示
          axisLabel: {
            formatter: (value) => {
              // 最上方数值保留三位小数
              if (value === maxY * 1.1 || value >= maxY * 1.09) {
                return value.toFixed(3)
              }
              return value.toFixed(3)  // 所有Y轴标签都保留三位小数
            }
          },
          splitLine: {
            show: false  // 不显示网格线
          }
        },
        series: [
          {
            name: '正态分布曲线',
            type: 'line',
            data: curveData,
            smooth: true,
            symbol: 'none',
            lineStyle: {
              color: '#409EFF',
              width: 2
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
                ]
              }
            }
          },
          {
            name: '均值线',
            type: 'line',
            data: [],  // 空数据，只用于显示markLine
            lineStyle: {
              color: '#409EFF',
              type: 'dashed',
              width: 2
            },
            markLine: {
              data: [
                {
                  name: '均值',
                  xAxis: mean,
                  lineStyle: {
                    color: '#409EFF',
                    type: 'dashed',
                    width: 2
                  },
                  label: {
                    show: true,
                    formatter: 'mean(t)',
                    position: 'inside',  // 显示在图表内部
                    color: '#409EFF',
                    fontSize: 12,
                    fontWeight: 'bold',
                    rotate: 0,  // 确保横向显示
                    offset: [0, -10]  // 向上偏移，显示在均值线顶部附近
                  }
                }
              ],
              silent: true
            }
          },
          {
            name: '质控标准线',
            type: 'line',
            data: [],  // 空数据，只用于显示markLine
            lineStyle: {
              color: '#F56C6C',
              type: 'dashed',
              width: 2
            },
            markLine: {
              data: qualityControlLine > 0 ? [
                {
                  name: '质控标准线',
                  xAxis: qualityControlLine,
                  lineStyle: {
                    color: '#F56C6C',
                    type: 'dashed',
                    width: 2
                  },
                  label: {
                    show: false  // 不显示标签，由X轴标注显示数值
                  }
                }
              ] : [],
              silent: true
            }
          }
        ],
        graphic: []  // 初始为空，会在渲染后动态添加
      }
      
      chart.setOption(option)
      
      // 在图表渲染后，使用graphic组件在X轴底部添加关键点标签
      setTimeout(() => {
        try {
          const graphicLabels = []
          
          // 需要添加标注的关键点：-2D、-D、0、均值、+D、+2D
          const labelsToAdd = [
            { value: keyPoints.minus2D, text: '-2D' },
            { value: keyPoints.minusD, text: '-D' },
            { value: keyPoints.zero, text: '0' },
            { value: keyPoints.mean, text: mean.toFixed(2) },
            { value: keyPoints.plusD, text: '+D' },
            { value: keyPoints.plus2D, text: '+2D' }
          ]
          
          labelsToAdd.forEach(({ value, text }) => {
            try {
              // 确保值在X轴范围内
              if (value >= xAxisMin && value <= xAxisMax) {
                const pixelX = chart.convertToPixel({ xAxisIndex: 0 }, value)
                const chartWidth = chart.getWidth()
                const leftPercent = ((pixelX / chartWidth) * 100).toFixed(2) + '%'
                
                graphicLabels.push({
                  type: 'text',
                  id: `label-${text}`,
                  left: leftPercent,
                  bottom: '2%',  // 在X轴底部显示
                  style: {
                    text: text,
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: '#606266',
                    textAlign: 'center'
                  },
                  z: 100
                })
              }
            } catch (e) {
              console.warn(`Failed to add label for ${text}:`, e)
            }
          })
          
          // 如果有需要添加的标签，更新图表
          if (graphicLabels.length > 0) {
            chart.setOption({
              graphic: graphicLabels
            })
          }
        } catch (e) {
          console.warn('Failed to add graphic labels:', e)
        }
      }, 300)
    }
  }
}
</script>

<style scoped>
.key-events-distribution-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: 20px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.chart-title {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.stat-value.highlight {
  color: #E6A23C;
  font-weight: 600;
}

.chart-content {
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.empty-text {
  color: #909399;
  font-size: 16px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
}
</style>

