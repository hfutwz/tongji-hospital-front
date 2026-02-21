<template>
  <div class="body-region-sunburst-widget">
    <!-- 右上角标题 -->
    <div class="chart-title-overlay">
      <div class="chart-title">
        <i>🫀</i>
        身体区域损伤图
      </div>
    </div>
    
    <!-- 整体内容区域 - 可滚动 -->
    <div class="content-scroll-area">
      <!-- 核心旭日图区域 -->
      <div class="chart-container">
        <div v-if="loading" class="loading-container">
          <el-loading :loading="loading" text="加载中..."></el-loading>
        </div>
        <div ref="sunburstChart" class="chart" v-show="!loading"></div>
      </div>
      
      <!-- 身体区域损伤统计说明区域（位于旭日图下方） -->
      <div class="description-area">
        <div class="description-container">
          <div class="description-content">
            <div v-for="region in regionStats" :key="region.name" class="description-item">
              <div class="region-header">
                <div class="region-name">{{ region.name }}</div>
                <div class="region-total">{{ region.total }}例</div>
              </div>
              <div class="severity-breakdown">
                <div 
                  v-for="severity in region.severities" 
                  :key="severity.type" 
                  class="severity-item"
                  :class="{ 'clickable': severity.count > 0 }"
                  @click="severity.count > 0 && handleSeverityClick(getBodyRegionKey(region.name), severity.type)"
                >
                  <span class="severity-color" :style="{ backgroundColor: severity.color }"></span>
                  <span class="severity-label">{{ severity.name }}:</span>
                  <span class="severity-value">{{ severity.count }}例 ({{ severity.percentage }}%)</span>
                </div>
              </div>
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
import * as echarts from 'echarts';
import axios from 'axios';

