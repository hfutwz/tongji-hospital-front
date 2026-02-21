<template>
  <div class="login-container" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
    <!-- 动态气泡背景 -->
    <div class="bubbles-container">
      <div 
        v-for="(bubble, index) in bubbles" 
        :key="index"
        class="bubble"
        :style="getBubbleStyle(bubble)"
      ></div>
    </div>
    
    <!-- 登录框 -->
    <div class="login-box" :class="{ 'shake': shake }">
      <div class="login-header">
        <div class="logo-icon">
          <i class="el-icon-hospital"></i>
        </div>
        <h1 class="login-title">医院创伤数据可视化系统</h1>
        <p class="login-subtitle">请登录以访问系统</p>
      </div>
      
      <el-form 
        ref="loginForm" 
        :model="loginForm" 
        :rules="rules" 
        class="login-form"
        @submit.native.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
            size="large"
            @keyup.enter.native="handleLogin"
            @focus="onInputFocus"
            @blur="onInputBlur"
            clearable
            class="animated-input"
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            size="large"
            @keyup.enter.native="handleLogin"
            @focus="onInputFocus"
            @blur="onInputBlur"
            show-password
            clearable
            class="animated-input"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleLogin"
            class="login-button"
            :class="{ 'pulse': !loading }"
          >
            <span v-if="!loading">
              <i class="el-icon-right"></i>
              {{ loading ? '登录中...' : '登录' }}
            </span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p class="login-tip">
          <i class="el-icon-info"></i>
          请输入正确的用户名和密码
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ]
      },
      loading: false,
      shake: false,
      bubbles: [],
      mouseX: 0,
      mouseY: 0,
      mouseActive: false
    }
  },
  mounted() {
    this.initBubbles();
    this.animateBubbles();
  },
  beforeDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  },
  methods: {
    // 初始化气泡
    initBubbles() {
      const bubbleCount = 20; // 气泡数量
      this.bubbles = [];
      const bubbleSize = 60; // 统一的气泡大小
      
      for (let i = 0; i < bubbleCount; i++) {
        this.bubbles.push({
          x: Math.random() * 100, // 初始X位置（百分比）
          y: Math.random() * 100, // 初始Y位置（百分比）
          targetX: Math.random() * 100, // 目标X位置
          targetY: Math.random() * 100, // 目标Y位置
          speed: Math.random() * 0.02 + 0.01, // 移动速度
          size: bubbleSize, // 统一大小
          opacity: Math.random() * 0.2 + 0.1, // 透明度
          baseX: Math.random() * 100, // 基础X位置（用于自动移动）
          baseY: Math.random() * 100, // 基础Y位置（用于自动移动）
          angle: Math.random() * Math.PI * 2, // 移动角度
          radius: Math.random() * 30 + 20 // 自动移动半径
        });
      }
    },
    // 鼠标移动处理
    handleMouseMove(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * 100;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * 100;
      this.mouseActive = true;
      
      // 更新气泡目标位置（向鼠标聚拢）
      this.bubbles.forEach(bubble => {
        const dx = this.mouseX - bubble.x;
        const dy = this.mouseY - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离鼠标较近，则向鼠标移动
        const attractionRadius = 40; // 吸引半径
        if (distance < attractionRadius && distance > 0) {
          // 计算吸引力强度（距离越近，吸引力越强）
          const attractionStrength = (attractionRadius - distance) / attractionRadius;
          const moveDistance = attractionStrength * 8; // 最大移动距离
          
          // 向鼠标方向移动
          bubble.targetX = bubble.x + (dx / distance) * moveDistance;
          bubble.targetY = bubble.y + (dy / distance) * moveDistance;
        } else if (distance >= attractionRadius) {
          // 距离较远时，恢复基础位置
          bubble.targetX = bubble.baseX;
          bubble.targetY = bubble.baseY;
        }
      });
    },
    // 鼠标离开处理
    handleMouseLeave() {
      this.mouseActive = false;
      // 恢复气泡到基础位置
      this.bubbles.forEach(bubble => {
        bubble.targetX = bubble.baseX;
        bubble.targetY = bubble.baseY;
      });
    },
    // 获取气泡样式
    getBubbleStyle(bubble) {
      return {
        left: bubble.x + '%',
        top: bubble.y + '%',
        width: bubble.size + 'px',
        height: bubble.size + 'px',
        opacity: bubble.opacity,
        transform: `translate(-50%, -50%)`
      };
    },
    // 气泡动画
    animateBubbles() {
      this.bubbles.forEach(bubble => {
        // 如果没有鼠标交互，让气泡自动移动
        if (!this.mouseActive) {
          // 围绕基础位置做圆周运动
          bubble.angle += bubble.speed;
          bubble.targetX = bubble.baseX + Math.cos(bubble.angle) * bubble.radius;
          bubble.targetY = bubble.baseY + Math.sin(bubble.angle) * bubble.radius;
        }
        
        // 平滑移动到目标位置（使用缓动函数）
        const easing = 0.08; // 缓动系数，值越小越平滑
        bubble.x += (bubble.targetX - bubble.x) * easing;
        bubble.y += (bubble.targetY - bubble.y) * easing;
        
        // 限制气泡在可视区域内
        bubble.x = Math.max(5, Math.min(95, bubble.x));
        bubble.y = Math.max(5, Math.min(95, bubble.y));
      });
      
      this.animationFrame = requestAnimationFrame(() => {
        this.animateBubbles();
      });
    },
    // 输入框聚焦效果
    onInputFocus(event) {
      const input = event.target.closest('.el-input');
      if (input) {
        input.classList.add('input-focused');
      }
    },
    // 输入框失焦效果
    onInputBlur(event) {
      const input = event.target.closest('.el-input');
      if (input) {
        input.classList.remove('input-focused');
      }
    },
    // 登录错误时的震动效果
    triggerShake() {
      this.shake = true;
      setTimeout(() => {
        this.shake = false;
      }, 500);
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          
          // 发送登录请求 - 使用URLSearchParams格式
          const formData = new URLSearchParams();
          formData.append('username', this.loginForm.username);
          formData.append('password', this.loginForm.password);
          
          console.log('发送登录请求:', {
            username: this.loginForm.username,
            url: '/api/auth/login'
          });
          
          this.$axios.post('/api/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })
          .then(response => {
            console.log('登录响应:', response);
            if (response.data && response.data.success) {
              this.$message.success('登录成功');
              // 保存session ID（如果需要）
              if (response.data.data) {
                localStorage.setItem('sessionId', response.data.data);
              }
              // 延迟跳转，显示成功动画
              setTimeout(() => {
                this.$router.push('/');
              }, 300);
            } else {
              const errorMsg = response.data?.errorMsg || response.data?.message || '登录失败';
              console.error('登录失败:', errorMsg);
              this.$message.error(errorMsg);
              this.triggerShake();
            }
          })
          .catch(error => {
            console.error('登录错误详情:', {
              error: error,
              response: error.response,
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
              config: error.config
            });
            
            if (error.response) {
              // 服务器返回了响应
              if (error.response.status === 401) {
                const errorMsg = error.response.data?.errorMsg || error.response.data?.message || '用户名或密码错误';
                this.$message.error(errorMsg);
                this.triggerShake();
              } else if (error.response.status === 403) {
                this.$message.error('访问被拒绝，请检查CORS配置');
                this.triggerShake();
              } else {
                const errorMsg = error.response.data?.errorMsg || error.response.data?.message || `登录失败 (${error.response.status})`;
                this.$message.error(errorMsg);
                this.triggerShake();
              }
            } else if (error.request) {
              // 请求已发出但没有收到响应
              console.error('网络错误，未收到响应:', error.request);
              this.$message.error('网络错误，无法连接到服务器，请检查网络连接');
              this.triggerShake();
            } else {
              // 请求配置出错
              console.error('请求配置错误:', error.message);
              this.$message.error('请求配置错误: ' + error.message);
              this.triggerShake();
            }
          })
          .finally(() => {
            this.loading = false;
          });
        } else {
          this.triggerShake();
          return false;
        }
      });
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 动态气泡容器 */
.bubbles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

