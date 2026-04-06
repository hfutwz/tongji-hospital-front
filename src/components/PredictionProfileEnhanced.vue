<template>
  <div class="profile-enhanced">
    <!-- 错误提示 -->
    <el-alert 
      v-if="profile && profile.error" 
      type="error" 
      :title="profile.error" 
      :closable="false" 
      show-icon 
    />
    
    <!-- 空状态 -->
    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">🏙️</div>
      <div class="empty-text">选择地区并点击预测查看地区画像</div>
    </div>
    
    <!-- 结果展示 -->
    <template v-else>
      <!-- 地区标题 -->
      <div class="district-header">
        <div class="district-icon">📍</div>
        <h4 class="district-name">{{ profile.district }}</h4>
        <div class="district-tag">地区画像</div>
      </div>
      
      <!-- 时间线式时段分布 -->
      <div class="timeline-section">
        <div class="section-title">
          <span class="title-icon">⏰</span>
          <span>时段分布时间线</span>
        </div>
        <div class="timeline">
          <div
            v-for="(item, index) in periodTimeline"
            :key="item.name"
            class="timeline-item"
            :class="{ 'is-peak': item.isPeak }"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="time-dot" :style="{ background: item.color }"></div>
            <div class="time-content">
              <div class="time-name">{{ item.name }}</div>
              <div class="time-bar">
                <div 
                  class="time-fill"
                  :style="{ width: `${item.percent}%`, background: item.color }"
                ></div>
              </div>
            </div>
            <div class="time-value">{{ item.percent }}%</div>
          </div>
        </div>
      </div>
      
      <!-- 季节分布 - 花瓣图 -->
      <div class="petal-section">
        <div class="section-title">
          <span class="title-icon">🌸</span>
          <span>季节分布特征</span>
        </div>
        <div class="petal-chart">
          <div
            v-for="(item, index) in seasonPetal"
            :key="item.name"
            class="petal-item"
            :style="{ 
              animationDelay: `${index * 0.15}s`,
              '--petal-color': item.color
            }"
          >
            <div 
              class="petal-circle"
              :style="{ 
                transform: `scale(${item.scale})`,
                background: item.gradient
              }"
            >
              <span class="petal-percent">{{ item.percent }}%</span>
            </div>
            <div class="petal-name">{{ item.name }}</div>
            <div class="petal-icon">{{ item.icon }}</div>
          </div>
        </div>
      </div>
      
      <!-- 伤因分布 - 词云风格 -->
      <div class="wordcloud-section">
        <div class="section-title">
          <span class="title-icon">🩹</span>
          <span>伤因分布</span>
        </div>
        <div class="wordcloud">
          <div
            v-for="(item, index) in causeWords"
            :key="item.name"
            class="word-item"
            :class="`word-level-${item.level}`"
            :style="{ 
              animationDelay: `${index * 0.1}s`,
              color: item.color
            }"
          >
            <span class="word-text">{{ item.name }}</span>
            <span class="word-badge">{{ item.percent }}%</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PredictionProfileEnhanced',
  props: {
    profile: { type: Object, default: null }
  },
  computed: {
    hasData() {
      const p = this.profile
      return p && !p.error && p.period && p.season && p.causes
    },
    periodTimeline() {
      const period = this.profile?.period || {}
      const colors = {
        '夜间': '#606266',
        '早高峰': '#f56c6c',
        '午高峰': '#e6a23c',
        '下午': '#409eff',
        '晚高峰': '#67c23a',
        '晚上': '#8e44ad'
      }
      const data = Object.keys(period).map(name => ({
        name,
        percent: Math.round((period[name] || 0) * 100),
        color: colors[name] || '#909399',
        isPeak: name.includes('高峰')
      }))
      // 按时间顺序排列
      const order = ['夜间', '早高峰', '午高峰', '下午', '晚高峰', '晚上']
      return order.map(name => data.find(d => d.name === name)).filter(Boolean)
    },
    seasonPetal() {
      const season = this.profile?.season || {}
      const config = {
        '春': { icon: '🌸', color: '#67c23a', gradient: 'linear-gradient(135deg, #f0f9eb 0%, #67c23a 100%)' },
        '夏': { icon: '☀️', color: '#e6a23c', gradient: 'linear-gradient(135deg, #fdf6ec 0%, #e6a23c 100%)' },
        '秋': { icon: '🍂', color: '#f56c6c', gradient: 'linear-gradient(135deg, #fef0f0 0%, #f56c6c 100%)' },
        '冬': { icon: '❄️', color: '#409eff', gradient: 'linear-gradient(135deg, #ecf5ff 0%, #409eff 100%)' }
      }
      const max = Math.max(...Object.values(season), 0.01)
      return Object.keys(season)
        .map(name => ({
          name,
          percent: Math.round((season[name] || 0) * 100),
          scale: 0.5 + ((season[name] || 0) / max) * 0.5,
          ...config[name]
        }))
        .sort((a, b) => b.percent - a.percent)
    },
    causeWords() {
      const causes = this.profile?.causes || {}
      const colors = {
        '交通伤': '#f56c6c',
        '高坠伤': '#e6a23c',
        '机械伤': '#409eff',
        '跌倒': '#67c23a',
        '其他': '#909399'
      }
      const max = Math.max(...Object.values(causes), 0.01)
      return Object.keys(causes)
        .map(name => {
          const percent = Math.round((causes[name] || 0) * 100)
          const ratio = (causes[name] || 0) / max
          return {
            name,
            percent,
            color: colors[name] || '#909399',
            level: ratio > 0.7 ? 1 : ratio > 0.4 ? 2 : 3
          }
        })
        .sort((a, b) => b.percent - a.percent)
    }
  }
}
</script>

