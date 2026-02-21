<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <div class="dashboard-header">
      <div class="header-left">
        <div class="logo">
          <i>📊</i>
          <span>医院创伤数据可视化系统</span>
        </div>
      </div>
      <div class="header-center">
        <!-- 查询框区域 -->
      <div class="filter-container">
          <div class="filter-item filter-item-enhanced">
            <label class="filter-label">
              <i class="el-icon-date"></i>
              日期范围
            </label>
            <div class="date-range-wrapper">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
                size="small"
                class="enhanced-date-picker">
          </el-date-picker>
        </div>
          </div>
          <div class="filter-item filter-item-enhanced">
            <label class="filter-label">
              <i class="el-icon-time"></i>
              时间范围
            </label>
            <div class="time-range-wrapper">
              <el-time-picker
                v-model="timeRange"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
                size="small"
                class="enhanced-time-picker-range"
                @change="handleTimeRangeChange">
              </el-time-picker>
            </div>
        </div>
        <div class="filter-item">
            <label class="filter-label">
              <i class="el-icon-timer"></i>
              时间段
            </label>
            <el-select v-model="selectedTimePeriod" placeholder="选择时间段" size="small" class="enhanced-select">
            <el-option label="全部" value="all"></el-option>
            <el-option label="夜间(00:00-07:59)" value="night"></el-option>
            <el-option label="早高峰(08:00-09:59)" value="morning_peak"></el-option>
            <el-option label="午高峰(10:00-11:59)" value="noon_peak"></el-option>
            <el-option label="下午(12:00-16:59)" value="afternoon"></el-option>
            <el-option label="晚高峰(17:00-19:59)" value="evening_peak"></el-option>
            <el-option label="晚上(20:00-23:59)" value="evening"></el-option>
          </el-select>
        </div>
        <div class="filter-item">
            <label class="filter-label">
              <i class="el-icon-date"></i>
              年份
            </label>
            <el-select v-model="selectedYear" placeholder="选择年份" size="small" class="enhanced-select">
              <el-option label="全部" value="all"></el-option>
            <el-option 
              v-for="year in yearOptions" 
              :key="year.value" 
              :label="year.label" 
              :value="year.value">
            </el-option>
          </el-select>
        </div>
        <div class="filter-item">
            <el-button type="primary" size="small" @click="handleQuery" :loading="queryLoading" class="query-button">
            <i class="el-icon-search"></i>
            查询数据
          </el-button>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="time-display">
          <i>🕐</i>
          <span>{{ currentTime }}</span>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="dashboard-main">
      <!-- 统计卡片区域 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalPatients }}</div>
            <div class="stat-label">总患者人数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">{{ dailyAverage }}</div>
            <div class="stat-label">日均患者人数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ avgInterventionTime }}</div>
            <div class="stat-label">平均干预时间(分钟)</div>
          </div>
        </div>

        <div class="stat-card clickable" @click="handleDeathCountClick">
          <div class="stat-icon">⚠️</div>
          <div class="stat-content">
            <div class="stat-value">{{ deathCount }}</div>
            <div class="stat-label">死亡人数</div>
          </div>
        </div>
      </div>

      <!-- 7图表网格布局 -->
      <div class="charts-grid">
        <!-- 第一行：热力图 + ISS饼图 + GCS饼图 + 人体图（跨2行） -->
        <!-- 病例时间统计图（热力图） -->
        <div class="chart-item chart-heatmap">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>🔥</i>
              患者流量月度时间分布热点图
            </div>
          </div>
          <div class="chart-content">
            <MonthlyTimeHeatmapCore 
              :selectedYear="selectedYear"
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime" />
          </div>
        </div>

        <!-- ISS分布图 -->
        <div class="chart-item chart-pie-iss">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>🥧</i>
              ISS分布图
            </div>
          </div>
          <div class="chart-content">
            <ISSDistributionChart 
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :year="selectedYear"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowISSSegmentPatientList" />
          </div>
        </div>

        <!-- GCS分布图 -->
        <div class="chart-item chart-pie-gcs">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>🥧</i>
              GCS分布图
            </div>
          </div>
          <div class="chart-content">
            <GCSDistributionChart 
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :year="selectedYear"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowGCSSegmentPatientList" />
          </div>
        </div>

        <!-- 人群身体热力图（跨2行） -->
        <div class="chart-item chart-body">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>🔥</i>
              人群身体热力图
            </div>
          </div>
          <div class="chart-content">
            <PopulationBodyHeatmapWidget 
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :year="selectedYear"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowBodyPartPatientList" />
          </div>
        </div>

        <!-- 第二行：柱状图 + RTS饼图 + 旭日图 -->
        <!-- 伤因分布图 -->
        <div class="chart-item chart-bar">
          <div class="chart-content">
            <InjuryCauseDistributionChartCore 
              :selectedYear="selectedYear"
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowInjuryCausePatientList" />
          </div>
        </div>

        <!-- RTS分布图 -->
        <div class="chart-item chart-pie-rts">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>🥧</i>
              RTS分布图
            </div>
          </div>
          <div class="chart-content">
            <RTSDistributionChart 
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :year="selectedYear"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowRTSScorePatientList" />
          </div>
        </div>

        <!-- 身体区域损伤图 -->
        <div class="chart-item chart-sunburst">
          <div class="chart-title-overlay">
            <div class="chart-title">
              <i>☀️</i>
              身体区域损伤图
            </div>
          </div>
          <div class="chart-content">
            <BodyRegionSunburstWidget 
              :startDate="dateRange && dateRange.length === 2 ? dateRange[0] : null"
              :endDate="dateRange && dateRange.length === 2 ? dateRange[1] : null"
              :timePeriod="selectedTimePeriod"
              :year="selectedYear"
              :customStartTime="customStartTime"
              :customEndTime="customEndTime"
              @show-patient-list="handleShowBodyRegionSeverityPatientList" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="dashboard-footer">
      <div class="footer-left">
        <span>数据更新时间: {{ lastUpdateTime }}</span>
        <span class="separator">|</span>
        <span>系统版本: v2.0.0</span>
      </div>
      <div class="footer-right">
        <span>在线用户: 1</span>
        <span class="separator">|</span>
        <span>数据源: 原始excel数据</span>
      </div>
    </div>
    
    <!-- 死亡患者列表弹窗 -->
    <PatientListModal
      :visible="showDeathPatientModal"
      :patient-ids="deathPatientIds"
      @close="closeDeathPatientModal"
    />
    
    <!-- 伤因患者列表弹窗 -->
    <PatientListModal
      :visible="showInjuryCausePatientModal"
      :patient-ids="injuryCausePatientIds"
      @close="closeInjuryCausePatientModal"
    />
    
    <!-- ISS分段患者列表弹窗 -->
    <PatientListModal
      :visible="showISSSegmentPatientModal"
      :patient-ids="issSegmentPatientIds"
      @close="closeISSSegmentPatientModal"
    />
    
    <!-- GCS分段患者列表弹窗 -->
    <PatientListModal
      :visible="showGCSSegmentPatientModal"
      :patient-ids="gcsSegmentPatientIds"
      @close="closeGCSSegmentPatientModal"
    />
    
    <!-- RTS评分患者列表弹窗 -->
    <PatientListModal
      :visible="showRTSScorePatientModal"
      :patient-ids="rtsScorePatientIds"
      @close="closeRTSScorePatientModal"
    />
    
    <!-- 身体部位患者列表弹窗 -->
    <PatientListModal
      :visible="showBodyPartPatientModal"
      :patient-ids="bodyPartPatientIds"
      :title="bodyPartPatientModalTitle"
      @close="closeBodyPartPatientModal"
    />
    
    <!-- 身体区域+严重程度患者列表弹窗 -->
    <PatientListModal
      :visible="showBodyRegionSeverityPatientModal"
      :patient-ids="bodyRegionSeverityPatientIds"
      :title="bodyRegionSeverityPatientModalTitle"
      @close="closeBodyRegionSeverityPatientModal"
    />
  </div>