/* 单个气泡 */
.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  pointer-events: none;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.15),
              inset 0 0 20px rgba(255, 255, 255, 0.1);
  transition: transform 0.1s ease-out, opacity 0.3s ease;
  will-change: transform;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

/* 气泡悬停效果 */
.bubble:hover {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.2);
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 50px 40px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.6s ease-out;
  transition: transform 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.login-box.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  animation: logoFloat 3s ease-in-out infinite;
}

.logo-icon i {
  font-size: 40px;
  color: white;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 10px;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-top: 30px;
}

.login-form .el-form-item {
  margin-bottom: 25px;
}

.login-form .el-input {
  font-size: 16px;
}

.login-form .el-input {
  transition: all 0.3s ease;
}

.login-form .animated-input .el-input__inner {
  height: 50px;
  border-radius: 8px;
  border: 2px solid #dcdfe6;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
}

.login-form .animated-input .el-input__inner:hover {
  border-color: #c0c4cc;
  background: #fff;
}

.login-form .animated-input.input-focused .el-input__inner,
.login-form .animated-input .el-input__inner:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  background: #fff;
  transform: translateY(-2px);
}

.login-form .animated-input .el-input__prefix {
  color: #909399;
  transition: color 0.3s;
}

.login-form .animated-input.input-focused .el-input__prefix {
  color: #667eea;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.login-button:hover::before {
  width: 300px;
  height: 300px;
}

