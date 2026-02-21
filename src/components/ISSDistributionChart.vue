<template>
  <div class="iss-distribution-chart">
    <!-- 右上角标题 -->
    <div class="chart-title-overlay">
      <div class="chart-title">
        <i>🏥</i>
        ISS分布图
      </div>
    </div>
    
    <!-- 整体内容区域 - 可滚动 -->
    <div class="content-scroll-area">
      <!-- 核心圆饼图区域 -->
      <div class="chart-container">
        <div ref="chartContainer" class="chart"></div>
      </div>
      
      
      <!-- ISS评分说明区域（位于圆饼图下方） -->
      <div class="description-area">
        <div class="description-container">
          <div class="description-content">
            <div class="description-item" @click="handleISSSegmentClick('light')" style="cursor: pointer;">
              <span class="description-color" style="background-color: #52C41A;"></span>
              <span class="description-label">轻度损伤:</span>
              <span class="description-text">ISS≤16分</span>
              <span class="description-count" v-if="getCountByColor('#52C41A')">{{ getCountByColor('#52C41A') }}人 ({{ getPercentageByColor('#52C41A') }}%)</span>
            </div>
            <div class="description-item" @click="handleISSSegmentClick('severe')" style="cursor: pointer;">
              <span class="description-color" style="background-color: #FA8C16;"></span>
              <span class="description-label">重度损伤:</span>
              <span class="description-text">16&lt;ISS≤25分</span>
              <span class="description-count" v-if="getCountByColor('#FA8C16')">{{ getCountByColor('#FA8C16') }}人 ({{ getPercentageByColor('#FA8C16') }}%)</span>
            </div>
            <div class="description-item" @click="handleISSSegmentClick('critical')" style="cursor: pointer;">
              <span class="description-color" style="background-color: #F5222D;"></span>
              <span class="description-label">危害损伤:</span>
              <span class="description-text">ISS&gt;25分</span>
              <span class="description-count" v-if="getCountByColor('#F5222D')">{{ getCountByColor('#F5222D') }}人 ({{ getPercentageByColor('#F5222D') }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>正在加载数据...</span>
    </div>
    
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ISSDistributionChart',
  props: {
    // 筛选参数
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    timePeriod: {
      type: String,
      default: 'all'
    },
    year: {
      type: String,
      default: null
    },
    customStartTime: {
      type: String,
      default: null
    },
    customEndTime: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      chartData: [],
      chartInstance: null,
      showDebug: false, // 关闭调试模式
      totalPatients: 0
    }
  },
  mounted() {
    console.log('ISS分布图组件已挂载')
    this.initChart()
    this.fetchData()
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize)
  },
  watch: {
    // 监听筛选参数变化，重新获取数据
    startDate() {
      console.log('startDate变化，重新获取数据')
      this.refreshChart()
    },
    endDate() {
      console.log('endDate变化，重新获取数据')
      this.refreshChart()
    },
    timePeriod() {
      console.log('timePeriod变化，重新获取数据')
      this.refreshChart()
    },
    year() {
      console.log('year变化，重新获取数据')
      this.refreshChart()
    },
    customStartTime() {
      console.log('customStartTime变化，重新获取数据')
      this.refreshChart()
    },
    customEndTime() {
      console.log('customEndTime变化，重新获取数据')
      this.refreshChart()
    }
  },
  beforeDestroy() {
    if (this.chartInstance) {
      this.chartInstance.dispose()
    }
    // 移除事件监听
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initChart() {
      console.log('开始初始化图表')
      this.$nextTick(() => {
        if (this.$refs.chartContainer) {
          console.log('图表容器存在，开始初始化ECharts')
          
          // 如果已存在实例，先销毁
          if (this.chartInstance) {
            this.chartInstance.dispose()
            this.chartInstance = null
          }
          
          this.chartInstance = echarts.init(this.$refs.chartContainer)
          console.log('ECharts实例创建成功:', this.chartInstance)
          
          // 如果有数据，立即更新图表
          if (this.chartData && this.chartData.length > 0) {
            this.updateChart()
          }
        } else {
          console.log('图表容器不存在，延迟初始化')
          setTimeout(() => {
            this.initChart()
          }, 100)
        }
      })
    },
    
    async fetchData() {
      console.log('开始获取ISS分布数据')
      this.loading = true
      this.error = null
      
      try {
        // 构建查询参数
        const params = {}
        
        // 添加日期范围参数（转换为字符串格式 YYYY-MM-DD）
        if (this.startDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.startDate instanceof Date) {
            const year = this.startDate.getFullYear()
            const month = String(this.startDate.getMonth() + 1).padStart(2, '0')
            const day = String(this.startDate.getDate()).padStart(2, '0')
            params.startDate = `${year}-${month}-${day}`
          } else {
            params.startDate = this.startDate
          }
        }
        
        if (this.endDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.endDate instanceof Date) {
            const year = this.endDate.getFullYear()
            const month = String(this.endDate.getMonth() + 1).padStart(2, '0')
            const day = String(this.endDate.getDate()).padStart(2, '0')
            params.endDate = `${year}-${month}-${day}`
          } else {
            params.endDate = this.endDate
          }
        }
        
        // 添加年份参数（只在有有效值时才添加）
        if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
          const yearInt = parseInt(this.year)
          if (!isNaN(yearInt)) {
            params.year = yearInt
          }
        }
        
        // 添加时间段参数（转换为数字）
        if (this.timePeriod && this.timePeriod !== 'all') {
          const timePeriodMapping = {
            'night': 0,           // 夜间
            'morning_peak': 1,    // 早高峰
            'noon_peak': 2,       // 午高峰
            'afternoon': 3,       // 下午
            'evening_peak': 4,    // 晚高峰
            'evening': 5          // 晚上
          }
          params.timePeriod = timePeriodMapping[this.timePeriod]
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime
          params.customEndTime = this.customEndTime
        }
        
        console.log('ISS分布查询参数:', params)
        
        const response = await this.$axios.get('/api/patient-statistics/iss-distribution', { params })
        console.log('ISS分布数据请求成功:', response.data)
        
        if (response.data.success) {
          const rawData = response.data.data || []
          console.log('原始数据:', rawData)
          
           // 处理中文乱码问题，使用中文标签
           this.chartData = rawData.map(item => {
             let name = item.name
             // 检测乱码或根据颜色判断类型
             if (name.includes('') || name.includes('ISS') || name.includes('')) {
               // 根据颜色判断类型
               if (item.color === '#52C41A') {
                 name = '轻度损伤 (ISS≤16)'
               } else if (item.color === '#FA8C16') {
                 name = '重度损伤 (16<ISS≤25)'
               } else if (item.color === '#F5222D') {
                 name = '危重损伤 (ISS>25)'
               }
             }
             return {
               ...item,
               name: name
             }
           })
           
           // 计算总计
           this.calculateStats()
          
           console.log('处理乱码后的图表数据:', this.chartData)
          
          // 强制重新初始化图表以确保正确显示
          this.$nextTick(() => {
            if (this.chartInstance) {
              this.chartInstance.dispose()
              this.chartInstance = null
            }
            this.initChart()
          })
        } else {
          this.error = response.data.errorMsg || '获取ISS分布数据失败'
          console.error('API返回错误:', response.data)
        }
      } catch (error) {
        console.error('ISS分布数据请求失败:', error)
        this.error = '获取ISS分布数据失败: ' + error.message
      } finally {
        this.loading = false
      }
    },
    
    calculateStats() {
      this.totalPatients = this.chartData.reduce((sum, item) => sum + (item.value || 0), 0)
      console.log('总患者数:', this.totalPatients)
    },
    
    updateChart() {
      console.log('开始更新图表')
      
      if (!this.chartInstance) {
        console.log('图表实例不存在，重新初始化')
        this.initChart()
        return
      }
      
      if (!this.chartData || this.chartData.length === 0) {
        console.log('图表数据为空，显示空状态')
        this.showEmptyChart()
        return
      }
      
      console.log('开始渲染图表，数据:', this.chartData)
      
      // 过滤掉值为0的数据项
      const validData = this.chartData.filter(item => item.value > 0)
      
      if (validData.length === 0) {
        console.log('没有有效数据，显示空状态')
        this.showEmptyChart()
        return
      }
      
       // 不再需要清除中心信息
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            return `${params.name}<br/>患者数量: ${params.value}人<br/>占比: ${params.percent}%`
          }
        },
        legend: {
          show: false // 使用自定义图例
        },
        series: [
          {
            name: 'ISS分布',
            type: 'pie',
            radius: ['35%', '65%'], // 甜甜圈图
            center: ['50%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: function(params) {
                return `${params.name}\n${params.value}人\n${params.percent}%`
              },
              fontSize: 10,
              fontWeight: 'bold'
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 10
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            data: validData.map(item => ({
              value: item.value,
              name: item.name,
              itemStyle: {
                color: item.color
              }
            }))
          }
        ]
      }
      
      console.log('图表配置:', option)
      
      // 先清除图表，再重新设置
      this.chartInstance.clear()
      this.chartInstance.setOption(option, true) // 强制刷新
      
       // 不再需要添加中心信息
    },
    
    showEmptyChart() {
      if (!this.chartInstance) return
      
      const option = {
        series: []
      }
      
      this.chartInstance.setOption(option, true)
    },
    
    getCountByColor(color) {
      const item = this.chartData.find(item => item.color === color)
      return item ? item.value : 0
    },
    
    getPercentageByColor(color) {
      const count = this.getCountByColor(color)
      if (this.totalPatients === 0) return 0
      return ((count / this.totalPatients) * 100).toFixed(1)
    },
    
    
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize()
      }
    },
    
     // 强制刷新图表
     refreshChart() {
       console.log('强制刷新图表')
       
       // 重置数据状态
       this.chartData = []
       this.totalPatients = 0
       
       // 重新获取数据
       this.fetchData()
     },
     
     // 处理ISS分段点击事件
     async handleISSSegmentClick(segmentType) {
       console.log('点击ISS分段:', segmentType)
       
       try {
         // 构建查询参数
         const params = {
           issSegment: segmentType
         }
         
         // 添加日期范围参数（转换为字符串格式 YYYY-MM-DD）
         if (this.startDate) {
           // 如果是 Date 对象，转换为字符串
           if (this.startDate instanceof Date) {
             const year = this.startDate.getFullYear()
             const month = String(this.startDate.getMonth() + 1).padStart(2, '0')
             const day = String(this.startDate.getDate()).padStart(2, '0')
             params.startDate = `${year}-${month}-${day}`
           } else {
             params.startDate = this.startDate
           }
         }
         
         if (this.endDate) {
           // 如果是 Date 对象，转换为字符串
           if (this.endDate instanceof Date) {
             const year = this.endDate.getFullYear()
             const month = String(this.endDate.getMonth() + 1).padStart(2, '0')
             const day = String(this.endDate.getDate()).padStart(2, '0')
             params.endDate = `${year}-${month}-${day}`
           } else {
             params.endDate = this.endDate
           }
         }
         
         // 添加年份参数（只在有有效值时才添加）
         if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
           const yearInt = parseInt(this.year)
           if (!isNaN(yearInt)) {
             params.year = yearInt
           }
         }
         
         // 添加时间段参数（转换为数字）
         if (this.timePeriod && this.timePeriod !== 'all') {
           const timePeriodMapping = {
             'night': 0,           // 夜间
             'morning_peak': 1,    // 早高峰
             'noon_peak': 2,       // 午高峰
             'afternoon': 3,       // 下午
             'evening_peak': 4,    // 晚高峰
             'evening': 5          // 晚上
           }
           params.timePeriod = timePeriodMapping[this.timePeriod]
         }
         
         // 添加自定义时间段参数
         if (this.customStartTime && this.customEndTime) {
           params.customStartTime = this.customStartTime
           params.customEndTime = this.customEndTime
         }
         
         console.log('ISS分段查询参数:', params)
         
         // 调用API获取患者ID列表
         const response = await this.$axios.get('/api/patient-statistics/iss-segment-patient-ids', { params })
         console.log('ISS分段患者ID列表请求成功:', response.data)
         
         if (response.data.success) {
           const patientIds = response.data.data || []
           
           // 构建标题
           let title = ''
           if (segmentType === 'light') {
             title = '轻度损伤患者列表 (ISS≤16分)'
           } else if (segmentType === 'severe') {
             title = '重度损伤患者列表 (16<ISS≤25分)'
           } else if (segmentType === 'critical') {
             title = '危害损伤患者列表 (ISS>25分)'
           }
           
           // 发送事件给父组件
           this.$emit('show-patient-list', {
             patientIds: patientIds,
             title: title
           })
         } else {
           this.$message.error(response.data.errorMsg || '获取患者列表失败')
         }
       } catch (error) {
         console.error('获取ISS分段患者列表失败:', error)
         console.error('错误详情:', {
           message: error.message,
           response: error.response,
           status: error.response?.status,
           statusText: error.response?.statusText,
           url: error.config?.url,
           params: error.config?.params
         })
         const errorMsg = error.response?.data?.errorMsg || error.response?.statusText || error.message
         this.$message.error('获取患者列表失败: ' + errorMsg)
       }
     }
  }
}
</script>

<style scoped>
.iss-distribution-chart {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-title-overlay {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 10;
}

.chart-title {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chart-title i {
  margin-right: 4px;
  font-size: 14px;
}

/* 整体内容滚动区域 */
.content-scroll-area {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
}

.content-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.content-scroll-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.content-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(231, 76, 60, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.content-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(231, 76, 60, 0.5);
}

.chart-container {
  width: 100%;
  height: 320px;
  padding: 0;
  flex-shrink: 0;
}

.chart {
  width: 100%;
  height: 100%;
}

/* ISS评分说明区域 */
.description-area {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.description-container {
  padding: 8px 12px;
}

.description-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.description-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.description-item:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.description-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.description-label {
  color: #e74c3c;
  font-weight: 600;
  font-size: 10px;
  flex-shrink: 0;
  min-width: 60px;
}

.description-text {
  color: #2c3e50;
  font-size: 10px;
  line-height: 1.4;
  flex: 1;
}

.description-count {
  color: #e74c3c;
  font-weight: 700;
  font-size: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.empty-data i {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}
</style>