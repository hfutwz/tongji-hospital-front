<template>
  <div class="triple-enhanced">
    <!-- 错误提示 -->
    <el-alert 
      v-if="payload && payload.error" 
      type="error" 
      :title="payload.error" 
      :closable="false" 
      show-icon 
    />
    
    <!-- 空状态 -->
    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">🌐</div>
      <div class="empty-text">选择伤因并点击预测查看时空分布</div>
    </div>
    
    <!-- 结果展示 -->
    <template v-else>
      <!-- 标题 -->
      <div class="result-header">
        <div class="header-badge">{{ causeLabel }}</div>
        <h4 class="header-title">时空分布特征</h4>
      </div>
      
      <!-- 三列布局 -->
      <div class="distribution-grid">
        <!-- 时段分布 - 环形进度 -->
        <div class="dist-card">
          <div class="card-header">
            <span class="header-icon">⏰</span>
            <span class="header-text">时段分布</span>
          </div>
          <div class="ring-charts">
            <div
              v-for="(item, index) in periodData"
              :key="item.name"
              class="ring-item"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="ring-wrapper">
                <svg class="ring-svg" viewBox="0 0 100 100">
                  <circle class="ring-bg" cx="50" cy="50" r="42"/>
                  <circle 
                    class="ring-progress"
                    cx="50" cy="50" r="42"
                    :style="{ 
                      strokeDasharray: `${item.percent * 2.64} 264`,
                      stroke: item.color
                    }"
                  />
                </svg>
                <div class="ring-value">{{ item.percent }}%</div>
              </div>
              <div class="ring-label">{{ item.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 季节分布 - 雷达图风格 -->
        <div class="dist-card">
          <div class="card-header">
            <span class="header-icon">🌿</span>
            <span class="header-text">季节分布</span>
          </div>
          <div class="season-bars">
            <div
              v-for="(item, index) in seasonData"
              :key="item.name"
              class="season-item"
              :style="{ animationDelay: `${index * 0.15}s` }"
            >
              <div class="season-icon">{{ item.icon }}</div>
              <div class="season-bar-wrapper">
                <div 
                  class="season-bar"
                  :style="{ 
                    height: `${item.percent}%`,
                    background: item.color
                  }"
                >
                  <span class="bar-percent" v-if="item.percent > 15">{{ item.percent }}%</span>
                </div>
              </div>
              <div class="season-name">{{ item.name }}</div>
            </div>
          </div>
        </div>
        
        <!-- 地区分布 - 排名列表 -->
        <div class="dist-card wide">
          <div class="card-header">
            <span class="header-icon">🏙️</span>
            <span class="header-text">地区分布 TOP5</span>
          </div>
          <div class="district-ranking">
            <div
              v-for="(item, index) in topDistricts"
              :key="item.name"
              class="rank-item"
              :class="`rank-${index + 1}`"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="rank-badge">{{ index + 1 }}</div>
              <div class="rank-info">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-bar">
                  <div 
                    class="rank-fill"
                    :style="{ width: `${item.percent}%` }"
                  ></div>
                </div>
              </div>
              <div class="rank-value">{{ item.count }}次</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PredictionTripleEnhanced',
  props: {
    payload: { type: Object, default: null }
  },
  computed: {
    hasData() {
      const p = this.payload
      return p && !p.error && p.period && p.season && p.districts
    },
    causeLabel() {
      return this.payload?.cause || '全部伤因'
    },
    periodData() {
      const period = this.payload?.period || {}
      const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#8e44ad']
      return Object.keys(period)
        .map((name, i) => ({
          name,
          percent: Math.round((period[name] || 0) * 100),
          color: colors[i % colors.length]
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4)
    },
    seasonData() {
      const season = this.payload?.season || {}
      const icons = { '春': '🌸', '夏': '☀️', '秋': '🍂', '冬': '❄️' }
      const colors = {
        '春': 'linear-gradient(180deg, #f0f9eb 0%, #67c23a 100%)',
        '夏': 'linear-gradient(180deg, #fdf6ec 0%, #e6a23c 100%)',
        '秋': 'linear-gradient(180deg, #fef0f0 0%, #f56c6c 100%)',
        '冬': 'linear-gradient(180deg, #ecf5ff 0%, #409eff 100%)'
      }
      return Object.keys(season)
        .map(name => ({
          name,
          percent: Math.round((season[name] || 0) * 100),
          icon: icons[name] || '📅',
          color: colors[name] || '#909399'
        }))
        .sort((a, b) => b.percent - a.percent)
    },
    topDistricts() {
      const districts = this.payload?.districts || {}
      const max = Math.max(...Object.values(districts), 1)
      return Object.keys(districts)
        .map(name => ({
          name,
          count: districts[name],
          percent: Math.round((districts[name] / max) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  }
}
</script>

<style scoped>
.triple-enhanced {
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

/* 结果头部 */
.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-badge {
  padding: 6px 14px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.header-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
  font-weight: 600;
}

/* 分布网格 */
.distribution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .distribution-grid {
    grid-template-columns: 1fr;
  }
}

.dist-card {
  background: #fafbfc;
  border-radius: 16px;
  padding: 16px;
}

.dist-card.wide {
  grid-column: span 1;
}

@media (max-width: 900px) {
  .dist-card.wide {
    grid-column: span 1;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  font-size: 18px;
}

/* 环形图 */
.ring-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.ring-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  animation: popIn 0.5s ease-out forwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.ring-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #ebeef5;
  stroke-width: 10;
}

.ring-progress {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease-out;
}

.ring-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 700;
  color: #303133;
}

.ring-label {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}

/* 季节柱状图 */
.season-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 160px;
  padding: 0 8px;
}

.season-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  opacity: 0;
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.season-icon {
  font-size: 24px;
}

.season-bar-wrapper {
  width: 36px;
  height: 80px;
  background: #ebeef5;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
}

.season-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-radius: 18px;
  transition: height 1s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bar-percent {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.season-name {
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

/* 地区排名 */
.district-ranking {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
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

.rank-badge {
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

.rank-1 .rank-badge {
  background: #fef0f0;
  color: #f56c6c;
}

.rank-2 .rank-badge {
  background: #fdf6ec;
  color: #e6a23c;
}

.rank-3 .rank-badge {
  background: #f0f9eb;
  color: #67c23a;
}

.rank-info {
  flex: 1;
}

.rank-name {
  font-size: 13px;
  color: #303133;
  margin-bottom: 6px;
  font-weight: 500;
}

.rank-bar {
  height: 6px;
  background: #ebeef5;
  border-radius: 3px;
  overflow: hidden;
}

.rank-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
  border-radius: 3px;
  transition: width 1s ease-out;
}

.rank-value {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  min-width: 50px;
  text-align: right;
}

/* 响应式 */
@media (max-width: 768px) {
  .ring-charts {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .season-bars {
    height: 140px;
  }
  
  .season-bar-wrapper {
    width: 28px;
    height: 60px;
  }
}
</style>
