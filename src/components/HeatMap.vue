<template>
  <div class="heatmap-container">
    <!-- 上方筛选框区域 -->
    <div class="filters">
      <div class="select-group">
        <label class="select-label">年份</label>
        <el-select
          v-model="selectedYears"
          multiple
          collapse-tags
          filterable
          placeholder="选择年份"
          class="el-multi"
          style="min-width: 200px;"
        >
          <el-option
            v-for="y in years"
            :key="y"
            :label="y + ''"
            :value="y"
          />
        </el-select>
      </div>
      <div class="select-group">
        <label class="select-label">季节</label>
        <el-select
          v-model="selectedSeasons"
          multiple
          collapse-tags
          placeholder="选择季节"
          class="el-multi"
          style="min-width: 220px;"
        >
          <el-option
            v-for="s in seasons"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          >
            <span class="option-dot" :style="{ backgroundColor: s.color }"></span>
            <span>{{ s.label }}</span>
          </el-option>
        </el-select>
      </div>
      <div class="select-group">
        <label class="select-label">时间段</label>
        <el-select
          v-model="selectedTimePeriods"
          multiple
          collapse-tags
          placeholder="选择时间段"
          class="el-multi"
          style="min-width: 260px;"
        >
          <el-option
            v-for="t in timePeriods"
            :key="t.value"
            :label="t.label"
            :value="t.value"
          >
            <span class="option-dot" :style="{ backgroundColor: t.color }"></span>
            <span>{{ t.label }}</span>
          </el-option>
        </el-select>
      </div>
      <el-button type="primary" @click="query">查询</el-button>
    </div>

    <!-- 地图显示区域 -->
    <div id="hotMap" class="map-box"></div>

    <!-- 患者列表弹窗组件 -->
    <PatientListModal 
      v-if="showModal" 
      :visible="showModal"
      :patient-ids="patientIds"
      @close="closeModal"
    />
  </div>
</template>

<script>
import PatientListModal from './PatientListModal.vue';
// 依赖 Element Plus 的全局注册（项目已在入口统一引入）。