</template>

<script>
import MonthlyTimeHeatmapCore from '@/components/MonthlyTimeHeatmapCore.vue'
import ISSDistributionChart from '@/components/ISSDistributionChart.vue'
import GCSDistributionChart from '@/components/GCSDistributionChart.vue'
import PopulationBodyHeatmapWidget from '@/components/PopulationBodyHeatmapWidget.vue'
import InjuryCauseDistributionChartCore from '@/components/InjuryCauseDistributionChartCore.vue'
import RTSDistributionChart from '@/components/RTSDistributionChart.vue'
import BodyRegionSunburstWidget from '@/components/BodyRegionSunburstWidget.vue'
import PatientListModal from '@/components/PatientListModal.vue'

export default {
  name: 'DataVisualizationDashboard',
  components: {
    MonthlyTimeHeatmapCore,
    ISSDistributionChart,
    GCSDistributionChart,
    PopulationBodyHeatmapWidget,
    InjuryCauseDistributionChartCore,
    RTSDistributionChart,
    BodyRegionSunburstWidget,
    PatientListModal
  },
  data() {
    return {
      // 当前时间
      currentTime: '',
      lastUpdateTime: '',
      
      // 筛选条件 - 使用驾驶舱的数据结构
      dateRange: [],
      selectedTimePeriod: 'all',
      selectedYear: 'all',
      timeRange: null, // 时间范围数组 [startTime, endTime] (HH:mm格式)
      customStartTime: null, // 时间范围开始时间 (HH:mm格式) - 用于实际查询
      customEndTime: null, // 时间范围结束时间 (HH:mm格式) - 用于实际查询
      
      // 统计数据
      totalPatients: 0,
      dailyAverage: 0,
      avgInterventionTime: 0,
      deathCount: 0,
      onlineUsers: 12,
      
      // 查询状态
      queryLoading: false,
      
      // 死亡患者列表弹窗
      showDeathPatientModal: false,
      deathPatientIds: [],
      
      // 伤因患者列表弹窗
      showInjuryCausePatientModal: false,
      injuryCausePatientIds: [],
      injuryCausePatientModalTitle: '',
      
      // ISS分段患者列表弹窗
      showISSSegmentPatientModal: false,
      issSegmentPatientIds: [],
      issSegmentPatientModalTitle: '',
      
      // GCS分段患者列表弹窗
      showGCSSegmentPatientModal: false,
      gcsSegmentPatientIds: [],
      gcsSegmentPatientModalTitle: '',
      
      // RTS评分患者列表弹窗
      showRTSScorePatientModal: false,
      rtsScorePatientIds: [],
      rtsScorePatientModalTitle: '',
      // 身体部位患者列表弹窗
      showBodyPartPatientModal: false,
      bodyPartPatientIds: [],
      bodyPartPatientModalTitle: '',
      // 身体区域+严重程度患者列表弹窗
      showBodyRegionSeverityPatientModal: false,
      bodyRegionSeverityPatientIds: [],
      bodyRegionSeverityPatientModalTitle: ''
    }
  },
  
  computed: {
    // 获取年份选项（从2000年到当前年）
    yearOptions() {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let year = 2000; year <= currentYear; year++) {
        years.push({
          value: year.toString(),
          label: `${year}年`
        });
      }
      return years.reverse(); // 最新的年份在前
    },
  },
  
  watch: {
    // 监听查询条件变化，自动更新顶部统计数据
    dateRange: {
      handler() {
        this.fetchStatistics();
      },
      deep: true
    },
    selectedTimePeriod: {
      handler() {
        this.fetchStatistics();
      }
    },
    selectedYear: {
      handler() {
        this.fetchStatistics();
      }
    },
    customStartTime: {
      handler() {
        this.fetchStatistics();
      }
    },
    customEndTime: {
      handler() {
        this.fetchStatistics();
      }
    }
  },
  
  mounted() {
    this.updateTime();
    this.initializeAllData();
    
    // 每秒更新时间
    setInterval(this.updateTime, 1000);
  },
  methods: {
    // 初始化所有数据
    initializeAllData() {
      console.log('DataVisualizationDashboard: 开始初始化所有数据')
      // 获取统计数据
      this.fetchStatistics();
      // 其他图表组件会通过props变化自动触发数据获取
      console.log('DataVisualizationDashboard: 所有数据初始化完成')
    },
    
     // 获取统计数据
     fetchStatistics() {
       // 构建查询参数，只在有有效值时才添加
       let params = {};
       
       // 如果有日期范围，添加到参数中
       if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
         params.startDate = this.dateRange[0];
         params.endDate = this.dateRange[1];
       }
       
      // 添加年份筛选条件（只在有有效值时才添加）
      if (this.selectedYear && this.selectedYear !== 'all' && this.selectedYear !== '' && this.selectedYear != null) {
        const yearInt = parseInt(this.selectedYear);
        if (!isNaN(yearInt)) {
          params.year = yearInt;
        }
      }
      
      // 添加时间段筛选条件（只在有有效值时才添加）
       if (this.selectedTimePeriod && this.selectedTimePeriod !== 'all' && this.selectedTimePeriod !== '' && this.selectedTimePeriod != null) {
         params.timePeriod = this.selectedTimePeriod;
       }
       
      // 添加时间范围筛选条件（只在有有效值时才添加）
      if (this.customStartTime && this.customEndTime) {
        params.customStartTime = this.customStartTime;
        params.customEndTime = this.customEndTime;
       }
       
       console.log('DataVisualizationDashboard: 获取统计数据，参数:', params);
       console.log('DataVisualizationDashboard: 当前筛选条件:', {
         selectedYear: this.selectedYear,
         selectedTimePeriod: this.selectedTimePeriod,
         dateRange: this.dateRange
       });
       
       // 确保每次都会发出请求
       this.$axios.get('/api/patient-statistics/statistics', { params })
         .then(res => {
           console.log('DataVisualizationDashboard: API响应:', res.data);
           if (res.data.success && res.data.data) {
             const data = res.data.data;
             this.totalPatients = data.totalPatients || 0;
             this.dailyAverage = Math.round(data.averagePatientsPerDay * 10) / 10;
             this.avgInterventionTime = Math.round(data.averageInterventionTime * 10) / 10;
             this.deathCount = data.deathCount || 0;
             
             console.log('DataVisualizationDashboard: 统计数据更新完成:', {
               totalPatients: this.totalPatients,
               dailyAverage: this.dailyAverage,
               avgInterventionTime: this.avgInterventionTime,
               deathCount: this.deathCount
             });
           } else {
             console.warn('DataVisualizationDashboard: 未获取到有效统计数据');
           }
         })
         .catch(err => {
           console.error('获取统计数据失败:', err);
           this.$message.error('获取统计数据失败');
         });
     },

    // 处理查询按钮点击
    // 处理时间范围变化，选择完两个时间后自动触发查询
    handleTimeRangeChange(value) {
      if (value && value.length === 2 && value[0] && value[1]) {
        // 将时间范围赋值给实际变量，触发查询
        this.customStartTime = value[0];
        this.customEndTime = value[1];
        
        console.log('DataVisualizationDashboard: 时间范围已选择，自动触发查询，参数:', {
          dateRange: this.dateRange,
          timePeriod: this.selectedTimePeriod,
          year: this.selectedYear,
          customStartTime: this.customStartTime,
          customEndTime: this.customEndTime
        });
        
        // 自动触发查询
        this.queryLoading = true;
        this.fetchStatistics();
        
        // 设置一个较短的延迟来显示查询完成状态
        setTimeout(() => {
          this.queryLoading = false;
          this.$message.success('数据查询完成！');
          console.log('DataVisualizationDashboard: 查询完成');
        }, 1000);
      } else {
        // 如果时间范围被清空，也清空查询条件
        this.customStartTime = null;
        this.customEndTime = null;
        this.fetchStatistics();
      }
    },
    
    handleQuery() {
      this.queryLoading = true;
      
      console.log('DataVisualizationDashboard: 开始查询数据，参数:', {
        dateRange: this.dateRange,
        timePeriod: this.selectedTimePeriod,
        year: this.selectedYear,
        customStartTime: this.customStartTime,
        customEndTime: this.customEndTime
      });
      
      // 强制重新获取统计数据
      this.fetchStatistics();
      
      // 其他图表组件会通过props变化自动重新获取数据
      // ISS分布图、GCS分布图、RTS分布图等都会通过watch监听props变化自动重新获取数据
      // 由于customStartTime和customEndTime已更新，子组件的watch会触发重新获取数据
      
      // 设置一个较短的延迟来显示查询完成状态
      setTimeout(() => {
        this.queryLoading = false;
        this.$message.success('数据查询完成！');
        console.log('DataVisualizationDashboard: 查询完成');
      }, 1000);
    },
    
    // 更新时间
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString('zh-CN');
      this.lastUpdateTime = now.toLocaleString('zh-CN');
    },
    
    // 处理死亡人数点击事件
    async handleDeathCountClick() {
      if (this.deathCount === 0) {
        this.$message.info('当前筛选条件下没有死亡患者');
        return;
      }
      
      // 显示加载提示
      const loading = this.$loading({
        lock: true,
        text: '正在加载死亡患者列表...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      
      try {
        // 构建查询参数（与fetchStatistics保持一致），只在有有效值时才添加
        let params = {};
        
        if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
          params.startDate = this.dateRange[0];
          params.endDate = this.dateRange[1];
        }
        
        if (this.selectedYear && this.selectedYear !== 'all' && this.selectedYear !== '' && this.selectedYear != null) {
          const yearInt = parseInt(this.selectedYear);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        if (this.selectedTimePeriod && this.selectedTimePeriod !== 'all' && this.selectedTimePeriod !== '' && this.selectedTimePeriod != null) {
          params.timePeriod = this.selectedTimePeriod;
        }
        
        // 添加时间范围筛选条件
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        // 调用后端接口获取死亡患者ID列表
        const res = await this.$axios.get('/api/patient-statistics/death-patient-ids', { params });
        
        if (res.data.success && res.data.data) {
          this.deathPatientIds = res.data.data;
          this.showDeathPatientModal = true;
        } else {
          this.$message.error('获取死亡患者列表失败');
        }
      } catch (err) {
        console.error('获取死亡患者列表失败:', err);
        this.$message.error('获取死亡患者列表失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        loading.close();
      }
    },
    
    // 关闭死亡患者列表弹窗
    closeDeathPatientModal() {
      this.showDeathPatientModal = false;
      this.deathPatientIds = [];
    },
    
    // 处理显示伤因患者列表
    handleShowInjuryCausePatientList(data) {
      this.injuryCausePatientIds = data.patientIds || [];
      this.injuryCausePatientModalTitle = data.title || '患者列表';
      this.showInjuryCausePatientModal = true;
    },
    
    // 关闭伤因患者列表弹窗
    closeInjuryCausePatientModal() {
      this.showInjuryCausePatientModal = false;
      this.injuryCausePatientIds = [];
      this.injuryCausePatientModalTitle = '';
    },
    
    // 处理显示ISS分段患者列表
    handleShowISSSegmentPatientList(data) {
      this.issSegmentPatientIds = data.patientIds || [];
      this.issSegmentPatientModalTitle = data.title || '患者列表';
      this.showISSSegmentPatientModal = true;
    },
    
    // 关闭ISS分段患者列表弹窗
    closeISSSegmentPatientModal() {
      this.showISSSegmentPatientModal = false;
      this.issSegmentPatientIds = [];
      this.issSegmentPatientModalTitle = '';
    },
    
    // 处理显示GCS分段患者列表
    handleShowGCSSegmentPatientList(data) {
      this.gcsSegmentPatientIds = data.patientIds || [];
      this.gcsSegmentPatientModalTitle = data.title || '患者列表';
      this.showGCSSegmentPatientModal = true;
    },
    
    // 关闭GCS分段患者列表弹窗
    closeGCSSegmentPatientModal() {
      this.showGCSSegmentPatientModal = false;
      this.gcsSegmentPatientIds = [];
      this.gcsSegmentPatientModalTitle = '';
    },
    
    // 处理显示RTS评分患者列表
    handleShowRTSScorePatientList(data) {
      this.rtsScorePatientIds = data.patientIds || [];
      this.rtsScorePatientModalTitle = data.title || '患者列表';
      this.showRTSScorePatientModal = true;
    },
    
    // 关闭RTS评分患者列表弹窗
    closeRTSScorePatientModal() {
      this.showRTSScorePatientModal = false;
      this.rtsScorePatientIds = [];
      this.rtsScorePatientModalTitle = '';
    },
    
    // 处理显示身体部位患者列表
    handleShowBodyPartPatientList(data) {
      this.bodyPartPatientIds = data.patientIds || [];
      this.bodyPartPatientModalTitle = data.title || '患者列表';
      this.showBodyPartPatientModal = true;
    },
    
    // 关闭身体部位患者列表弹窗
    closeBodyPartPatientModal() {
      this.showBodyPartPatientModal = false;
      this.bodyPartPatientIds = [];
      this.bodyPartPatientModalTitle = '';
    },
    
    // 处理显示身体区域+严重程度患者列表
    handleShowBodyRegionSeverityPatientList(data) {
      this.bodyRegionSeverityPatientIds = data.patientIds || [];
      this.bodyRegionSeverityPatientModalTitle = data.title || '患者列表';
      this.showBodyRegionSeverityPatientModal = true;
    },
    
    // 关闭身体区域+严重程度患者列表弹窗
    closeBodyRegionSeverityPatientModal() {
      this.showBodyRegionSeverityPatientModal = false;
      this.bodyRegionSeverityPatientIds = [];
      this.bodyRegionSeverityPatientModalTitle = '';
    }
  }
}
</script>

<style scoped>
/* 基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.dashboard-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

/* 顶部导航栏 */
.dashboard-header {
  min-height: 80px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-left {
  flex-shrink: 0;
}

.header-left .logo {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #2c3e50;
}

.header-left .logo i {
  font-size: 24px;
  color: #3498db;
  margin-right: 10px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}

.header-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.header-right .time-display {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.header-right .time-display i {
  margin-right: 8px;
  color: #3498db;
  font-size: 18px;
}

/* 查询框容器 */
.filter-container {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.filter-item-enhanced {
  position: relative;
}

.filter-label {
  color: #2c3e50;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: flex-end;
  transition: all 0.3s ease;
}

.filter-label i {
  font-size: 16px;
  color: #3498db;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.filter-item:hover .filter-label i {
  opacity: 1;
  transform: scale(1.1);
}

/* 日期范围包装器 */
.date-range-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-range-wrapper::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #3498db, #2980b9);
  border-radius: 2px;
  transition: height 0.3s ease;
}

.filter-item-enhanced:hover .date-range-wrapper::before {
  height: 60%;
}

.enhanced-date-picker {
  width: 280px !important;
  transition: all 0.3s ease;
}

.enhanced-date-picker :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 2px solid rgba(52, 152, 219, 0.3) !important;
  border-radius: 8px !important;
  color: #2c3e50 !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  padding: 8px 12px !important;
}

.enhanced-date-picker :deep(.el-input__inner):hover {
  border-color: rgba(52, 152, 219, 0.6) !important;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2) !important;
  transform: translateY(-1px);
}

.enhanced-date-picker :deep(.el-input__inner):focus {
  border-color: #3498db !important;
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3) !important;
  transform: translateY(-1px);
}

