<template>
  <div class="district-map">
    <!-- 错误提示 -->
    <el-alert 
      v-if="value && value.error" 
      type="error" 
      :title="value.error" 
      :closable="false" 
      show-icon 
    />
    
    <!-- 空状态 -->
    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <div class="empty-text">选择时段和伤因查看地区分布</div>
    </div>
    
    <!-- 结果展示 -->
    <template v-else>
      <!-- 统计概览 -->
      <div class="map-stats">
        <div class="stat-box">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalCount }}</div>
            <div class="stat-label">总发生次数</div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-value">{{ topDistrict }}</div>
            <div class="stat-label">最高发地区</div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-icon">📍</div>
          <div class="stat-info">
            <div class="stat-value">{{ activeDistricts }}</div>
            <div class="stat-label">涉及地区数</div>
          </div>
        </div>
      </div>
      
      <!-- 热力地图 -->
      <div class="heatmap-container">
        <div class="heatmap-title">
          <span class="title-icon">🔥</span>
          <span>地区热力分布</span>
        </div>
        
        <div class="heatmap-grid">
          <div
            v-for="(item, index) in heatmapData"
            :key="item.name"
            class="heat-cell"
            :class="`heat-level-${item.level}`"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @mouseenter="hoveredDistrict = item.name"
            @mouseleave="hoveredDistrict = null"
          >
            <div class="cell-content">
              <div class="cell-name">{{ item.name }}</div>
              <div class="cell-value">{{ item.count }}</div>
              <div class="cell-bar">
                <div 
                  class="cell-fill"
                  :style="{ width: `${item.percent}%` }"
                ></div>
              </div>
            </div>
            <div 
              v-if="hoveredDistrict === item.name" 
              class="cell-tooltip"
            >
              <div class="tooltip-name">{{ item.name }}</div>
              <div class="tooltip-count">{{ item.count }} 次</div>
              <div class="tooltip-percent">占比 {{ item.percent }}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 排行列表 -->
      <div class="ranking-section">
        <div class="ranking-title">
          <span class="title-icon">📈</span>
          <span>详细排行</span>
        </div>
        <div class="ranking-list">
          <div
            v-for="(item, index) in rankingData"
            :key="item.name"
            class="rank-row"
            :class="{ 'is-top3': index < 3 }"
            :style="{ animationDelay: `${index * 0.08}s` }"
          >
            <div class="rank-num">{{ index + 1 }}</div>
            <div class="rank-district">{{ item.name }}</div>
            <div class="rank-progress">
              <div class="progress-track">
                <div 
                  class="progress-fill"
                  :style="{ width: `${item.percent}%` }"
                ></div>
              </div>
            </div>
            <div class="rank-count">{{ item.count }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PredictionDistrictMap',
  props: {
    value: { type: Object, default: null }
  },
  data() {
    return {
      hoveredDistrict: null
    }
  },
  computed: {
    hasData() {
      return this.value && !this.value.error && Object.keys(this.value).length > 0
    },
    districtData() {
      if (!this.hasData) return []
      const data = Object.keys(this.value)
        .map(name => ({
          name,
          count: this.value[name]
        }))
        .sort((a, b) => b.count - a.count)
      const max = Math.max(...data.map(d => d.count), 1)
      return data.map(d => ({
        ...d,
        percent: Math.round((d.count / max) * 100),
        level: d.count / max > 0.7 ? 5 : d.count / max > 0.5 ? 4 : d.count / max > 0.3 ? 3 : d.count / max > 0.1 ? 2 : 1
      }))
    },
    totalCount() {
      return this.districtData.reduce((sum, d) => sum + d.count, 0).toLocaleString()
    },
    topDistrict() {
      return this.districtData[0]?.name || '-'
    },
    activeDistricts() {
      return this.districtData.filter(d => d.count > 0).length
    },
    heatmapData() {
      return this.districtData.slice(0, 16)
    },
    rankingData() {
      return this.districtData
    }
  }
}
</script>

<style scoped>
.district-map {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  color: #909399;
  font-size: 14px;
}

/* 统计概览 */
.map-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-radius: 12px;
  border: 1px solid #ebeef5;
}

.stat-icon {
  font-size: 28px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 热力图容器 */
.heatmap-container {
  background: #fafbfc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.heatmap-title,
.ranking-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  font-size: 18px;
}

/* 热力网格 */
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

@media (max-width: 768px) {
  .heatmap-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .map-stats {
    grid-template-columns: 1fr;
  }
}

.heat-cell {
  position: relative;
  padding: 16px 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0;
  animation: popIn 0.5s ease-out forwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.heat-cell:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.heat-level-5 { border-top: 4px solid #f56c6c; }
.heat-level-4 { border-top: 4px solid #e6a23c; }
.heat-level-3 { border-top: 4px solid #409eff; }
.heat-level-2 { border-top: 4px solid #67c23a; }
.heat-level-1 { border-top: 4px solid #909399; }

.cell-content {
  text-align: center;
}

.cell-name {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.cell-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.cell-bar {
  height: 4px;
  background: #ebeef5;
  border-radius: 2px;
  overflow: hidden;
}

.cell-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 2px;
  transition: width 1s ease-out;
}

/* 悬浮提示 */
.cell-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #303133;
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  animation: tooltipIn 0.2s ease-out;
}

@keyframes tooltipIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.cell-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #303133;
}

.tooltip-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-count,
.tooltip-percent {
  color: #c0c4cc;
}

/* 排行区域 */
.ranking-section {
  background: #fafbfc;
  border-radius: 16px;
  padding: 20px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rank-row {
  display: grid;
  grid-template-columns: 32px 80px 1fr 50px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  opacity: 0;
  animation: slideIn 0.5s ease-out forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rank-row.is-top3 {
  background: linear-gradient(90deg, #fef0f0 0%, #fff 100%);
}

.rank-num {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ebeef5;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  color: #909399;
}

.rank-row.is-top3 .rank-num {
  background: #f56c6c;
  color: #fff;
}

.rank-district {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.rank-progress {
  flex: 1;
}

.progress-track {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px;
  transition: width 1s ease-out;
}

.rank-count {
  font-size: 14px;
  font-weight: 700;
  color: #409eff;
  text-align: right;
}

/* 响应式 */
@media (max-width: 600px) {
  .rank-row {
    grid-template-columns: 28px 60px 1fr 40px;
    gap: 8px;
  }
  
  .rank-district {
    font-size: 12px;
  }
  
  .cell-value {
    font-size: 20px;
  }
}
</style>