export default {
  components: {
    PatientListModal
  },
  data() {
    return {
      map: null,
      heatmap: null,
      dots: null,
      heatmapData: [],
      years: [],
      selectedYears: [],
      selectedSeasons: [],
      selectedTimePeriods: [],
      showModal: false,
      patientIds: [],
      clickedPoint: null,
      
      // 颜色定义
      seasons: [
        { value: 0, label: "春", color: "#77dd77" },
        { value: 1, label: "夏", color: "#55cc55" },
        { value: 2, label: "秋", color: "#ffcc66" },
        { value: 3, label: "冬", color: "#66ccff" },
      ],
      timePeriods: [
        { value: 0, label: "夜间 00:00-07:59", color: "#333" },
        { value: 1, label: "早高峰 08:00-09:59", color: "#ff6666" },
        { value: 2, label: "午高峰 10:00-11:59", color: "#66cc66" },
        { value: 3, label: "下午 12:00-16:59", color: "#66cccc" },
        { value: 4, label: "晚高峰 17:00-19:59", color: "#ffcc66" },
        { value: 5, label: "晚上 20:00-23:59", color: "#cc66ff" },
      ],
    }
  },
  computed: {
  },
  methods: {
    initMap() {
      // 初始化腾讯地图
      const center = new qq.maps.LatLng(31.2304, 121.4737);
      this.map = new qq.maps.Map(document.getElementById('hotMap'), {
        center,
        zoom: 11,
        scrollwheel: true
      });

      // 添加点击事件监听
      qq.maps.event.addListener(this.map, 'click', (e) => {
        this.handleMapClick(e);
      });

      // 初始化腾讯热力图（可视化库）
      this.heatmap = new qq.maps.visualization.Heat({
        map: this.map,
        radius: 25,
        opacity: [0, 0.8],
        gradient: {
          0.3: "blue",
          0.5: "green",
          0.7: "yellow",
          0.9: "red",
        },
        zIndex: 10
      });

      // 初始化腾讯散点图（红点兜底，确保可见）
      this.dots = new qq.maps.visualization.Dots({
        map: this.map,
        style: {
          fillColor: "rgba(220, 0, 0, 0.85)",
          strokeWidth: 0,
          radius: 6
        },
        zIndex: 20
      });

      this.query();
    },
    
    // 处理地图点击事件
    handleMapClick(e) {
      const latLng = e && e.latLng;
      if (!latLng) return;

      this.clickedPoint = {
        lng: latLng.getLng(),
        lat: latLng.getLat()
      };
      
      // 请求该点的患者数据
      this.fetchPatientData();
    },
    
    // 请求患者ID列表（只获取ID，减少数据传输）
    fetchPatientData() {
      if (!this.clickedPoint) return;
      
      let params = new URLSearchParams();
      params.append('longitude', this.clickedPoint.lng);
      params.append('latitude', this.clickedPoint.lat);
      
      this.selectedSeasons.forEach(s => {
        params.append('seasons', s);
      });
      
      this.selectedTimePeriods.forEach(tp => {
        params.append('timePeriods', tp);
      });
      
      this.$axios
        .get('/api/iss/injury/search/ids', { params })
        .then(res => {
          console.log('患者ID列表响应：', res.data);
          this.patientIds = res.data.data || [];
          
          if (this.patientIds.length > 0) {
            this.showModal = true;
          } else {
            this.$message.info('该位置没有找到患者数据');
          }
        })
        .catch(err => {
          console.error('请求患者ID列表失败：', err);
          this.$message.error('获取患者数据失败');
        });
    },
    
    // 查询热力图数据
    query() {
      let params = new URLSearchParams();
      this.selectedYears.forEach(y => {
        params.append('years', y);
      });
      this.selectedSeasons.forEach(s => {
        params.append('seasons', s);
      });
      
      this.selectedTimePeriods.forEach(tp => {
        params.append('timePeriods', tp);
      });
      
      this.$axios
        .get('/api/map/locations', { params })
        .then(res => {
          console.log('热力图响应数据：', res.data);
          this.heatmapData = res.data.data || [];
          this.setHeatmapData();
        })
        .catch(err => {
          console.error('请求热力图数据失败：', err);
        });
    },
    
    setHeatmapData() {
      if (!this.heatmap && !this.dots) return;
      const dataPoints = this.heatmapData.map(item => ({
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        value: Number(item.count) || 0
      })).filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lng));

      const max = dataPoints.reduce((m, p) => Math.max(m, p.value), 0) || 1;
      if (this.heatmap) {
        this.heatmap.setData({ min: 0, max, data: dataPoints });
        if (typeof this.heatmap.show === 'function') {
          this.heatmap.show();
        }
      }

      // 散点层：每个聚合点渲染一个红点
      if (this.dots) {
        const dotData = dataPoints.map(p => ({ lat: p.lat, lng: p.lng }));
        this.dots.setData(dotData);
        if (typeof this.dots.show === 'function') {
          this.dots.show();
        }
      }
    },
    
    toggleSeason(val) {
      const index = this.selectedSeasons.indexOf(val);
      if (index >= 0) {
        this.selectedSeasons.splice(index, 1);
      } else {
        this.selectedSeasons.push(val);
      }
    },
    
    toggleTimePeriod(val) {
      const index = this.selectedTimePeriods.indexOf(val);
      if (index >= 0) {
        this.selectedTimePeriods.splice(index, 1);
      } else {
        this.selectedTimePeriods.push(val);
      }
    },
    
    // 弹窗相关方法
    closeModal() {
      this.showModal = false;
      this.patientIds = [];
    }
  },
  mounted() {
    this.initMap();
    // 生成年份：当前年往前推10年
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    const list = [];
    for (let y = currentYear; y >= startYear; y--) {
      list.push(y);
    }
    this.years = list;
    // 默认选中当前年
    this.selectedYears = [currentYear];
  },
};
</script>

<style scoped>
.heatmap-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}
.filters {
  padding: 10px 20px;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
/* 主题化选择器样式 */
.select-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.select-label {
  color: #333;
  font-size: 14px;
}
.el-multi :deep(.el-select__tags) {
  max-width: 180px;
}
.option-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}
button {
  padding: 6px 12px;
  background-color: #0270c9;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
} 
button:hover {
  background-color: #025b9c;
}
#hotMap {
  flex: 1;
  min-height: 400px;
}
.color-btn {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  border: 1px solid #ccc;
  user-select: none;
  font-size: 14px;
  transition: all 0.2s;
}
</style>