.enhanced-date-picker :deep(.el-input__icon) {
  color: #3498db !important;
  transition: all 0.3s ease !important;
}

.enhanced-date-picker:hover :deep(.el-input__icon) {
  transform: scale(1.1);
}

.enhanced-date-picker :deep(.el-range-separator) {
  color: #666 !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  min-width: 28px !important;
  padding: 0 4px !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: visible !important;
}

.filter-item-enhanced:hover .enhanced-date-picker :deep(.el-range-separator) {
  color: #3498db !important;
  transform: scale(1.1);
}

/* 时间范围包装器 */
.time-range-wrapper {
  position: relative;
  padding: 2px 0;
}

.time-range-wrapper::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #3498db, #2980b9);
  border-radius: 2px;
  transition: height 0.3s ease;
}

.filter-item-enhanced:hover .time-range-wrapper::before {
  height: 60%;
}

/* 时间范围选择器样式 */
.enhanced-time-picker-range {
  width: 280px !important;
  transition: all 0.3s ease;
}

.enhanced-time-picker-range :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 2px solid rgba(52, 152, 219, 0.3) !important;
  border-radius: 8px !important;
  color: #2c3e50 !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  padding: 8px 12px !important;
}

.enhanced-time-picker-range :deep(.el-input__inner):hover {
  border-color: rgba(52, 152, 219, 0.6) !important;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2) !important;
  transform: translateY(-1px);
}

