<template>
  <div class="map-anim-container">
    <!-- 顶部控制 -->
    <div class="top-controls">
      <label>年份：</label>
      <select v-model="selectedYear" class="year-select">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
      <button class="btn btn-primary" :disabled="isLoading" @click="startAnimation">开始查询</button>
      <button class="btn btn-secondary" @click="stopAnimation">停止</button>
      <span class="current-date">当前月份：{{ currentMonth }}</span>
      <span class="month-total" v-if="currentMonthTotal !== null">当月患者总数：{{ currentMonthTotal }}</span>
    </div>
    <!-- 大地图 -->
    <div id="mapContainer" class="map-box"></div>
    <!-- 轮播区域 -->
    <div class="carousel-box">
      <!-- 左箭头 -->
      <div class="arrow left" @click="move(-1)">‹</div>

      <!-- 可视窗口 -->
      <div class="viewport" ref="viewport">
        <div
          class="track"
          ref="track"
          :style="{ transform: `translateX(${offsetX}px)` }"
        >
          <div
            v-for="(item,index) in dayDataList"
            :key="item.date"
            class="slide"
            :class="{ active: index === currentIdx }"
            @click="jumpTo(index)"
          >
            <div class="mini-map" :id="`miniMap${index}`"></div>
            <span class="slide-date">{{ item.date }}</span>
          </div>
        </div>
      </div>

      <!-- 右箭头 -->
      <div class="arrow right" @click="move(1)">›</div>
    </div>

    <!-- 指示器 -->
    <div class="dots">
      <span
        v-for="(item,index) in dayDataList"
        :key="index"
        :class="{ active: index === currentIdx }"
        @click="jumpTo(index)"
      />
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      map: null,          // 主地图
      heatmap: null,      // 主热力图层
      selectedYear: '',   // 选择年份
      yearOptions: [],    // 年份下拉（当前年起往前10年）
      dayDataList: [],    // 月份数据 & miniMap 实例
      currentIdx: 0,      // 当前激活索引
      intervalId: null,   // 自动轮播句柄
      currentMonth: '',   // 顶部文字（YYYY-MM）
      offsetX: 0,         // track 偏移量
      slideWidth: 180,    // 单个 slide 宽度（含 margin）
      isLoading: false,   // 加载状态，避免重复请求
      lastFetchedYear: null, // 上次拉取年份
      currentMonthTotal: null, // 当前月总数
    };
  },
  methods: {
    /* ---------------- 百度地图相关 ---------------- */
    initMap() {
      // 初始化百度地图
      this.map = new BMap.Map('mapContainer');
      const point = new BMap.Point(121.4737, 31.2304);
      this.map.centerAndZoom(point, 11);
      this.map.enableScrollWheelZoom(true);
      
      // 初始化百度热力图
      const heatmapOverlay = new BMapLib.HeatmapOverlay({
        radius: 25,
        opacity: [0, 0.8],
        gradient: {
          0.3: 'blue',
          0.5: 'green',
          0.7: 'yellow',
          0.9: 'red',
        },
      });
      this.map.addOverlay(heatmapOverlay);
      this.heatmap = heatmapOverlay;
    },
    /* 初始化单个 mini 地图（缩略图） */
    initMiniMap(index, points) {
      this.$nextTick(() => {
        const mini = new BMap.Map(`miniMap${index}`);
        const point = new BMap.Point(121.4737, 31.2304);
        mini.centerAndZoom(point, 9);
        mini.disableDragging();
        mini.disableDoubleClickZoom();
        mini.disableKeyboard();
        
        // 缩略图也用热力图
        const miniHeatmap = new BMapLib.HeatmapOverlay({
          radius: 15,
          opacity: [0, 0.6],
          gradient: { 0.3: 'blue', 0.5: 'green', 0.7: 'yellow', 0.9: 'red' },
        });
        mini.addOverlay(miniHeatmap);
        miniHeatmap.setDataSet({ data: points, max: 1 });
        this.dayDataList[index].miniMap = mini;
      });
    },

    /* ---------------- 数据请求（按月） ---------------- */
    async fetch12Months() {
      if (!this.selectedYear) { alert('请先选择年份'); return; }
      this.isLoading = true;
      const y = Number(this.selectedYear);
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      const tasks = months.map(m => {
        const mm = String(m).padStart(2, '0');
        const startDate = `${y}-${mm}-01`;
        const endDate = this.getMonthEnd(y, m);
        return this.$axios.get('/api/map/location-filtered', {
          params: { startDate, endDate }
        }).then(res => {
          const list = res.data.data || [];
          const pts = list.map(v => ({
            lng: v.longitude,
            lat: v.latitude,
            count: v.count,
          }));
          const total = list.reduce((sum, v) => sum + (Number(v.count) || 0), 0);
          return { month: `${y}-${mm}`, points: pts, total };
        });
      });
      try {
        const arr = await Promise.all(tasks);
        this.dayDataList = arr;
        this.currentIdx = 0;
        this.switchBigMap();          // 第一次渲染主地图
        this.dayDataList.forEach((v, i) => this.initMiniMap(i, v.points));
        this.scrollToCenter(0);       // 把第一个居中
        this.lastFetchedYear = this.selectedYear;
      } finally {
        this.isLoading = false;
      }
    },

    /* ---------------- 轮播控制 ---------------- */
    async startAnimation() {
      if (!this.selectedYear) { alert('请先选择年份'); return; }
      this.stopAnimation();
      if (this.dayDataList.length === 0 || this.lastFetchedYear !== this.selectedYear) {
        await this.fetch12Months();
      } else {
        this.currentIdx = 0;
        this.switchBigMap();
        this.scrollToCenter(0);
      }
      this.autoPlay();
    },
    autoPlay() {
      this.stopAnimation();
      this.intervalId = setInterval(() => {
        this.move(1);
      }, 2000);
    },
    stopAnimation() {
      if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    },
    /* 左右箭头 +/-1，支持循环 */
    move(step) {
      const len = this.dayDataList.length;
      if (len === 0) return;
      let next = (this.currentIdx + step) % len;
      if (next < 0) next += len;
      this.jumpTo(next);
    },
    /* 跳到指定索引 */
    jumpTo(index) {
      this.currentIdx = index;
      this.switchBigMap();
      this.scrollToCenter(index);
    },
    /* 主地图切换数据 */
    switchBigMap() {
      const item = this.dayDataList[this.currentIdx];
      if (!item) return;
      this.currentMonth = item.month;
      this.currentMonthTotal = item.total ?? null;
      if (this.heatmap) {
        this.heatmap.setDataSet({ data: item.points, max: 1 });
      }
    },
    /* 计算偏移，让当前 slide 居中 */
    scrollToCenter(index) {
      const vw = this.$refs.viewport.clientWidth;
      const slideW = this.slideWidth;
      const maxOffset = Math.max(0, this.dayDataList.length * slideW - vw);
      const target = index * slideW - (vw - slideW) / 2;
      this.offsetX = Math.max(-maxOffset, Math.min(0, -target));
    },

    /* ---------------- 工具 ---------------- */
    fmtDate(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    getMonthEnd(year, month) {
      const last = new Date(year, month, 0).getDate();
      return `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    }
  },
  mounted() {
    this.initMap();
    const cur = new Date().getFullYear();
    this.yearOptions = Array.from({ length: 11 }, (_, i) => cur - i);
    this.selectedYear = cur;
  },
  beforeDestroy() {
    this.stopAnimation();
  },
};
</script>

<style scoped>
/* ========= 结构与之前保持一致 ========= */
.map-anim-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}
.top-controls {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 12px;
}
.top-controls input[type="date"] {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
/* 主题化下拉框与按钮 */
.year-select {
  padding: 6px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.year-select:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}
.btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(180deg, #5aa9ff 0%, #409eff 100%);
  color: #fff;
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(0.95);
}
.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}
.btn-secondary:hover {
  background: #e5e7eb;
}
button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: #fff;
  cursor: pointer;
  transition: 0.3s;
}
button:hover {
  background: #0056b3;
}
.current-date {
  margin-left: auto;
  font-weight: bold;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 4px;
}
.month-total {
  margin-left: 10px;
  font-weight: 600;
  background: #eef6ff;
  color: #1e3a8a;
  padding: 4px 10px;
  border-radius: 4px;
}
/* ========= 大地图 ========= */
#mapContainer {
  flex: 1;
  min-height: 400px;
  width: 100%;
}

/* ========= 轮播 ========= */
.carousel-box {
  position: relative;
  height: 140px;
  background: #fafafa;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.viewport {
  flex: 1;
  overflow: hidden;
  height: 100%;
}
.track {
  display: flex;
  height: 100%;
  transition: transform 0.4s ease;
}
.slide {
  flex-shrink: 0;
  width: 160px;
  height: 110px;
  margin: 15px 10px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
}
.slide.active {
  box-shadow: 0 0 0 3px #007bff;
}
.mini-map {
  width: 100%;
  height: 80px;
  border-radius: 6px 6px 0 0;
}
.slide-date {
  display: block;
  text-align: center;
  line-height: 30px;
  font-size: 13px;
  font-weight: bold;
}
.arrow {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  user-select: none;
  transition: 0.2s;
  margin: 0 10px;
}
.arrow:hover {
  background: rgba(0, 0, 0, 0.55);
}
.dots {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  background: #fafafa;
}
.dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ccc;
  margin: 0 4px;
  cursor: pointer;
  transition: 0.3s;
}
.dots span.active {
  background: #007bff;
}
</style>