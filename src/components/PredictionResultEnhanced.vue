<template>
  <div class="result-enhanced">
    <!-- 错误提示 -->
    <div v-if="value && value.error" class="predict-error-state">
      <div class="predict-error-icon">💡</div>
      <div class="predict-error-text">{{ value.error }}</div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">点击"开始预测"查看结果</div>
    </div>
    
    <!-- 结果展示 -->
    <template v-else>
      <!-- 顶部指标卡片 -->
      <div class="metric-cards">
        <div class="metric-card primary">
          <div class="metric-icon">🏆</div>
          <div class="metric-content">
            <div class="metric-label">最可能伤因</div>
            <div class="metric-value">{{ value.top_cause || '-' }}</div>
          </div>
        </div>
        
        <div class="metric-card" :class="confidenceClass">
          <div class="metric-icon">{{ confidenceIcon }}</div>
          <div class="metric-content">
            <div class="metric-label">置信度</div>
            <div class="metric-value">{{ confidenceText }}</div>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <div class="metric-label">样本量</div>
            <div class="metric-value">{{ formatNumber(value.sample_n) }}</div>
          </div>
        </div>
        
        <div class="metric-card" v-if="value.is_fallback">
          <div class="metric-icon">⚠️</div>
          <div class="metric-content">
            <div class="metric-label">数据状态</div>
            <div class="metric-value warn">已降级</div>
          </div>
        </div>
      </div>
      
      <!-- 动态条形图 -->
      <div class="chart-section">
        <div class="section-header">
          <span class="section-title">伤因概率分布</span>
          <span class="section-subtitle">实时预测结果</span>
        </div>
        
        <div class="probability-bars">
          <div
            v-for="(item, index) in sortedProbabilities"
            :key="item.cause"
            class="prob-bar-item"
            :class="{ 'is-top': index === 0 }"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="bar-label">
              <span class="cause-name">{{ item.cause }}</span>
              <span class="cause-rank" v-if="index === 0">TOP1</span>
            </div>
            
            <div class="bar-track">
              <div 
                class="bar-fill"
                :style="{ 
                  width: `${item.percent}%`,
                  background: getBarGradient(index)
                }"
              >
                <div class="bar-shine"></div>
              </div>
            </div>
            
            <div class="bar-value">
              <span class="value-number">{{ (item.p * 100).toFixed(1) }}</span>
              <span class="value-unit">%</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部信息 -->
      <div class="result-footer">
        <div class="footer-item">
          <i class="el-icon-info"></i>
          <span>模型版本: {{ value.model_version || 'unknown' }}</span>
        </div>
        <div class="footer-item" v-if="value.is_fallback">
          <i class="el-icon-warning"></i>
          <span>当前条件下样本不足，已使用全局统计</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PredictionResultEnhanced',
  props: {
    value: { type: Object, default: null },
    type: { type: String, default: 'cause' }
  },
  computed: {
    hasData() {
      return this.value && !this.value.error && this.value.probabilities
    },
    sortedProbabilities() {
      if (!this.hasData) return []
      const probs = this.value.probabilities
      return Object.keys(probs)
        .map(cause => ({ cause, p: probs[cause], percent: probs[cause] * 100 }))
        .sort((a, b) => b.p - a.p)
    },
    confidenceClass() {
      const c = this.value?.confidence
      return {
        'confidence-high': c === 'high',
        'confidence-medium': c === 'medium',
        'confidence-low': c === 'low'
      }
    },
    confidenceText() {
      const map = { high: '高', medium: '中', low: '低' }
      return map[this.value?.confidence] || '-'
    },
    confidenceIcon() {
      const map = { high: '✅', medium: '⚡', low: '⚠️' }
      return map[this.value?.confidence] || '❓'
    }
  },
  methods: {
    formatNumber(n) {
      if (n == null) return '-'
      return n.toLocaleString()
    },
    getBarGradient(index) {
      const gradients = [
        'linear-gradient(90deg, #f56c6c 0%, #ff9f7f 100%)',
        'linear-gradient(90deg, #e6a23c 0%, #f5d48f 100%)',
        'linear-gradient(90deg, #409eff 0%, #7ebfff 100%)',
        'linear-gradient(90deg, #67c23a 0%, #95d475 100%)',
        'linear-gradient(90deg, #909399 0%, #c0c4cc 100%)'
      ]
      return gradients[index] || gradients[4]
    }
  }
}
</script>

<style scoped>
.result-enhanced {
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

/* 指标卡片 */
.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.metric-card.primary {
  background: linear-gradient(135deg, #ecf5ff 0%, #f5f7fa 100%);
  border: 1px solid #d9ecff;
}

.metric-card.confidence-high {
  background: linear-gradient(135deg, #f0f9eb 0%, #f5f7fa 100%);
  border: 1px solid #e1f3d8;
}

.metric-card.confidence-medium {
  background: linear-gradient(135deg, #fdf6ec 0%, #f5f7fa 100%);
  border: 1px solid #faecd8;
}

.metric-card.confidence-low {
  background: linear-gradient(135deg, #fef0f0 0%, #f5f7fa 100%);
  border: 1px solid #fde2e2;
}

.metric-icon {
  font-size: 28px;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.metric-value.warn {
  color: #e6a23c;
}

/* 图表区域 */
.chart-section {
  background: #fafbfc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-subtitle {
  font-size: 12px;
  color: #909399;
}

/* 概率条形图 */
.probability-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prob-bar-item {
  display: grid;
  grid-template-columns: 100px 1fr 70px;
  align-items: center;
  gap: 12px;
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

.prob-bar-item.is-top .cause-name {
  font-weight: 700;
  color: #f56c6c;
}

.bar-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cause-name {
  font-size: 14px;
  color: #606266;
}

.cause-rank {
  font-size: 10px;
  padding: 2px 6px;
  background: #f56c6c;
  color: #fff;
  border-radius: 10px;
  font-weight: 600;
}

.bar-track {
  height: 28px;
  background: #ebeef5;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 14px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.bar-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.4),
    transparent
  );
  animation: barShine 2s infinite;
}

@keyframes barShine {
  0% { left: -100%; }
  100% { left: 200%; }
}

.bar-value {
  text-align: right;
}

.value-number {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.value-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 2px;
}

/* 底部信息 */
.result-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
}

.footer-item i {
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .metric-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .prob-bar-item {
    grid-template-columns: 80px 1fr 60px;
  }
  
  .value-number {
    font-size: 14px;
  }
}

.predict-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 20px;
  text-align: center;
  gap: 10px;
}
.predict-error-icon { font-size: 36px; opacity: 0.5; }
.predict-error-text {
  font-size: 13px;
  color: #909399;
  max-width: 300px;
  line-height: 1.7;
}
</style>
