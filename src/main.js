// src/main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI);

// 配置axios
// 开发环境：http://localhost:9090（通过vue.config.js的proxy代理）
// 生产环境：空字符串（相对路径，由Nginx反向代理）
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL || '';
axios.defaults.withCredentials = true; // 允许携带凭证（cookie/session）

// 开发环境显示配置信息（仅开发环境）
if (process.env.NODE_ENV === 'development' && process.env.VUE_APP_DEBUG === 'true') {
  console.log('=== 前端环境配置 ===');
  console.log('环境:', process.env.VUE_APP_ENV || 'development');
  console.log('API地址:', axios.defaults.baseURL || '相对路径（Nginx代理）');
}

// 请求拦截器
axios.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理401未授权错误
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // 401未授权，跳转到登录页
      if (router.currentRoute.path !== '/login') {
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

Vue.prototype.$axios = axios;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
