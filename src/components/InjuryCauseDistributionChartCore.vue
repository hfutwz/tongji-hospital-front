<template>
  <div class="injury-cause-distribution-core">
    <!-- 右上角标题 -->
    <div class="chart-title-overlay">
      <div class="chart-title">
        <i>📊</i>
        月度伤因分布统计图
      </div>
    </div>
    
    <!-- 整体内容区域 - 可滚动 -->
    <div class="content-scroll-area">
      <!-- 核心柱状图区域 -->
      <div class="chart-container">
        <div ref="chart" class="chart"></div>
      </div>
      
      <!-- 伤因类型统计区域（位于柱状图下方） -->
      <div class="stats-area" v-if="hasData">
        <div class="stats-header">
          <div class="stats-title">
            <i>📋</i>
            伤因类型统计
          </div>
        </div>
        
        <div class="stats-container">
          <div class="stats-content">
            <div 
              v-for="(item, index) in legendData" 
              :key="index" 
              class="stat-item clickable"
              @click="handleInjuryCauseClick(item)">
              <span class="stat-color" :style="{ backgroundColor: item.color }"></span>
              <span class="stat-label">{{ item.name }}</span>
              <span class="stat-value">{{ item.total }}例</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>正在加载数据...</span>
    </div>
    
    <!-- 无数据状态 -->
    <div v-if="!hasData && !isLoading" class="no-data">
      <i class="el-icon-warning"></i>
      <span>暂无数据</span>
    </div>
    
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'InjuryCauseDistributionChartCore',
  components: {
  },
  props: {
    selectedYear: {
      type: String,
      default: 'all'
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    timePeriod: {
      type: String,
      default: 'all'
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
      chart: null,
      chartData: [],
      legendData: [],
      hasData: false,
      isLoading: true,
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      // 伤因名称到数字的映射
      injuryCauseMapping: {
        '交通伤': 0,
        '高坠伤': 1,
        '机械伤': 2,
        '跌倒': 3,
        '其他': 4
      }
    }
  },
  watch: {
    selectedYear: {
      handler() {
        this.fetchData()
      },
      immediate: true
    },
    startDate: {
      handler() {
        this.fetchData()
      }
    },
    endDate: {
      handler() {
        this.fetchData()
      }
    },
    timePeriod: {
      handler() {
        this.fetchData()
      }
    },
    customStartTime: {
      handler() {
        this.fetchData()
      }
    },
    customEndTime: {
      handler() {
        this.fetchData()
      }
    }
  },
  mounted() {
    this.initChart()
    // fetchData() 已经在 selectedYear 的 watch 中通过 immediate: true 调用了，这里不需要重复调用
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chart)
    },
    
    async fetchData() {
      try {
        this.isLoading = true
        console.log('InjuryCauseDistributionChartCore: 开始获取数据')
        
        // 构建查询参数
        const params = {}
        
        // 添加年份参数（只在有有效值时才添加）
        if (this.selectedYear && this.selectedYear !== 'all' && this.selectedYear !== '' && this.selectedYear != null) {
          const yearInt = parseInt(this.selectedYear);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        if (this.startDate) {
          params.startDate = this.startDate
        }
        
        if (this.endDate) {
          params.endDate = this.endDate
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
        
        console.log('InjuryCauseDistributionChartCore: 查询参数:', params)
        
        const response = await this.$axios.get('/api/patient-statistics/injury-cause-distribution', { params })
        
        if (response.data.success && response.data.data) {
          this.processData(response.data.data)
          console.log('InjuryCauseDistributionChartCore: 数据获取成功')
        } else {
          console.warn('InjuryCauseDistributionChartCore: 未获取到有效数据')
          this.chartData = []
          this.legendData = []
          this.hasData = false
          this.updateChart()
        }
      } catch (error) {
        console.error('InjuryCauseDistributionChartCore: 获取数据失败:', error)
        // 使用模拟数据
        this.loadMockData()
      } finally {
        this.isLoading = false
      }
    },
    
    processData(data) {
      console.log('InjuryCauseDistributionChartCore: 处理原始数据:', data)
      
      // 处理伤因数据
      const causeColors = {
        '交通伤': '#e74c3c',
        '高坠伤': '#f39c12', 
        '机械伤': '#9b59b6',
        '跌倒': '#3498db',
        '其他': '#95a5a6'
      }
      
      // 构建图表数据
      this.chartData = []
      this.legendData = []
      
      if (data && Array.isArray(data)) {
        data.forEach(causeData => {
          const seriesData = {
            name: causeData.cause_name,
            type: 'bar',
            stack: 'total',
            data: causeData.monthly_data || [],
            itemStyle: {
              color: causeData.color || causeColors[causeData.cause_name] || '#95a5a6'
            }
          }
          
          this.chartData.push(seriesData)
          
          this.legendData.push({
            name: causeData.cause_name,
            color: causeData.color || causeColors[causeData.cause_name] || '#95a5a6',
            total: causeData.total_count || 0
          })
        })
      }
      
      this.hasData = this.chartData.some(series => series.data.some(val => val > 0))
      
      console.log('InjuryCauseDistributionChartCore: 处理后的图表数据:', this.chartData)
      console.log('InjuryCauseDistributionChartCore: 处理后的图例数据:', this.legendData)
      
      this.updateChart()
    },
    
    loadMockData() {
      console.log('InjuryCauseDistributionChartCore: 使用模拟数据')
      
      const mockData = [
        {
          cause_name: '交通伤',
          color: '#e74c3c',
          total_count: 619,
          monthly_data: [109, 87, 109, 134, 79, 59, 42, 38, 45, 52, 48, 35]
        },
        {
          cause_name: '高坠伤',
          color: '#f39c12',
          total_count: 43,
          monthly_data: [11, 5, 7, 7, 8, 3, 2, 1, 2, 3, 2, 1]
        },
        {
          cause_name: '机械伤',
          color: '#9b59b6',
          total_count: 74,
          monthly_data: [12, 13, 11, 12, 10, 9, 7, 6, 8, 9, 7, 6]
        },
        {
          cause_name: '跌倒',
          color: '#3498db',
          total_count: 539,
          monthly_data: [127, 107, 74, 79, 82, 46, 24, 18, 22, 28, 25, 20]
        },
        {
          cause_name: '其他',
          color: '#95a5a6',
          total_count: 134,
          monthly_data: [29, 12, 14, 28, 14, 19, 18, 15, 12, 8, 6, 5]
        }
      ]
      
      this.processData(mockData)
    },
    
    updateChart() {
      if (!this.chart) return
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#3498db',
          borderWidth: 1,
          textStyle: {
            color: '#fff',
            fontSize: 12
          },
          formatter: function(params) {
            let result = `<div style="margin-bottom: 5px; font-weight: bold;">${params[0].name}</div>`
            let total = 0
            
            params.forEach(param => {
              if (param.value > 0) {
                result += `<div style="margin: 2px 0;">
                  <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; margin-right: 5px; border-radius: 2px;"></span>
                  ${param.seriesName}: <span style="font-weight: bold; color: #3498db;">${param.value}例</span>
                </div>`
                total += param.value
              }
            })
            
            if (total > 0) {
              result += `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #3498db; font-weight: bold;">
                总计: <span style="color: #e74c3c;">${total}例</span>
              </div>`
            }
            
            return result
          }
        },
        legend: {
          show: false
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '8%',
          top: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.months,
          axisLine: {
            lineStyle: {
              color: '#ddd'
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#666',
            fontSize: 10
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: '#666',
            fontSize: 10
          },
          splitLine: {
            lineStyle: {
              color: '#f0f0f0',
              type: 'dashed'
            }
          }
        },
        series: this.chartData
      }
      
      console.log('InjuryCauseDistributionChartCore: 图表配置:', option)
      this.chart.setOption(option, true)
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    // 处理伤因类型点击事件
    async handleInjuryCauseClick(item) {
      if (item.total === 0) {
        this.$message.info(`当前筛选条件下没有${item.name}患者`);
        return;
      }
      
      // 显示加载提示
      const loading = this.$loading({
        lock: true,
        text: `正在加载${item.name}患者列表...`,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 获取伤因类型对应的数字
        const injuryCauseCategory = this.injuryCauseMapping[item.name];
        if (injuryCauseCategory === undefined) {
          this.$message.error('未知的伤因类型');
          return;
        }
        
        // 构建查询参数
        const params = {
          injuryCauseCategory: injuryCauseCategory
        };
        
        // 添加日期范围参数（转换为字符串格式 YYYY-MM-DD）
        if (this.startDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.startDate instanceof Date) {
            const year = this.startDate.getFullYear();
            const month = String(this.startDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.startDate.getDate()).padStart(2, '0');
            params.startDate = `${year}-${month}-${day}`;
          } else {
            params.startDate = this.startDate;
          }
        }
        
        if (this.endDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.endDate instanceof Date) {
            const year = this.endDate.getFullYear();
            const month = String(this.endDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.endDate.getDate()).padStart(2, '0');
            params.endDate = `${year}-${month}-${day}`;
          } else {
            params.endDate = this.endDate;
          }
        }
        
        // 添加年份参数
        if (this.selectedYear && this.selectedYear !== 'all' && this.selectedYear !== '' && this.selectedYear != null) {
          const yearInt = parseInt(this.selectedYear);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 添加时间段参数
        if (this.timePeriod && this.timePeriod !== 'all') {
          params.timePeriod = this.timePeriod;
        }
        
        // 添加自定义时间范围参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        // 调用后端接口获取患者ID列表
        const res = await this.$axios.get('/api/patient-statistics/injury-cause-patient-ids', { params });
        
        if (res.data.success && res.data.data) {
          // 通过事件通知父组件显示患者列表
          this.$emit('show-patient-list', {
            patientIds: res.data.data,
            title: `${item.name}患者列表`
          });
        } else {
          this.$message.error(`获取${item.name}患者列表失败`);
        }
      } catch (err) {
        console.error('获取患者列表失败:', err);
        this.$message.error(`获取${item.name}患者列表失败: ` + (err.response?.data?.errorMsg || err.message));
      } finally {
        loading.close();
      }
    },
    
    
  }
}
</script>

<style scoped>
.injury-cause-distribution-core {
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
  background: rgba(52, 152, 219, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.content-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(52, 152, 219, 0.5);
}

.chart-container {
  width: 100%;
  height: 280px;
  padding: 0;
  flex-shrink: 0;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 伤因类型统计区域 */
.stats-area {
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

.stats-header {
  padding: 8px 12px;
  background: rgba(52, 152, 219, 0.1);
  border-bottom: 1px solid rgba(52, 152, 219, 0.2);
}

.stats-title {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
}

.stats-title i {
  margin-right: 6px;
  font-size: 14px;
  color: #3498db;
}

.stats-container {
  padding: 8px 12px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  background: rgba(52, 152, 219, 0.1);
  border-color: rgba(52, 152, 219, 0.3);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.stat-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.stat-label {
  flex: 1;
  color: #2c3e50;
  font-size: 10px;
  font-weight: 600;
}

.stat-value {
  color: #e74c3c;
  font-weight: 700;
  font-size: 10px;
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

.no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.no-data i {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}
</style>