<style scoped>
.profile-enhanced {
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

/* 地区头部 */
.district-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #ebeef5;
}

.district-icon {
  font-size: 32px;
}

.district-name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  flex: 1;
}

.district-tag {
  padding: 6px 14px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* 区块标题 */
.section-title {
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

/* 时间线 */
.timeline-section {
  margin-bottom: 24px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 12px;
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

.timeline-item.is-peak {
  background: linear-gradient(90deg, #fef0f0 0%, #fafbfc 100%);
  border-left: 3px solid #f56c6c;
}

.time-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.time-content {
  flex: 1;
}

.time-name {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
  font-weight: 500;
}

.time-bar {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.time-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease-out;
}

.time-value {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  min-width: 50px;
  text-align: right;
}

/* 花瓣图 */
.petal-section {
  margin-bottom: 24px;
}

.petal-chart {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
  background: #fafbfc;
  border-radius: 16px;
}

.petal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  animation: popIn 0.5s ease-out forwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.petal-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s ease-out;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.petal-percent {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.petal-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.petal-icon {
  font-size: 20px;
}

/* 词云 */
.wordcloud-section {
  margin-bottom: 16px;
}

.wordcloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  background: #fafbfc;
  border-radius: 16px;
  justify-content: center;
}

.word-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  opacity: 0;
  animation: fadeUp 0.5s ease-out forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.word-text {
  font-weight: 600;
}

.word-level-1 .word-text {
  font-size: 20px;
}

.word-level-2 .word-text {
  font-size: 16px;
}

.word-level-3 .word-text {
  font-size: 14px;
}

.word-badge {
  padding: 2px 8px;
  background: #f5f7fa;
  border-radius: 10px;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .district-name {
    font-size: 18px;
  }
  
  .petal-circle {
    width: 60px;
    height: 60px;
  }
  
  .petal-percent {
    font-size: 13px;
  }
  
  .wordcloud {
    gap: 8px;
    padding: 16px;
  }
  
  .word-item {
    padding: 8px 14px;
  }
}
</style>