.enhanced-time-picker-range :deep(.el-input__inner):focus {
  border-color: #3498db !important;
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3) !important;
  transform: translateY(-1px);
}

.enhanced-time-picker-range :deep(.el-input__icon) {
  color: #3498db !important;
  transition: all 0.3s ease !important;
}

.enhanced-time-picker-range:hover :deep(.el-input__icon) {
  transform: scale(1.1);
}

.enhanced-time-picker-range :deep(.el-range-separator) {
  color: #666 !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
  min-width: 28px !important;
  padding: 0 4px !important;
  text-align: center !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: visible !important;
}

.filter-item-enhanced:hover .enhanced-time-picker-range :deep(.el-range-separator) {
  color: #3498db !important;
  transform: scale(1.1);
}

/* 增强的选择器样式 */
.enhanced-select {
  width: 140px;
  transition: all 0.3s ease;
}

.enhanced-select :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.98) !important;
  border: 2px solid rgba(52, 152, 219, 0.3) !important;
  border-radius: 8px !important;
  color: #2c3e50 !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  padding: 8px 12px !important;
}

.enhanced-select :deep(.el-input__inner):hover {
  border-color: rgba(52, 152, 219, 0.6) !important;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2) !important;
  transform: translateY(-1px);
}

.enhanced-select :deep(.el-input__inner):focus {
  border-color: #3498db !important;
  box-shadow: 0 4px 16px rgba(52, 152, 219, 0.3) !important;
  transform: translateY(-1px);
}