.login-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
}

.login-button:active {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.4);
}

.login-button.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
  }
}

.login-button i {
  margin-right: 8px;
  transition: transform 0.3s;
}

.login-button:hover i {
  transform: translateX(5px);
}

.login-footer {
  margin-top: 30px;
  text-align: center;
}

.login-tip {
  font-size: 12px;
  color: #909399;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.login-tip i {
  font-size: 14px;
  animation: tipIconRotate 2s ease-in-out infinite;
}

@keyframes tipIconRotate {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: 15px;
  }
  
  .login-box {
    padding: 40px 30px;
    max-width: 95%;
    border-radius: 15px;
  }
  
  .logo-icon {
    width: 60px;
    height: 60px;
  }
  
  .logo-icon i {
    font-size: 30px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .login-form .animated-input .el-input__inner {
    height: 45px;
    font-size: 15px;
  }
  
  .login-button {
    height: 45px;
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }
  
  .login-box {
    padding: 30px 20px;
    border-radius: 12px;
  }
  
  .logo-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 15px;
  }
  
  .logo-icon i {
    font-size: 25px;
  }
  
  .login-title {
    font-size: 20px;
  }
  
  .login-subtitle {
    font-size: 12px;
  }
  
  .login-form .animated-input .el-input__inner {
    height: 42px;
    font-size: 14px;
  }
  
  .login-button {
    height: 42px;
    font-size: 14px;
  }
}

@media (max-width: 360px) {
  .login-box {
    padding: 25px 15px;
  }
  
  .login-title {
    font-size: 18px;
  }
}

/* 输入框动画效果 */
.login-form .el-form-item {
  animation: slideIn 0.5s ease-out;
  animation-fill-mode: both;
}

.login-form .el-form-item:nth-child(1) {
  animation-delay: 0.1s;
}

.login-form .el-form-item:nth-child(2) {
  animation-delay: 0.2s;
}

.login-form .el-form-item:nth-child(3) {
  animation-delay: 0.3s;
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
</style>

