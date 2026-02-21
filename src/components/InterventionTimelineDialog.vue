<template>
  <el-dialog
    :visible="true"
    width="800px"
    :before-close="handleClose"
    title="干预时间线"
    class="timeline-dialog"
  >
    <!-- 患者信息头部 -->
    <div class="patient-header">
        <h3>患者干预时间线</h3>
      <div class="patient-info">
          <div class="info-item">
            <span class="label">患者ID:</span>
          <span class="value">{{ patientId || '未知' }}</span>
          </div>
          <div class="info-item">
            <span class="label">接诊日期:</span>
          <span class="value">{{ admissionDate }}</span>
          </div>
          <div class="info-item">
          <span class="label">关键事件:</span>
          <span class="value">{{ keyEvents.length }} 项</span>
          </div>
          <div class="info-item">
          <span class="label">非关键事件:</span>
          <span class="value">{{ nonKeyEvents.length }} 项</span>
        </div>
      </div>
    </div>
    
    <!-- 时间线容器 - 按时间分组布局 -->
    <div class="timeline-container">
      <!-- 中央时间轴 -->
      <div class="timeline-axis"></div>
      
      <!-- 时间线事件列表 - 按时间分组 -->
      <div class="timeline-events">
        <div 
          v-for="(timeGroup, timeIndex) in groupedTimelineEvents"
          :key="timeIndex"
          class="timeline-time-group"
        >
          <!-- 时间点 -->
          <div class="time-point">
            <div class="time-dot" :class="{ 'key-dot': timeGroup.hasKeyEvent }"></div>
            <div class="time-label">{{ formatEventTime(timeGroup.time) }}</div>
          </div>
          
          <!-- 该时间点的所有事件 -->
          <div class="events-row">
            <!-- 关键事件（左侧） -->
            <div class="key-events">
              <div class="key-events-row">
                <div 
                  v-for="(event, eventIndex) in timeGroup.keyEvents"
                  :key="`key-${eventIndex}`"
                  class="event-item key-event compact"
                  @click="showStatistics(event)"
                >
                <div class="event-icon">
                    <i :class="getEventIcon(event.eventName)"></i>
                </div>
                <div class="event-details">
                    <div class="event-name">{{ event.eventName }}</div>
          </div>
        </div>
      </div>
    </div>
    
            <!-- 非关键事件（右侧） -->
            <div class="non-key-events">
              <!-- 非关键事件横向排列 -->
              <div class="non-key-events-row">
                <div 
                  v-for="(eventGroup, eventIndex) in timeGroup.nonKeyEvents"
                  :key="`non-key-${eventIndex}`"
                  class="event-item non-key-event compact"
                >
                <div class="event-icon">
                    <i :class="getEventIcon(eventGroup.eventName)"></i>
                </div>
                <div class="event-details">
                    <div class="event-name">{{ eventGroup.eventName }}</div>
                </div>
                </div>
              </div>
              
              <!-- 去向信息显示在右侧底部 -->
              <div v-if="timeGroup.keyEvents.some(event => event.eventName === '离室')" class="destination-info">
                <span class="destination-label">去向:</span>
                <span class="destination-value">{{ timeGroup.keyEvents.find(event => event.eventName === '离室')?.destination || '未知' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="exportTimeline">导出时间线</el-button>
    </span>

    <!-- 统计曲线弹窗 -->
    <el-dialog
      :visible="statisticsDialogVisible"
      width="800px"
      :before-close="closeStatisticsDialog"
      :title="`${selectedEventName} - 统计分布`"
      class="statistics-dialog"
      :append-to-body="true"
      :modal="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      :destroy-on-close="false"
    >
      <div class="statistics-content">
        <div class="statistics-header" style="background: #f5f7fa; border: 1px solid #e4e7ed; padding: 15px; margin: -20px -20px 15px -20px; border-radius: 4px;">
          <h3 class="statistics-title" style="font-size: 18px; font-weight: 500; margin: 0 0 10px 0; color: #303133;">{{ statisticsData.eventName || statisticsData.eventType || selectedEventName }} - 统计分布</h3>
          <div class="statistics-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
            <div class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">平均时间</div>
              <div class="statistics-item-value" style="font-size: 14px; font-weight: 500; color: #303133;">{{ statisticsData.meanTime?.toFixed(1) }} 分钟</div>
            </div>
            <div class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">标准差</div>
              <div class="statistics-item-value" style="font-size: 14px; font-weight: 500; color: #303133;">{{ statisticsData.standardDeviation?.toFixed(1) }} 分钟</div>
            </div>
            <div class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">当前患者时间</div>
              <div class="statistics-item-value" style="font-size: 14px; font-weight: 500; color: #303133;">{{ statisticsData.currentPatientTime?.toFixed(1) }} 分钟</div>
            </div>
            <div class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">与均值差值</div>
              <div class="statistics-item-value" :class="getDifferenceClass()" style="font-size: 14px; font-weight: 500;">
                {{ getTimeDifference() }}
              </div>
            </div>
            <div class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">质控标准线</div>
              <div class="statistics-item-value" style="font-size: 14px; font-weight: 500; color: #303133;">{{ statisticsData.qualityControlLine?.toFixed(1) }} 分钟</div>
            </div>
            <div v-if="statisticsData.validDataCount != null" class="statistics-item" style="background: #fff; padding: 8px 12px; border: 1px solid #e4e7ed; border-radius: 4px;">
              <div class="statistics-item-label" style="font-size: 12px; color: #909399; margin-bottom: 2px;">有效数据</div>
              <div class="statistics-item-value" style="font-size: 14px; font-weight: 500; color: #303133;">{{ statisticsData.validDataCount }} 条</div>
            </div>
          </div>
        </div>
        
        <div class="chart-container">
          <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
        </div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'InterventionTimelineDialog',
  props: {
    patientId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      keyEvents: [],
      nonKeyEvents: [],
      admissionDate: '',
      statisticsDialogVisible: false,
      selectedEventName: '',
      statisticsData: {},
      chart: null
    }
  },
  computed: {
    timelineEvents() {
      // 合并所有事件并按时间排序
      const allEvents = [
        ...this.keyEvents.map(event => ({ ...event, eventType: 'key' })),
        ...this.nonKeyEvents.map(event => ({ ...event, eventType: 'non_key' }))
      ]
      
      // 按时间排序
      return allEvents
        .filter(event => event.eventTime)
        .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime))
    },
    
    groupedTimelineEvents() {
      // 按时间分组事件
      const timeGroups = {}
      
      // 处理关键事件
      this.keyEvents.forEach(event => {
        if (event.eventTime) {
          const timeKey = new Date(event.eventTime).getTime()
          if (!timeGroups[timeKey]) {
            timeGroups[timeKey] = {
              time: event.eventTime,
              keyEvents: [],
              nonKeyEvents: [],
              hasKeyEvent: false
            }
          }
          timeGroups[timeKey].keyEvents.push(event)
          timeGroups[timeKey].hasKeyEvent = true
        }
      })
      
      // 处理非关键事件 - 按事件名称分组
      const nonKeyEventGroups = {}
      this.nonKeyEvents.forEach(event => {
        if (event.eventTime) {
          const timeKey = new Date(event.eventTime).getTime()
          if (!timeGroups[timeKey]) {
            timeGroups[timeKey] = {
              time: event.eventTime,
              keyEvents: [],
              nonKeyEvents: [],
              hasKeyEvent: false
            }
          }
          
          // 按事件名称分组
          const eventName = event.eventName
          if (!nonKeyEventGroups[timeKey]) {
            nonKeyEventGroups[timeKey] = {}
          }
          if (!nonKeyEventGroups[timeKey][eventName]) {
            nonKeyEventGroups[timeKey][eventName] = {
              eventName: eventName,
              events: [],
              destination: event.destination
            }
          }
          nonKeyEventGroups[timeKey][eventName].events.push(event)
        }
      })
      
      // 将分组的非关键事件添加到时间组
      Object.keys(nonKeyEventGroups).forEach(timeKey => {
        const timeGroup = timeGroups[timeKey]
        if (timeGroup) {
          timeGroup.nonKeyEvents = Object.values(nonKeyEventGroups[timeKey])
        }
      })
      
      // 转换为数组并按时间排序
      return Object.values(timeGroups)
        .sort((a, b) => new Date(a.time) - new Date(b.time))
    }
  },
  watch: {
    statisticsDialogVisible(newVal) {
      if (newVal) {
        // 对话框打开时，确保图表正确显示
        this.$nextTick(() => {
          setTimeout(() => {
            if (this.chart) {
              this.chart.resize()
            } else if (this.statisticsData && Object.keys(this.statisticsData).length > 0) {
              this.initChart()
            }
          }, 100)
        })
      }
    }
  },
  mounted() {
    this.loadTimelineData()
  },
  methods: {
    async loadTimelineData() {
      try {
        console.log('开始加载患者时间线数据，患者ID:', this.patientId)
        
        // 加载关键事件
        const keyResponse = await this.$axios.get(`/api/intervention/key-events/${this.patientId}`)
        console.log('关键事件API响应:', keyResponse.data)
        this.keyEvents = keyResponse.data.data || []
        
        // 加载非关键事件
        const nonKeyResponse = await this.$axios.get(`/api/intervention/non-key-events/${this.patientId}`)
        console.log('非关键事件API响应:', nonKeyResponse.data)
        this.nonKeyEvents = nonKeyResponse.data.data || []
        
        console.log('加载完成 - 关键事件数量:', this.keyEvents.length, '非关键事件数量:', this.nonKeyEvents.length)
        
        // 设置接诊日期
        if (this.keyEvents.length > 0) {
          const admissionEvent = this.keyEvents.find(event => event.eventName === '入室')
          if (admissionEvent) {
            this.admissionDate = this.formatDate(admissionEvent.eventTime)
          }
        }
      } catch (error) {
        console.error('加载时间线数据失败:', error)
        this.$message.error('加载时间线数据失败: ' + error.message)
      }
    },
    
    getEventIcon(eventName) {
      const iconMap = {
        '入室': 'el-icon-s-home',
        '采血': 'el-icon-document',
        'CT': 'el-icon-camera',
        '离室': 'el-icon-right',
        '外周静脉': 'el-icon-connection',
        '鼻导管': 'el-icon-wind-power'
      }
      return iconMap[eventName] || 'el-icon-document'
    },
    
    async showStatistics(event) {
      try {
        this.selectedEventName = event.eventName
        this.statisticsDialogVisible = true
        
        // 使用与 KeyEventsDistributionPage.vue 完全相同的接口
        const response = await this.$axios.get('/api/intervention/all-key-events-statistics', {
          params: {
            patientId: this.patientId
          }
        })
        
        if (response.data.success) {
          const data = response.data.data
          const eventStatistics = data.eventStatistics || []
          const errorData = data.errorData || []
          const errorCount = data.errorCount || 0
          
          // 从所有事件统计中筛选出当前事件的数据
          const currentEventStat = eventStatistics.find(stat => stat.eventName === event.eventName)
          
          if (!currentEventStat) {
            this.$message.error('未找到该事件的统计数据')
            this.statisticsDialogVisible = false
            return
          }
          
          // 将 KeyEventStatisticsDTO 转换为与之前兼容的格式
          this.statisticsData = {
            eventType: currentEventStat.eventType,
            eventName: currentEventStat.eventName,
            meanTime: currentEventStat.meanTime,
            medianTime: currentEventStat.medianTime,
            standardDeviation: currentEventStat.standardDeviation,
            qualityControlLine: currentEventStat.qualityControlLine,
            currentPatientTime: currentEventStat.currentPatientTime,
            validDataCount: currentEventStat.validDataCount
          }
          
          // 更新全局错误数据（如果存在）
          if (this.$root.updateErrorData) {
            this.$root.updateErrorData(errorData, errorCount)
          }
          
          // 等待对话框完全打开后再初始化图表
          this.$nextTick(() => {
            // 使用setTimeout确保对话框动画完成
            setTimeout(() => {
              this.initChart()
            }, 300)
          })
          
          if (errorCount > 0) {
            this.$message.warning(`发现 ${errorCount} 条错误数据，已记录到文件并可在导航栏通知中查看`)
          }
        } else {
          this.$message.error(response.data.errorMsg || '获取统计数据失败')
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        this.$message.error('获取统计数据失败: ' + error.message)
      }
    },
    
    getEventTypeKey(eventName) {
      const eventTypeMap = {
        '入室': 'admission',
        'CT': 'ct',
        '气管插管': 'intubation',
        '输血开始': 'transfusion',
        '离室': 'discharge',
        '死亡': 'death'
      }
      return eventTypeMap[eventName] || 'unknown'
    },
    
    getTimeDifference() {
      if (!this.statisticsData.currentPatientTime || !this.statisticsData.meanTime) {
        return '0.0 分钟'
      }
      const difference = this.statisticsData.currentPatientTime - this.statisticsData.meanTime
      const sign = difference >= 0 ? '+' : ''
      return `${sign}${difference.toFixed(1)} 分钟`
    },
    
    getDifferenceClass() {
      if (!this.statisticsData.currentPatientTime || !this.statisticsData.meanTime) {
        return ''
      }
      const difference = this.statisticsData.currentPatientTime - this.statisticsData.meanTime
      if (Math.abs(difference) <= this.statisticsData.standardDeviation) {
        return 'normal-difference' // 在1个标准差内，正常
      } else if (difference > 0) {
        return 'positive-difference' // 超过均值，较慢
      } else {
        return 'negative-difference' // 低于均值，较快
      }
    },
    
    initChart() {
      if (!this.$refs.chartContainer) {
        console.warn('图表容器不存在，延迟初始化')
        setTimeout(() => {
          this.initChart()
        }, 100)
        return
      }
      
      // 销毁已存在的图表实例
      if (this.chart) {
        this.chart.dispose()
        this.chart = null
      }
      
      // 确保容器有尺寸
      const container = this.$refs.chartContainer
      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('图表容器尺寸为0，延迟初始化')
        setTimeout(() => {
          this.initChart()
        }, 200)
        return
      }
      
      try {
        this.chart = echarts.init(this.$refs.chartContainer)
        console.log('图表初始化成功，容器尺寸:', container.offsetWidth, 'x', container.offsetHeight)
      } catch (error) {
        console.error('图表初始化失败:', error)
        return
      }
      
      // 使用与 KeyEventsDistributionPage.vue 完全相同的 updateChart 逻辑
      this.updateChart(this.chart, this.statisticsData)
      
      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize)
    },
    
    /**
     * 更新图表 - 完全参考 KeyEventsDistributionPage.vue 的实现
     */
    updateChart(chart, eventStat) {
      const mean = eventStat.meanTime || 0
      const std = eventStat.standardDeviation || 0
      const qualityControlLine = eventStat.qualityControlLine || 0
      const currentPatientTime = eventStat.currentPatientTime
      
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
      // 如果当前患者时间超出范围，扩展X轴范围以包含它
      let xAxisMin = mean - 2 * std
      let xAxisMax = mean + 2 * std
      if (currentPatientTime != null) {
        if (currentPatientTime < xAxisMin) {
          xAxisMin = currentPatientTime - std // 扩展范围，留出一些空间
        }
        if (currentPatientTime > xAxisMax) {
          xAxisMax = currentPatientTime + std // 扩展范围，留出一些空间
        }
      }
      
      // 计算Y轴最大值
      const maxY = Math.max(...curveData.map(p => p[1]))
      
      // 为图例显示创建虚拟数据点（位于图表范围外，不可见但能让图例正确显示样式）
      const legendDummyPoint = [xAxisMin - (xAxisMax - xAxisMin) * 0.1, 0]
      
      const option = {
        title: {
          text: `${eventStat.eventName || this.selectedEventName} - 正态分布图`,
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
            if (currentPatientTime != null) {
              result += `<br/>当前患者时间: ${currentPatientTime.toFixed(2)} 分钟`
            }
            return result
          }
        },
        legend: {
          data: currentPatientTime != null 
            ? ['正态分布曲线', '均值线', '质控标准线', '当前患者时间']
            : ['正态分布曲线', '均值线', '质控标准线'],
          top: 35
        },
        grid: {
          left: '8%',
          right: '4%',
          bottom: '12%',  // 底部空间用于显示关键点标注
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
              // 所有Y轴标签都保留三位小数
              return value.toFixed(3)
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
            data: [legendDummyPoint],  // 虚拟数据点，用于图例显示，位于图表范围外
            lineStyle: {
              color: '#409EFF',
              type: 'dashed',
              width: 2
            },
            itemStyle: {
              color: '#409EFF'
            },
            symbol: 'none',  // 不显示数据点标记
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
            data: [legendDummyPoint],  // 虚拟数据点，用于图例显示，位于图表范围外
            lineStyle: {
              color: '#F56C6C',
              type: 'dashed',
              width: 2
            },
            itemStyle: {
              color: '#F56C6C'
            },
            symbol: 'none',  // 不显示数据点标记
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
          },
          // 当前事件线（仅当存在当前患者时间时显示）
          ...(currentPatientTime != null ? [{
            name: '当前事件',
            type: 'line',
            data: [],  // 空数据，只用于显示markLine
            lineStyle: {
              color: '#409EFF',
              width: 3
            },
            markLine: {
              data: [
                {
                  name: '当前事件',
                  xAxis: currentPatientTime,
                  lineStyle: {
                    color: '#409EFF',
                    type: 'solid',
                    width: 3
                  },
                  label: {
                    show: true,
                    formatter: `当前: ${currentPatientTime.toFixed(2)}`,
                    position: 'middle',  // 显示在竖线中心
                    color: '#409EFF',
                    fontSize: 12,
                    fontWeight: 'bold',
                    rotate: 0,
                    offset: [10, 0]  // 向右偏移，避免与竖线重叠
                  }
                }
              ],
              silent: true
            }
          }] : [])
        ],
        graphic: []  // 初始为空，会在渲染后动态添加
      }
      
      chart.setOption(option)
      
      // 在图表渲染后，使用graphic组件在X轴底部添加关键点标签
      setTimeout(() => {
        try {
          const graphicLabels = []
          
          // 需要添加标注的关键点：-2D、-D、0、均值、+D、+2D（保持在底部）
          const labelsToAdd = [
            { value: keyPoints.minus2D, text: '-2D', bottom: '2%' },
            { value: keyPoints.minusD, text: '-D', bottom: '2%' },
            { value: keyPoints.zero, text: '0', bottom: '2%' },
            { value: keyPoints.mean, text: mean.toFixed(2), bottom: '2%' },
            { value: keyPoints.plusD, text: '+D', bottom: '2%' },
            { value: keyPoints.plus2D, text: '+2D', bottom: '2%' }
          ]
          
          // 注意：当前患者时间的标注已经在markLine的label中显示在图表内部，不需要添加到底部标注
          
          labelsToAdd.forEach(({ value, text, bottom }) => {
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
                  bottom: bottom || '2%',  // 使用指定的bottom值，默认为2%
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
    
    formatEventTime(eventTime) {
      if (!eventTime) return ''
      
      const date = new Date(eventTime)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },
    
    formatDate(eventTime) {
      if (!eventTime) return ''
      
      const date = new Date(eventTime)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      
      return `${year}-${month}-${day}`
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    closeStatisticsDialog() {
      this.statisticsDialogVisible = false
      if (this.chart) {
        this.chart.dispose()
        this.chart = null
      }
      // 移除窗口大小变化监听器
      window.removeEventListener('resize', this.handleResize)
    },
    
    exportTimeline() {
      // 实现导出功能
      this.$message.info('导出功能开发中...')
    },
    
    handleClose() {
      this.closeStatisticsDialog()
      this.$emit('close')
    }
  },
  
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  }
}
</script>

<style>
/* 全局样式，不使用scoped */
.timeline-dialog .patient-header {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.timeline-dialog .patient-header h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 18px;
}

.timeline-dialog .patient-info {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.timeline-dialog .info-item {
  display: flex;
  align-items: center;
}

.timeline-dialog .label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.timeline-dialog .value {
  color: #303133;
  font-weight: 600;
}

.timeline-dialog .timeline-container {
  max-height: 500px;
  overflow-y: auto;
  padding: 20px 0;
  position: relative;
}

.timeline-dialog .timeline-axis {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e4e7ed;
  transform: translateX(-50%);
  z-index: 1;
}

.timeline-dialog .timeline-events {
  width: 100%;
  position: relative;
  z-index: 2;
}

.timeline-dialog .timeline-time-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  position: relative;
  width: 100%;
}

.timeline-dialog .time-point {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  min-width: 120px;
}

.timeline-dialog .time-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #67C23A;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #67C23A;
  position: relative;
}

.timeline-dialog .time-dot.key-dot {
  background: #409EFF;
  box-shadow: 0 0 0 2px #409EFF;
}

.timeline-dialog .time-label {
  margin-top: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #303133;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  white-space: nowrap;
  text-align: center;
  line-height: 1.2;
}

.timeline-dialog .events-row {
  display: flex;
  width: 100%;
  min-height: 60px;
  align-items: flex-start;
  padding-top: 20px;
}

.timeline-dialog .key-events {
  flex: 1;
  padding-right: 100px; /* 进一步减少关键事件到时间线的距离 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-end; /* 让关键事件右对齐，更靠近时间线 */
  align-items: flex-end; /* 关键事件右对齐 */
}

.timeline-dialog .key-events-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  justify-content: flex-end; /* 关键事件行右对齐，更靠近时间线 */
}

.timeline-dialog .non-key-events {
  flex: 1;
  padding-left: 30px; /* 非关键事件距离时间线左侧80px */
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.timeline-dialog .non-key-events-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
}

.timeline-dialog .event-item {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  max-width: 100%;
}

.timeline-dialog .event-item.compact {
  padding: 8px 10px;
  border-radius: 6px;
  min-width: 80px;
  max-width: 120px;
  flex-shrink: 0;
}

.timeline-dialog .event-item.key-event {
  cursor: pointer;
  border-color: #409EFF;
}

.timeline-dialog .event-item.key-event:hover {
  background: #f0f9ff;
  border-color: #409EFF;
  transform: translateX(-3px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}

.timeline-dialog .event-item.non-key-event {
  border-color: #67C23A;
}

.timeline-dialog .event-item.non-key-event:hover {
  background: #f0f9ff;
  border-color: #67C23A;
  transform: translateX(3px);
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.2);
}

.timeline-dialog .event-icon {
  margin-right: 10px;
  margin-top: 2px;
  flex-shrink: 0;
}

.timeline-dialog .event-icon i {
  font-size: 16px;
  color: #606266;
}

.timeline-dialog .event-item.compact .event-icon i {
  font-size: 14px;
}

.timeline-dialog .key-event .event-icon i {
  color: #409EFF;
}

.timeline-dialog .non-key-event .event-icon i {
  color: #67C23A;
}

.timeline-dialog .event-details {
  flex: 1;
  min-width: 0;
}

.timeline-dialog .event-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.3;
}

