// src/router/index.js
import Vue from 'vue'
import Router from 'vue-router'
import MapPage from '../views/MapPage.vue'
import PredictionPage from '../views/PredictionPage.vue'
import HourlyStatistics from '../views/HourlyStatistics.vue'
import DataVisualizationDashboard from '../views/DataVisualizationDashboard.vue'
import PatientListPage from '../views/PatientListPage.vue'
import KeyEventsDistributionPage from '../views/KeyEventsDistributionPage.vue'
import MapDataAnimation from '../components/MapDataAnimation.vue'
import DataImportPage from '../views/DataImportPage.vue'
import LoginPage from '../views/LoginPage.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/login',
      name: 'LoginPage',
      component: LoginPage,
      meta: { requiresAuth: false }
    },
  {
    path: '/',
    redirect: '/patient-list'
  },
  {
    path: '/map',
    name: 'MapPage',
      component: MapPage,
      meta: { requiresAuth: true }
  },
  {
    path: '/bigscreen',
    name: 'BigScreenDashboard',
      component: DataVisualizationDashboard,
      meta: { requiresAuth: true }
  },
  {
    path: '/hourly',
    name: 'HourlyStatistics',
      component: HourlyStatistics,
      meta: { requiresAuth: true }
  },
  {
    path: '/patient-list',
    name: 'PatientListPage',
      component: PatientListPage,
      meta: { requiresAuth: true }
  },
  {
    path: '/key-events-distribution',
    name: 'KeyEventsDistributionPage',
      component: KeyEventsDistributionPage,
      meta: { requiresAuth: true }
  },
  {
    path: '/monthly-heatmap',
    name: 'MapDataAnimation',
      component: MapDataAnimation,
      meta: { requiresAuth: true }
  },
  {
    path: '/data-import',
    name: 'DataImportPage',
      component: DataImportPage,
      meta: { requiresAuth: true }
  },
  {
    path: '/prediction',
    name: 'PredictionPage',
    component: PredictionPage,
    meta: { requiresAuth: true }
  }
]
})

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  // 如果路由需要认证
  if (to.meta.requiresAuth) {
    // 检查登录状态
    router.app.$axios.get('/api/auth/status')
      .then(response => {
        if (response.data.success) {
          // 已登录，允许访问
          next();
        } else {
          // 未登录，跳转到登录页
          next('/login');
        }
      })
      .catch(error => {
        // 请求失败，跳转到登录页
        console.error('检查登录状态失败:', error);
        next('/login');
      });
  } else {
    // 不需要认证的路由，直接访问
    next();
  }
})

export default router
