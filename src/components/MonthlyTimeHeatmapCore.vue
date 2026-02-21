<template>
  <div class="heatmap-core">
    <!-- 右上角标题 -->
    <div class="chart-title-overlay">
      <div class="chart-title">
        <i>📅</i>
        患者流量月度时间分布热点图
      </div>
    </div>
    
    <div class="chart-wrapper">
      <div ref="heatmapChart" class="chart"></div>
    </div>
    
    <div class="legend">
      <div class="legend-scale">
        <ul class="legend-labels">
          <li><span style="background-color: #f2f2f2;"></span>0</li>
          <li><span style="background-color: #7bc96f;"></span>20</li>
          <li><span style="background-color: #49af64;"></span>50</li>
          <li><span style="background-color: #239a3b;"></span>100</li>
          <li><span style="background-color: #196127;"></span>150</li>
          <li><span style="background-color: #0f4c1c;"></span>200+</li>
        </ul>
      </div>
      
      <div class="legend-info" v-if="hasData">
        <div class="info-item">
          <span class="info-label">最繁忙时段：</span>
          <span class="info-value">{{ peakTime }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">最繁忙季节：</span>
          <span class="info-value">{{ peakMonth }}</span>
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
import * as echarts from 'echarts';

export default {
  name: 'MonthlyTimeHeatmapCore',
  data() {
    return {
      chart: null,
      // 7×13矩阵数据：7个时间段（6个时间段+总和行） × 13个月（12个月+总和列）
      heatmapData: [
        // 时间段数据（7个时间段 × 13个月）
        ['早高峰(7-9)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['上午(10-12)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['午高峰(11-13)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['下午(14-17)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['晚高峰(17-19)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['夜间(20-6)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ['总和', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      peakTime: '',
      peakMonth: '',
      hasData: false,
      isLoading: true
    };
  },
  mounted() {
    this.loadData();
    window.addEventListener('resize', this.handleResize);
  },
  
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    filters: {
      type: Object,
      default: () => ({
        startDate: '',
        endDate: '',
        season: '',
        timePeriod: '',
        year: ''
      })
    },
    selectedYear: {
      type: [String, Number],
      default: () => new Date().getFullYear()
    },
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    timePeriod: {
      type: [String, Number],
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
  
  watch: {
    data: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.processHeatmapData(newData);
          this.$nextTick(() => {
            this.initChart();
            this.calculateStats();
          });
        }
      },
      immediate: true,
      deep: true
    },
    filters: {
      handler() {
        this.loadData();
      },
      immediate: false,
      deep: true
    },
    selectedYear: {
      handler() {
        this.loadData();
      },
      immediate: false
    },
    startDate: {
      handler() {
        this.loadData();
      },
      immediate: false
    },
    endDate: {
      handler() {
        this.loadData();
      },
      immediate: false
    },
    timePeriod: {
      handler() {
        this.loadData();
      },
      immediate: false
    },
    customStartTime: {
      handler() {
        this.loadData();
      },
      immediate: false
    },
    customEndTime: {
      handler() {
        this.loadData();
      },
      immediate: false
    }
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async loadData() {
      try {
        this.isLoading = true;
        
        // 构建查询参数
        const params = {};
        
        // 添加年份参数（只在有有效值时才添加）
        if (this.selectedYear && this.selectedYear !== 'all' && this.selectedYear !== '' && this.selectedYear != null) {
          const yearInt = parseInt(this.selectedYear);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 添加日期范围参数
        if (this.startDate) {
          params.startDate = this.startDate;
        }
        if (this.endDate) {
          params.endDate = this.endDate;
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
          };
          params.timePeriod = timePeriodMapping[this.timePeriod];
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        console.log('月度热力图查询参数:', params);
        
        // 加载热力图数据
        const heatmapResponse = await this.$axios.get('/api/patient-statistics/monthly-heatmap', {
          params: params
        });
        
        // 更新热力图数据
        if (heatmapResponse.data.success) {
          this.processHeatmapData(heatmapResponse.data.data);
        }
        
        this.isLoading = false;
        
        // 初始化图表
        this.$nextTick(() => {
          this.initChart();
          this.calculateStats();
        });
        
      } catch (error) {
        console.error('加载热力图数据失败:', error);
        this.isLoading = false;
        this.hasData = false;
        this.$message.error('加载热力图数据失败: ' + error.message);
      }
    },
    
    processHeatmapData(apiData) {
      console.log('处理热力图数据:', apiData);
      
      // 时间段映射（后端返回英文，前端显示中文）
      const timePeriodMapping = {
        'night_0_7': '夜间(0-7时)',
        'morning_rush_8_9': '早高峰(8-9时)',
        'lunch_rush_10_11': '午高峰(10-11时)',
        'afternoon_12_16': '下午(12-16时)',
        'evening_rush_17_19': '晚高峰(17-19时)',
        'night_20_23': '晚上(20-23时)',
        'total': '总计'
      };
      
      // 初始化7x13数据矩阵（7个时间段 × 13个月）
      const timePeriods = ['夜间(0-7时)', '早高峰(8-9时)', '午高峰(10-11时)', '下午(12-16时)', '晚高峰(17-19时)', '晚上(20-23时)', '总计'];
      const heatmapData = timePeriods.map(period => [period, ...new Array(13).fill(0)]);
      
      // 处理API返回的数据
      if (apiData && Array.isArray(apiData)) {
        console.log('API数据是数组，长度:', apiData.length);
        
        // 处理新的数据格式（每个时间段包含data数组）
        apiData.forEach(item => {
          console.log('处理数据项:', item);
          const timePeriod = item.time_period;
          const data = item.data;
          
          // 使用映射找到对应的中文时间段名称
          const chineseTimePeriod = timePeriodMapping[timePeriod] || timePeriod;
          const periodIndex = timePeriods.indexOf(chineseTimePeriod);
          
          if (periodIndex !== -1 && Array.isArray(data)) {
            // 复制数据到对应行
            for (let i = 0; i < Math.min(data.length, 13); i++) {
              heatmapData[periodIndex][i + 1] = data[i];
            }
            console.log(`设置数据: ${chineseTimePeriod} = [${data.join(', ')}]`);
          } else {
            console.log(`跳过数据: ${timePeriod} -> ${chineseTimePeriod} (索引: ${periodIndex})`);
          }
        });
      } else {
        console.log('API数据不是数组或为空:', apiData);
      }
      
      console.log('最终热力图数据:', heatmapData);
      this.heatmapData = heatmapData;
    },
    
    initChart() {
      this.chart = echarts.init(this.$refs.heatmapChart);
      
      // 处理热力图数据格式
      const data = [];
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '总计'];
      const timePeriods = ['夜间(0-7时)', '早高峰(8-9时)', '午高峰(10-11时)', '下午(12-16时)', '晚高峰(17-19时)', '晚上(20-23时)', '总计'];
      
      for (let i = 0; i < this.heatmapData.length; i++) {
        for (let j = 1; j < this.heatmapData[i].length; j++) {
          data.push([j - 1, i, this.heatmapData[i][j]]);
        }
      }
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          formatter: function (params) {
            const month = months[params.value[0]] || '未知月份';
            const timePeriod = timePeriods[params.value[1]] || '未知时间段';
            const count = params.value[2];
            return `${month} ${timePeriod}<br>患者数: ${count}`;
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月', '总计'],
          splitArea: {
            show: true
          },
          axisLabel: {
            fontWeight: 'bold',
            fontSize: 11,
            rotate: 0
          }
        },
        yAxis: {
          type: 'category',
          data: ['夜间(0-7时)', '早高峰(8-9时)', '午高峰(10-11时)', '下午(12-16时)', '晚高峰(17-19时)', '晚上(20-23时)', '总计'],
          splitArea: {
            show: true
          },
          axisLabel: {
            fontWeight: 'bold',
            fontSize: 11,
            rotate: 0
          }
        },
        visualMap: {
          min: 0,
          max: 250,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '0%',
          inRange: {
            color: ['#f2f2f2', '#7bc96f', '#49af64', '#239a3b', '#196127', '#0f4c1c']
          },
          textStyle: {
            color: '#333'
          }
        },
        series: [{
          name: '患者数量',
          type: 'heatmap',
          data: data,
          label: {
            show: true,
            formatter: function (params) {
              return params.value[2];
            },
            color: '#000',
            fontWeight: 'bold',
            fontSize: 11
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      
      this.chart.setOption(option);
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    calculateStats() {
      // 检查是否有数据
      let hasAnyData = false;
      let maxValue = 0;
      let maxTimeIndex = 0;
      let maxMonthIndex = 0;
      
      // 计算最繁忙时段（排除总和行）
      const timePeriods = ['夜间(0-7时)', '早高峰(8-9时)', '午高峰(10-11时)', '下午(12-16时)', '晚高峰(17-19时)', '晚上(20-23时)'];
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      
      // 只分析前6个时间段（排除总和行）
      for (let i = 0; i < 6; i++) {
        for (let j = 1; j < 13; j++) { // 只分析前12个月（排除总和列）
          const value = this.heatmapData[i][j];
          if (value > 0) {
            hasAnyData = true;
          }
          
          if (value > maxValue) {
            maxValue = value;
            maxTimeIndex = i;
            maxMonthIndex = j - 1;
          }
        }
      }
      
      this.hasData = hasAnyData;
      
      if (hasAnyData) {
        this.peakTime = timePeriods[maxTimeIndex];
        this.peakMonth = months[maxMonthIndex];
      }
    }
  }
};
</script>

<style scoped>
/* 标题样式 */
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
  font-weight: 500;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chart-title i {
  margin-right: 4px;
  font-size: 14px;
}

.heatmap-core {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.chart-wrapper {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.legend {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  flex-shrink: 0;
}

.legend-scale ul {
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  gap: 15px;
}

.legend-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  justify-content: space-between;
}

.info-label {
  color: #666;
  margin-right: 6px;
  font-weight: 500;
}

.info-value {
  color: #409EFF;
  font-weight: bold;
  background-color: #ecf5ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.legend-labels li {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 10px;
  color: #666;
}

.legend-labels li span {
  display: block;
  height: 12px;
  width: 25px;
  margin-bottom: 3px;
  border-radius: 2px;
}

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