.enhanced-select :deep(.el-input__suffix) {
  color: #3498db !important;
}

/* 查询按钮样式 */
.query-button {
  background: linear-gradient(135deg, #3498db, #2980b9) !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 10px 24px !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3) !important;
  transition: all 0.3s ease !important;
  position: relative;
  overflow: hidden;
}

.query-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.query-button:hover::before {
  width: 300px;
  height: 300px;
}

.query-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4) !important;
}

.query-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3) !important;
}

.query-button i {
  margin-right: 6px;
  transition: transform 0.3s ease;
}

.query-button:hover i {
  transform: rotate(15deg) scale(1.1);
}

/* 主要内容区域 */
.dashboard-main {
  flex: 1;
  padding: 15px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2px; /* 减少间距，让边框叠在一起 */
  margin-bottom: 10px;
  height: 45px; /* 大幅减少高度 */
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 4px; /* 减少圆角 */
  padding: 6px 8px; /* 大幅减少内边距 */
  display: flex;
  align-items: center;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06); /* 减少阴影 */
  transition: transform 0.2s ease;
  border: none; /* 去掉边框 */
  position: relative;
}

.stat-card:hover {
  transform: translateY(-0.5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
}

.stat-icon {
  width: 20px; /* 大幅缩小图标 */
  height: 20px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px; /* 减少右边距 */
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  font-size: 10px; /* 缩小字体 */
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 14px; /* 缩小数字字体 */
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1px;
  line-height: 1.1;
}

.stat-label {
  font-size: 9px; /* 进一步缩小标签字体 */
  color: #666;
  line-height: 1.1;
}

/* 7图表网格布局 */
.charts-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr; /* 4列：热力图2列，3个饼图各1列 */
  grid-template-rows: 1fr 1fr; /* 2行 */
  gap: 12px;
  overflow: hidden;
}

