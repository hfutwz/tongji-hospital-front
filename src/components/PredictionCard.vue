<template>
  <div class="prediction-card" :class="{ 'is-loading': loading }">
    <div class="card-header">
      <div class="header-icon">{{ icon }}</div>
      <div class="header-content">
        <h3 class="header-title">{{ title }}</h3>
        <p class="header-subtitle">{{ subtitle }}</p>
      </div>
    </div>
    
    <div class="card-form">
      <div class="form-selectors">
        <slot></slot>
      </div>
      <div class="form-action">
        <button 
          class="predict-btn"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="$emit('predict')"
        >
          <span class="btn-icon">
            <i v-if="loading" class="el-icon-loading"></i>
            <span v-else>🔮</span>
          </span>
          <span class="btn-text">{{ loading ? '预测中...' : '预测' }}</span>
          <div class="btn-shine"></div>
        </button>
      </div>
    </div>
    
    <div class="card-result" :class="{ 'has-content': hasResult }">
      <div class="result-divider">
        <span class="divider-text">预测结果</span>
      </div>
      <div class="result-content">
        <slot name="result"></slot>
      </div>
    </div>
    
    <!-- 装饰元素 -->
    <div class="card-decoration decoration-1"></div>
    <div class="card-decoration decoration-2"></div>
  </div>
</template>

<script>
export default {
  name: 'PredictionCard',
  props: {
    icon: { type: String, default: '📊' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    loading: { type: Boolean, default: false }
  },
  computed: {
    hasResult() {
      return !!this.$slots.result
    }
  }
}
</script>

<style scoped>
.prediction-card {
  position: relative;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.prediction-card:hover {
  box-shadow: 0 8px 40px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.prediction-card.is-loading {
  pointer-events: none;
}

/* 装饰元素 */
.card-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.03;
  pointer-events: none;
}

.decoration-1 {
  width: 200px;
  height: 200px;
  background: #409eff;
  top: -100px;
  right: -100px;
}

.decoration-2 {
  width: 150px;
  height: 150px;
  background: #67c23a;
  bottom: -75px;
  left: -75px;
}

/* 头部 */
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 24px 16px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-bottom: 1px solid #ebeef5;
}

.header-icon {
  font-size: 40px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

/* 表单区域 - 选择器和按钮在一行 */
.card-form {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding: 20px 24px;
}

.form-selectors {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.form-selectors > * {
  flex: 1;
  min-width: 140px;
}

.form-action {
  flex-shrink: 0;
  padding-bottom: 2px;
}

.predict-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.35);
  white-space: nowrap;
}

.predict-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.45);
}

.predict-btn:active:not(:disabled) {
  transform: translateY(0);
}

.predict-btn.is-loading {
  background: linear-gradient(135deg, #a0cfff 0%, #c6e2ff 100%);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.predict-btn:disabled {
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.3),
    transparent
  );
  animation: shine 3s infinite;
}

@keyframes shine {
  0%, 100% { left: -100%; }
  50% { left: 100%; }
}

/* 结果区 */
.card-result {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-result.has-content {
  max-height: 2000px;
}

.result-divider {
  display: flex;
  align-items: center;
  padding: 0 24px;
  margin: 8px 0;
}

.result-divider::before,
.result-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #dcdfe6, transparent);
}

.divider-text {
  padding: 0 16px;
  font-size: 12px;
  color: #909399;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-content {
  padding: 16px 24px 24px;
}

/* 响应式 */
@media (max-width: 768px) {
  .card-header {
    padding: 20px 20px 12px;
  }

  .header-icon {
    font-size: 32px;
  }

  .header-title {
    font-size: 16px;
  }

  .card-form {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 20px;
  }

  .form-selectors {
    flex-direction: column;
  }

  .form-selectors > * {
    min-width: 100%;
  }

  .form-action {
    padding-bottom: 0;
    padding-top: 8px;
  }

  .predict-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
