<template>
  <div v-if="isVisible" class="import-loading-overlay">
    <div class="import-loading-modal">
      <div class="loading-content">
        <!-- 动画图标 -->
        <div class="loading-animation">
          <div class="spinner"></div>
        </div>
        
        <!-- 主要提示信息 -->
        <div class="loading-text">
          <h3 class="loading-title">📊 正在导入患者数据</h3>
          <p class="loading-message">{{ loadingMessage }}</p>
        </div>
        
        <!-- 进度指示器 -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ progress }}%</span>
        </div>
        
        <!-- 友好提示信息 -->
        <div class="loading-tips">
          <div class="tip-item">
            <span class="tip-icon">⏳</span>
            <span class="tip-text">正在处理您的Excel文件...</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">🔍</span>
            <span class="tip-text">正在验证数据格式...</span>
          </div>
          <div class="tip-item">
            <span class="tip-icon">💾</span>
            <span class="tip-text">正在保存到数据库...</span>
          </div>
        </div>
        
        <!-- 取消按钮 -->
        <div class="loading-actions">
          <button @click="cancelImport" class="cancel-btn" :disabled="!canCancel">
            {{ canCancel ? '取消导入' : '请稍候...' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImportLoadingModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0
    },
    canCancel: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loadingMessages: [
        '正在读取Excel文件...',
        '正在解析数据格式...',
        '正在验证数据完整性...',
        '正在处理患者信息...',
        '正在保存到数据库...',
        '正在生成统计报告...',
        '即将完成导入...'
      ],
      currentMessageIndex: 0,
      messageInterval: null
    }
  },
  computed: {
    loadingMessage() {
      return this.loadingMessages[this.currentMessageIndex] || '正在处理中...'
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.startMessageRotation()
      } else {
        this.stopMessageRotation()
      }
    }
  },
  methods: {
    startMessageRotation() {
      this.currentMessageIndex = 0
      this.messageInterval = setInterval(() => {
        this.currentMessageIndex = (this.currentMessageIndex + 1) % this.loadingMessages.length
      }, 2000) // 每2秒切换一次消息
    },
    
    stopMessageRotation() {
      if (this.messageInterval) {
        clearInterval(this.messageInterval)
        this.messageInterval = null
      }
    },
    
    cancelImport() {
      this.$emit('cancel')
    }
  },
  
  beforeDestroy() {
    this.stopMessageRotation()
  }
}
</script>

<style scoped>
.import-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.import-loading-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-animation {
  margin-bottom: 30px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-bottom: 30px;
}

.loading-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-message {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  animation: fadeInOut 2s ease-in-out infinite;
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.progress-container {
  margin-bottom: 30px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.loading-tips {
  margin-bottom: 30px;
}

.tip-item {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  opacity: 0.8;
  animation: tipSlide 3s ease-in-out infinite;
}

.tip-item:nth-child(1) { animation-delay: 0s; }
.tip-item:nth-child(2) { animation-delay: 1s; }
.tip-item:nth-child(3) { animation-delay: 2s; }

@keyframes tipSlide {
  0%, 100% { opacity: 0.5; transform: translateX(-10px); }
  50% { opacity: 1; transform: translateX(0); }
}

.tip-icon {
  font-size: 16px;
  margin-right: 8px;
}

.tip-text {
  font-size: 14px;
}

.loading-actions {
  margin-top: 20px;
}

.cancel-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.cancel-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-loading-modal {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .loading-title {
    font-size: 20px;
  }
  
  .loading-message {
    font-size: 14px;
  }
  
  .tip-text {
    font-size: 12px;
  }
}
</style>