/* 第一行：热力图 + ISS饼图 + GCS饼图 + 人体图（跨2行） */
.chart-heatmap {
  grid-column: 1;
  grid-row: 1;
}

.chart-pie-iss {
  grid-column: 2;
  grid-row: 1;
}

.chart-pie-gcs {
  grid-column: 3;
  grid-row: 1;
}

.chart-body {
  grid-column: 4;
  grid-row: 1 / 3; /* 跨2行 */
}

/* 第二行：柱状图 + RTS饼图 + 旭日图 */
.chart-bar {
  grid-column: 1;
  grid-row: 2;
}

.chart-pie-rts {
  grid-column: 2;
  grid-row: 2;
}

.chart-sunburst {
  grid-column: 3;
  grid-row: 2;
}

/* 图表项目基础样式 */
.chart-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 200px;
}

/* 图表标题覆盖样式 */
.chart-title-overlay {
  position: absolute;
  top: 4px;
  right: 12px;
  background: rgba(52, 152, 219, 0.9);
  backdrop-filter: blur(10px);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.chart-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 2px;
}

.chart-title i {
  margin-right: 4px;
  font-size: 12px;
}

.chart-subtitle {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
}

/* 图表内容 */
.chart-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: #666;
  font-size: 14px;
  height: 100%;
  min-height: 0;
}

/* 底部状态栏 */
.dashboard-footer {
  height: 35px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 11px;
}

.footer-left, .footer-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.separator {
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1920px) {
  .charts-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

@media (max-width: 1366px) {
  .charts-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
  }
  
  .chart-heatmap {
    grid-column: 1 / 3;
    grid-row: 1;
  }
  
  .chart-pie-iss {
    grid-column: 1;
    grid-row: 2;
  }
  
  .chart-pie-gcs {
    grid-column: 2;
    grid-row: 2;
  }
  
  .chart-bar {
    grid-column: 1;
    grid-row: 3;
  }
  
  .chart-pie-rts {
    grid-column: 2;
    grid-row: 3;
  }
  
  .chart-sunburst {
    grid-column: 1;
    grid-row: 4;
  }
  
  .chart-body {
    grid-column: 2;
    grid-row: 4;
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(7, 1fr);
  }
  
  .chart-heatmap,
  .chart-pie-iss,
  .chart-pie-gcs,
  .chart-pie-rts,
  .chart-bar,
  .chart-sunburst,
  .chart-body {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