export default {
  name: 'BodyRegionSunburstWidget',
  props: {
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
      chart: null,
      injuryData: [],
      totalInjuries: 0,
      mostAffectedRegion: '',
      mostCommonSeverity: '',
      regionStats: [],
      loading: false
    };
  },
  mounted() {
    this.loadData();
    window.addEventListener('resize', this.handleResize);
  },
  watch: {
    timePeriod: {
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
    year: {
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
      this.loading = true;
      console.log('开始加载身体区域损伤数据...');
      try {
        // 构建查询参数，只在有有效值时才添加
        const params = {};
        
        // 添加年份参数（只在有有效值时才添加）
        if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
          const yearInt = parseInt(this.year);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 添加时间段参数（只在有有效值时才添加）
        if (this.timePeriod && this.timePeriod !== 'all' && this.timePeriod !== '' && this.timePeriod != null) {
          const timePeriodValue = this.getTimePeriodValue(this.timePeriod);
          if (timePeriodValue != null) {
            params.timePeriod = timePeriodValue;
          }
        }
        
        // 添加日期范围参数（只在有有效值时才添加）
        if (this.startDate) {
          params.startDate = this.startDate;
        }
        if (this.endDate) {
          params.endDate = this.endDate;
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        console.log('请求参数:', params);
        console.log('请求URL: /api/patient-statistics/body-region-sunburst');
        
        const response = await axios.get('/api/patient-statistics/body-region-sunburst', { params });
        
        console.log('API响应状态:', response.status);
        console.log('API响应数据:', response.data);
        
        // 处理不同的响应格式
        if (response.data.success === true || response.data.code === 200) {
          this.injuryData = response.data.data || [];
          console.log('获取到的身体区域损伤数据:', this.injuryData);
          console.log('数据长度:', this.injuryData.length);
          this.initChart();
          this.calculateStats();
        } else {
          console.error('获取身体区域损伤数据失败：', response.data.message || response.data.errorMsg);
        }
      } catch (error) {
        console.error('获取身体区域损伤数据失败:', error);
        console.error('错误详情:', error.response ? error.response.data : error.message);
      } finally {
        this.loading = false;
      }
    },
    
    initChart() {
      console.log('开始初始化旭日图...');
      
      // 确保容器有正确的尺寸
      const chartContainer = this.$refs.sunburstChart;
      if (chartContainer) {
        chartContainer.style.width = '100%';
        chartContainer.style.height = '280px';
        chartContainer.style.minHeight = '280px';
      }
      
      this.chart = echarts.init(chartContainer);
      
      const sunburstData = this.getSunburstData();
      console.log('旭日图数据:', sunburstData);
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            return `${params.name}<br/>数量: ${params.value}`;
          }
        },
        series: {
          type: 'sunburst',
          data: sunburstData,
          radius: ['8%', '85%'],
          center: ['50%', '50%'],
          label: {
            rotate: 'radial',
            show: true,
            fontSize: 12,
            formatter: function(params) {
              if (params.depth === 1) {
                // 第二层显示部位名称和数量
                return `${params.name}\n${params.value}例`;
              } else if (params.depth === 2) {
                // 第三层显示严重度
                return params.name;
              }
              return params.name;
            }
          },
          levels: [
            {},
            {
              r0: '12%',
              r: '32%',
              itemStyle: {
                borderWidth: 2
              },
              label: {
                rotate: 'tangential',
                fontSize: 12,
                show: true
              }
            },
            {
              r0: '32%',
              r: '65%',
              label: {
                align: 'right',
                show: true,
                fontSize: 11
              }
            },
            {
              r0: '65%',
              r: '80%',
              label: {
                position: 'outside',
                padding: 3,
                silent: false,
                show: true,
                fontSize: 10
              },
              itemStyle: {
                borderWidth: 1
              }
            }
          ]
        }
      };
      
      this.chart.setOption(option);
      
      // 添加点击事件处理
      this.chart.on('click', (params) => {
        // 只处理第三层（严重程度）的点击
        if (params.depth === 2 && params.data && params.data.bodyRegion && params.data.severityLevel) {
          this.handleSeverityClick(params.data.bodyRegion, params.data.severityLevel);
        }
      });
      
      // 强制重新渲染以确保正确显示
      this.$nextTick(() => {
        if (this.chart) {
          this.chart.resize();
          // 延迟再次调整尺寸，确保图表完全渲染
          setTimeout(() => {
            if (this.chart) {
              this.chart.resize();
            }
          }, 100);
        }
      });
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize();
      }
    },
    
    getSunburstData() {
      const regionData = {
        head_neck: { mild: 0, moderate: 0, severe: 0, critical: 0 },
        face: { mild: 0, moderate: 0, severe: 0, critical: 0 },
        chest: { mild: 0, moderate: 0, severe: 0, critical: 0 },
        abdomen: { mild: 0, moderate: 0, severe: 0, critical: 0 },
        limbs: { mild: 0, moderate: 0, severe: 0, critical: 0 },
        body: { mild: 0, moderate: 0, severe: 0, critical: 0 }
      };
      
      this.injuryData.forEach(item => {
        const region = item.body_region;
        const severity = item.severity_level; // 后端已返回 'mild', 'moderate', 'severe', 'critical'
        const count = item.injury_count;
        
        if (regionData[region] && severity && regionData[region][severity] !== undefined) {
          // 后端已经按受伤程度分组并去重，直接累加即可
          regionData[region][severity] += count;
        }
      });
      
      return [
        {
          name: '全部损伤',
          children: [
            {
              name: '头颈部',
              value: this.sumSeverities(regionData.head_neck),
              children: [
                { name: '轻度', value: regionData.head_neck.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'head_neck', severityLevel: 'mild' },
                { name: '中度', value: regionData.head_neck.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'head_neck', severityLevel: 'moderate' },
                { name: '重度', value: regionData.head_neck.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'head_neck', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.head_neck.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'head_neck', severityLevel: 'critical' }
              ]
            },
            {
              name: '面部',
              value: this.sumSeverities(regionData.face),
              children: [
                { name: '轻度', value: regionData.face.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'face', severityLevel: 'mild' },
                { name: '中度', value: regionData.face.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'face', severityLevel: 'moderate' },
                { name: '重度', value: regionData.face.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'face', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.face.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'face', severityLevel: 'critical' }
              ]
            },
            {
              name: '胸部',
              value: this.sumSeverities(regionData.chest),
              children: [
                { name: '轻度', value: regionData.chest.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'chest', severityLevel: 'mild' },
                { name: '中度', value: regionData.chest.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'chest', severityLevel: 'moderate' },
                { name: '重度', value: regionData.chest.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'chest', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.chest.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'chest', severityLevel: 'critical' }
              ]
            },
            {
              name: '腹部',
              value: this.sumSeverities(regionData.abdomen),
              children: [
                { name: '轻度', value: regionData.abdomen.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'abdomen', severityLevel: 'mild' },
                { name: '中度', value: regionData.abdomen.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'abdomen', severityLevel: 'moderate' },
                { name: '重度', value: regionData.abdomen.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'abdomen', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.abdomen.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'abdomen', severityLevel: 'critical' }
              ]
            },
            {
              name: '四肢',
              value: this.sumSeverities(regionData.limbs),
              children: [
                { name: '轻度', value: regionData.limbs.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'limbs', severityLevel: 'mild' },
                { name: '中度', value: regionData.limbs.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'limbs', severityLevel: 'moderate' },
                { name: '重度', value: regionData.limbs.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'limbs', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.limbs.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'limbs', severityLevel: 'critical' }
              ]
            },
            {
              name: '体表',
              value: this.sumSeverities(regionData.body),
              children: [
                { name: '轻度', value: regionData.body.mild, itemStyle: { color: '#c6e48b' }, bodyRegion: 'body', severityLevel: 'mild' },
                { name: '中度', value: regionData.body.moderate, itemStyle: { color: '#7bc96f' }, bodyRegion: 'body', severityLevel: 'moderate' },
                { name: '重度', value: regionData.body.severe, itemStyle: { color: '#49af64' }, bodyRegion: 'body', severityLevel: 'severe' },
                { name: '无法医治', value: regionData.body.critical, itemStyle: { color: '#239a3b' }, bodyRegion: 'body', severityLevel: 'critical' }
              ]
            }
          ]
        }
      ];
    },
    
    sumSeverities(severityData) {
      return severityData.mild + severityData.moderate + severityData.severe + severityData.critical;
    },
    
    calculateStats() {
      const sunburstData = this.getSunburstData();
      const allData = sunburstData[0];
      
      this.totalInjuries = allData.value;
      
      // 计算每个部位的详细统计
      this.regionStats = allData.children.map(region => {
        const total = region.value;
        const severities = region.children.map(severity => {
          const count = severity.value;
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          return {
            type: this.getSeverityType(severity.name),
            name: severity.name,
            count: count,
            percentage: percentage,
            color: severity.itemStyle ? severity.itemStyle.color : '#c6e48b'
          };
        });
        
        return {
          name: region.name,
          total: total,
          severities: severities
        };
      });
      
      // 计算最常受损区域
      let maxRegionValue = 0;
      let maxRegionName = '';
      
      for (const region of allData.children) {
        if (region.value > maxRegionValue) {
          maxRegionValue = region.value;
          maxRegionName = region.name;
        }
      }
      
      this.mostAffectedRegion = maxRegionName;
      
      // 计算最常见严重度
      let severityCounts = { mild: 0, moderate: 0, severe: 0, critical: 0 };
      
      for (const region of allData.children) {
        for (const severity of region.children) {
          const severityType = this.getSeverityType(severity.name);
          severityCounts[severityType] += severity.value;
        }
      }
      
      let maxSeverityCount = 0;
      let maxSeverity = '';
      
      for (const severity in severityCounts) {
        if (severityCounts[severity] > maxSeverityCount) {
          maxSeverityCount = severityCounts[severity];
          maxSeverity = severity;
        }
      }
      
      this.mostCommonSeverity = this.getSeverityName(maxSeverity);
    },
    
    getSeverityType(severityName) {
      const mapping = {
        '轻度': 'mild',
        '中度': 'moderate',
        '重度': 'severe',
        '无法医治': 'critical'
      };
      return mapping[severityName] || '';
    },
    
    getSeverityName(severityType) {
      const mapping = {
        'mild': '轻度',
        'moderate': '中度',
        'severe': '重度',
        'critical': '无法医治'
      };
      return mapping[severityType] || '';
    },
    
    getTimePeriodValue(timePeriodKey) {
      const mapping = {
        'night': 0,
        'morning_peak': 1,
        'noon_peak': 2,
        'afternoon': 3,
        'evening_peak': 4,
        'evening': 5
      };
      return mapping[timePeriodKey];
    },
    
    getSeverityKeys(severityLevel) {
      // 过滤掉0分数据
      if (severityLevel === '0' || severityLevel === 0) {
        return [];
      }
      
      // 处理包含多个严重度的情况（如 "1|2", "3|4" 等）
      if (severityLevel.includes('|')) {
        // 如果有多个严重度，返回所有严重度等级
        const severities = severityLevel.split('|').map(s => parseInt(s.trim())).filter(s => !isNaN(s) && s > 0);
        return severities.map(severity => this.getSeverityKeyByNumber(severity)).filter(key => key);
      }
      
      // 单个严重度
      const severityKey = this.getSeverityKeyByNumber(parseInt(severityLevel));
      return severityKey ? [severityKey] : [];
    },
    
    getSeverityKey(severityLevel) {
      // 保持向后兼容，返回第一个严重度等级
      const keys = this.getSeverityKeys(severityLevel);
      return keys.length > 0 ? keys[0] : 'mild';
    },
    
    getSeverityKeyByNumber(severityNumber) {
      // 根据用户需求重新映射严重度：1-2分轻度，3分中度，4-5分重度，6分无法医治
      const mapping = {
        1: 'mild',      // 轻度
        2: 'mild',      // 轻度
        3: 'moderate',  // 中度
        4: 'severe',    // 重度
        5: 'severe',    // 重度
        6: 'critical'   // 无法医治
      };
      return mapping[severityNumber] || null; // 返回null表示不显示0分数据
    },
    
    // 获取身体区域的英文键名
    getBodyRegionKey(regionName) {
      const mapping = {
        '头颈部': 'head_neck',
        '面部': 'face',
        '胸部': 'chest',
        '腹部': 'abdomen',
        '四肢': 'limbs',
        '体表': 'body'
      };
      return mapping[regionName] || '';
    },
    
    // 处理严重程度点击事件
    async handleSeverityClick(bodyRegion, severityLevel) {
      if (!bodyRegion || !severityLevel) {
        return;
      }
      
      try {
        // 构建查询参数
        const params = {};
        
        // 添加年份参数
        if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
          const yearInt = parseInt(this.year);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 添加时间段参数
        if (this.timePeriod && this.timePeriod !== 'all' && this.timePeriod !== '' && this.timePeriod != null) {
          const timePeriodValue = this.getTimePeriodValue(this.timePeriod);
          if (timePeriodValue != null) {
            params.timePeriod = timePeriodValue;
          }
        }
        
        // 添加日期范围参数
        if (this.startDate) {
          params.startDate = this.startDate;
        }
        if (this.endDate) {
          params.endDate = this.endDate;
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        // 添加身体区域和严重程度参数
        params.bodyRegion = bodyRegion;
        params.severityLevel = severityLevel;
        
        console.log('请求身体区域+严重程度患者列表，参数:', params);
        
        // 调用后端API
        const response = await axios.get('/api/patient-statistics/body-region-severity-patient-ids', { params });
        
        if (response.data.success === true || response.data.code === 200) {
          const patientIds = response.data.data || [];
          console.log('获取到的患者ID列表:', patientIds);
          
          // 获取身体区域和严重程度的中文名称
          const regionNameMap = {
            'head_neck': '头颈部',
            'face': '面部',
            'chest': '胸部',
            'abdomen': '腹部',
            'limbs': '四肢',
            'body': '体表'
          };
          
          const severityNameMap = {
            'mild': '轻度',
            'moderate': '中度',
            'severe': '重度',
            'critical': '无法医治'
          };
          
          const regionName = regionNameMap[bodyRegion] || bodyRegion;
          const severityName = severityNameMap[severityLevel] || severityLevel;
          
          // 触发事件，向父组件传递患者列表数据
          this.$emit('show-patient-list', {
            patientIds: patientIds,
            title: `${regionName} - ${severityName}损伤患者列表`
          });
        } else {
          console.error('获取患者ID列表失败：', response.data.message || response.data.errorMsg);
        }
      } catch (error) {
        console.error('获取患者ID列表失败:', error);
        console.error('错误详情:', error.response ? error.response.data : error.message);
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

.body-region-sunburst-widget {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  background: rgba(64, 158, 255, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.content-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.5);
}

.chart-container {
  width: 100%;
  height: 280px;
  padding: 0;
  flex-shrink: 0;
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
}

.chart {
  width: 100%;
  height: 100%;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

/* 身体区域损伤统计说明区域 */
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
  gap: 8px;
}

.description-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.description-item:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.region-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.region-name {
  color: #409EFF;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.region-total {
  color: #409EFF;
  font-weight: 700;
  font-size: 11px;
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.severity-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.severity-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.severity-item:hover {
  background: rgba(248, 249, 250, 1);
  transform: translateY(-1px);
}

.severity-item.clickable {
  cursor: pointer;
}

.severity-item.clickable:hover {
  background: rgba(64, 158, 255, 0.1);
  border-color: rgba(64, 158, 255, 0.3);
}

.severity-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.severity-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 10px;
  flex-shrink: 0;
}

.severity-value {
  color: #409EFF;
  font-weight: 600;
  font-size: 10px;
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

@media (max-width: 768px) {
  .chart-container {
    height: 250px;
  }
  
  .chart {
    height: 250px !important;
  }
  
  .description-container {
    padding: 6px 8px;
  }
  
  .description-content {
    gap: 6px;
  }
  
  .description-item {
    padding: 6px 8px;
  }
  
  .severity-breakdown {
    gap: 4px;
  }
  
  .severity-item {
    padding: 2px 4px;
  }
}
</style>