.timeline-dialog .event-item.compact .event-name {
  font-size: 12px;
  margin-bottom: 2px;
  line-height: 1.2;
}

.timeline-dialog .event-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 6px;
}

.timeline-dialog .destination-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  margin-top: 8px;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  position: absolute;
  bottom: -10px;
  right: 0;
  min-width: 120px;
}

.timeline-dialog .destination-label {
  color: #606266;
  margin-right: 6px;
}

.timeline-dialog .destination-value {
  color: #409EFF;
  font-weight: 600;
}

.timeline-dialog .statistics-content .statistics-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.timeline-dialog .chart-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  background: #fff;
  min-height: 400px;
}

/* 统计对话框样式 */
.timeline-dialog .statistics-dialog {
  z-index: 3000 !important;
}

.timeline-dialog .statistics-dialog .el-dialog {
  background: #fff !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body {
  background: #fff !important;
  padding: 20px !important;
}

.timeline-dialog .statistics-content {
  background: #fff;
  min-height: 500px;
}

.timeline-dialog .statistics-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

/* 统计对话框顶部样式 - 使用更高优先级 */
.timeline-dialog .statistics-dialog .el-dialog__body .statistics-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 20px !important;
  margin: -20px -20px 20px -20px !important;
  border-radius: 8px 8px 0 0 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-title {
  font-size: 24px !important;
  font-weight: 600 !important;
  margin: 0 0 15px 0 !important;
  text-align: center !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  color: white !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-list {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
  gap: 12px !important;
  margin-top: 15px !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item {
  background: rgba(255, 255, 255, 0.15) !important;
  padding: 12px 16px !important;
  border-radius: 8px !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s ease !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item-label {
  font-size: 14px !important;
  font-weight: 500 !important;
  margin-bottom: 4px !important;
  opacity: 0.9 !important;
  color: white !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item-value {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #fff !important;
}

.timeline-dialog .chart-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 20px 0 10px 0;
  padding: 15px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.timeline-dialog .chart-subtitle {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 20px;
  font-style: italic;
}

/* 差值颜色样式 */
.timeline-dialog .normal-difference {
  color: #67C23A;
  font-weight: 600;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item-value.normal-difference {
  color: #67C23A !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item-value.warning-difference {
  color: #E6A23C !important;
}

.timeline-dialog .statistics-dialog .el-dialog__body .statistics-item-value.danger-difference {
  color: #F56C6C !important;
}

.timeline-dialog .positive-difference {
  color: #E6A23C;
  font-weight: 600;
}

.timeline-dialog .negative-difference {
  color: #409EFF;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timeline-dialog .patient-info {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .timeline-dialog .time-point {
    min-width: 100px;
  }
  
  .timeline-dialog .time-label {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .timeline-dialog .events-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .timeline-dialog .key-events,
  .timeline-dialog .non-key-events {
    padding: 0;
    width: 100%;
  }
  
  .timeline-dialog .event-item {
    padding: 10px;
  }
  
  .timeline-dialog .event-icon i {
    font-size: 14px;
  }
  
  .timeline-dialog .event-name {
  font-size: 13px;
  }
  
  .timeline-dialog .event-description {
    font-size: 11px;
  }
  
  .timeline-dialog .destination-info {
    font-size: 11px;
    position: static;
    margin-top: 8px;
    min-width: auto;
  }
}
</style>