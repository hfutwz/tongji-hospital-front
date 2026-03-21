<template>
  <div id="app">
    <!-- 导航菜单 -->
    <nav class="main-nav" v-if="showNavigation && $route.path !== '/login'">
      <div class="nav-container">
        <div class="nav-menu">
          <div class="nav-brand-title">
            <span>医院创伤数据可视化系统</span>
          </div>
          <router-link to="/bigscreen" class="nav-item" :class="{ active: $route.path === '/bigscreen' }">
            <i class="el-icon-monitor"></i>
            <span>后台可视化大屏</span>
          </router-link>
          <router-link to="/map" class="nav-item" :class="{ active: $route.path === '/map' }">
            <i class="el-icon-location"></i>
            <span>地图热力图</span>
          </router-link>
          <router-link to="/monthly-heatmap" class="nav-item" :class="{ active: $route.path === '/monthly-heatmap' }">
            <i class="el-icon-date"></i>
            <span>每月地图热力图</span>
          </router-link>
          <router-link to="/patient-list" class="nav-item" :class="{ active: $route.path === '/patient-list' }">
            <i class="el-icon-user"></i>
            <span>病人详情信息</span>
          </router-link>
          <router-link to="/hourly" class="nav-item" :class="{ active: $route.path === '/hourly' }">
            <i class="el-icon-time"></i>
            <span>患者数量统计</span>
          </router-link>
          <router-link to="/prediction" class="nav-item" :class="{ active: $route.path === '/prediction' }">
            <i class="el-icon-data-analysis"></i>
            <span>时空因导预测</span>
          </router-link>
          <!-- <router-link to="/key-events-distribution" class="nav-item" :class="{ active: $route.path === '/key-events-distribution' }">
            <i class="el-icon-data-analysis"></i>
            <span>关键事件分布</span>
          </router-link>
          <router-link to="/data-import" class="nav-item" :class="{ active: $route.path === '/data-import' }">
            <i class="el-icon-upload"></i>
            <span>数据导入</span>
          </router-link> -->
        </div>
        <div class="nav-actions">
          <!-- 错误通知（文件格式问题） -->
          <div class="error-notification-container" v-if="formatErrorCount > 0">
            <el-badge :value="formatErrorCount" :hidden="formatErrorCount === 0" class="error-badge">
              <el-button 
                icon="el-icon-warning" 
                circle 
                @click="toggleFormatErrorList"
                :class="{ 'has-errors': formatErrorCount > 0 }"
              ></el-button>
            </el-badge>
            <!-- 错误列表下拉菜单 -->
            <div v-if="showFormatErrorList" class="error-list-dropdown" @click.stop>
              <div class="error-list-header">
                <span>错误通知 - 文件格式问题 ({{ formatErrorCount }})</span>
                <el-button 
                  type="text" 
                  size="mini" 
                  @click="clearAllFormatErrors"
                  :disabled="formatErrorCount === 0"
                >
                  清空全部
                </el-button>
              </div>
              <div class="error-list-content">
                <div 
                  v-for="(error, index) in formatErrorNotifications" 
                  :key="index"
                  class="error-item"
                  @click="showFormatErrorDetail(error)"
                >
                  <div class="error-item-header">
                    <i class="el-icon-warning error-icon"></i>
                    <span class="error-time">{{ formatErrorTime(error.timestamp) }}</span>
                    <el-button 
                      type="text" 
                      size="mini" 
                      icon="el-icon-close"
                      @click.stop="removeFormatError(index)"
                      class="remove-error-btn"
                    ></el-button>
                  </div>
                  <div class="error-item-message">{{ error.message }}</div>
                  <div class="error-item-count">
                    共 {{ error.totalErrorCount || 0 }} 个错误
                  </div>
                </div>
                <div v-if="formatErrorNotifications.length === 0" class="no-errors">
                  暂无错误通知
                </div>
              </div>
            </div>
          </div>
          <!-- 错误数据列表（数据逻辑错误） -->
        <div class="logic-error-notification-container" v-if="logicErrorCount > 0">
          <el-badge :value="logicErrorCount" :hidden="logicErrorCount === 0" class="error-badge">
            <el-button 
              icon="el-icon-bell" 
              circle 
              @click="toggleLogicErrorList"
              :class="{ 'has-errors': logicErrorCount > 0 }"
            ></el-button>
          </el-badge>
          <!-- 数据逻辑错误列表下拉菜单 -->
          <div v-if="showLogicErrorList" class="error-list-dropdown" @click.stop>
            <div class="error-list-header">
              <span>错误通知 - 数据逻辑问题 ({{ logicErrorCount }})</span>
              <el-button 
                type="text" 
                size="mini" 
                @click="clearAllLogicErrors"
                :disabled="logicErrorCount === 0"
              >
                清空全部
              </el-button>
            </div>
            <div class="error-list-content">
              <div 
                v-for="(n, idx) in logicErrorNotifications" 
                :key="idx"
                class="error-item"
                @click="showErrorDialog = true; showLogicErrorList = false"
              >
                <div class="error-item-header">
                  <i class="el-icon-bell error-icon"></i>
                  <span class="error-time">{{ formatErrorTime(n.timestamp) }}</span>
                  <el-button 
                    type="text" 
                    size="mini" 
                    icon="el-icon-close"
                    @click.stop="removeLogicError(idx)"
                    class="remove-error-btn"
                  ></el-button>
                </div>
                <div class="error-item-message">{{ n.message }}</div>
              </div>
              <div v-if="logicErrorNotifications.length === 0" class="no-errors">
                暂无错误通知
              </div>
            </div>
          </div>
        </div>
          <el-button size="small" @click="toggleFullscreen">
            <i :class="showNavigation ? 'el-icon-full-screen' : 'el-icon-copy-document'"></i>
          </el-button>
          <el-button size="small" @click="showSettings">
            <i class="el-icon-setting"></i>
          </el-button>
        </div>
      </div>
    </nav>
    
    <!-- 主要内容区域 -->
    <main class="main-content" :class="{ 'with-nav': showNavigation }">
      <!-- 全屏模式下的退出按钮和错误通知 -->
      <div v-if="!showNavigation" class="fullscreen-controls">
        <!-- 错误通知（文件格式问题） -->
        <div class="error-notification-container-fullscreen" v-if="formatErrorCount > 0">
          <el-badge :value="formatErrorCount" :hidden="formatErrorCount === 0" class="error-badge">
            <el-button 
              icon="el-icon-warning" 
              circle 
              @click="toggleFormatErrorList"
              :class="{ 'has-errors': formatErrorCount > 0 }"
            ></el-button>
          </el-badge>
          <!-- 错误列表下拉菜单 -->
          <div v-if="showFormatErrorList" class="error-list-dropdown" @click.stop>
            <div class="error-list-header">
              <span>错误通知 - 文件格式问题 ({{ formatErrorCount }})</span>
              <el-button 
                type="text" 
                size="mini" 
                @click="clearAllFormatErrors"
                :disabled="formatErrorCount === 0"
              >
                清空全部
              </el-button>
            </div>
            <div class="error-list-content">
              <div 
                v-for="(error, index) in formatErrorNotifications" 
                :key="index"
                class="error-item"
                @click="showFormatErrorDetail(error)"
              >
                <div class="error-item-header">
                  <i class="el-icon-warning error-icon"></i>
                  <span class="error-time">{{ formatErrorTime(error.timestamp) }}</span>
                  <el-button 
                    type="text" 
                    size="mini" 
                    icon="el-icon-close"
                    @click.stop="removeFormatError(index)"
                    class="remove-error-btn"
                  ></el-button>
                </div>
                <div class="error-item-message">{{ error.message }}</div>
                <div class="error-item-count">
                  共 {{ error.totalErrorCount || 0 }} 个错误
                </div>
              </div>
              <div v-if="formatErrorNotifications.length === 0" class="no-errors">
                暂无错误通知
              </div>
            </div>
          </div>
        </div>
        <!-- 错误数据列表（数据逻辑错误） -->
        <div class="error-notification-fullscreen logic-error-notification" @click="showErrorDialog = true" v-if="errorCount > 0">
          <el-badge :value="errorCount" class="notification-badge">
            <i class="el-icon-bell notification-icon logic-icon"></i>
          </el-badge>
          <span class="notification-text">错误数据列表</span>
        </div>
        <!-- 退出全屏按钮 -->
        <div class="exit-fullscreen-btn" @click="toggleFullscreen">
          <i class="el-icon-copy-document"></i>
          <span>退出全屏</span>
        </div>
      </div>
      <router-view></router-view>
    </main>
    
    <!-- 错误详情对话框 -->
    <el-dialog
      title="错误详情"
      :visible.sync="showFormatErrorDetailDialog"
      width="80%"
      :before-close="closeFormatErrorDetailDialog"
    >
      <div v-if="currentFormatErrorDetail">
        <div class="error-detail-header">
          <el-alert
            :title="`导入失败：${currentFormatErrorDetail.message}`"
            type="error"
            :description="`共发现 ${currentFormatErrorDetail.totalErrorCount || 0} 个错误`"
            show-icon
            :closable="false"
          ></el-alert>
        </div>
          <div v-if="(currentFormatErrorDetail.errors && currentFormatErrorDetail.errors.length > 0) || currentFormatErrorDetail.errorExportUrl" style="margin: 10px 0;">
            <el-button type="primary" size="mini" @click="exportFormatErrorCsv">
              <i class="el-icon-download"></i>
              {{ currentFormatErrorDetail.errorExportUrl ? '下载完整错误报告' : '导出错误CSV' }}
            </el-button>
            <span v-if="currentFormatErrorDetail.hasMoreErrors" style="margin-left: 10px; color: #E6A23C; font-size: 12px;">
              <i class="el-icon-warning"></i>
              错误数量过多，已生成完整错误报告文件
            </span>
          </div>
        <div v-if="currentFormatErrorDetail.errors && currentFormatErrorDetail.errors.length > 0" class="error-detail-table">
          <el-table :data="currentFormatErrorDetail.errors" border stripe max-height="400">
            <el-table-column prop="row" label="行号" width="80" align="center"></el-table-column>
            <el-table-column prop="patientId" label="患者ID" width="100" align="center"></el-table-column>
            <el-table-column prop="field" label="字段" width="150"></el-table-column>
            <el-table-column prop="value" label="错误值" width="150"></el-table-column>
            <el-table-column prop="message" label="错误原因" show-overflow-tooltip></el-table-column>
          </el-table>
        </div>
        <div v-if="currentFormatErrorDetail.tables" class="error-detail-tables">
          <h4>各表验证结果</h4>
          <div class="tables-status">
            <div v-for="(tableResult, tableName) in currentFormatErrorDetail.tables" :key="tableName" class="table-status-item">
              <span class="table-name">{{ tableResult.tableLabel || tableName }}</span>
              <span :class="['table-status', tableResult.valid ? 'valid' : 'invalid']">
                {{ tableResult.valid ? '✓ 通过' : '✗ 失败' }}
                <span v-if="!tableResult.valid && tableResult.errorCount > 0">
                  ({{ tableResult.errorCount }} 个错误)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 全局错误数据对话框（数据逻辑错误） -->
    <!-- 数据逻辑错误通知下拉 -->
    <el-dialog
      title="错误数据列表 - 数据逻辑错误"
      :visible.sync="showErrorDialog"
      width="80%"
      :before-close="handleCloseErrorDialog"
    >
      <div class="error-dialog-content">
        <div class="error-summary logic-error-summary">
          <p>共发现 <strong>{{ errorCount }}</strong> 条错误数据（时间差超过48小时或为负数）</p>
        </div>
        <el-table
          :data="errorData"
          stripe
          border
          style="width: 100%"
          max-height="500"
        >
          <el-table-column prop="patientId" label="患者ID" width="100" align="center"></el-table-column>
          <el-table-column prop="eventName" label="事件名称" width="120" align="center"></el-table-column>
          <el-table-column prop="admissionTime" label="入室时间" width="180" align="center"></el-table-column>
          <el-table-column prop="eventTime" label="事件时间" width="180" align="center"></el-table-column>
          <el-table-column prop="timeDifferenceMinutes" label="时间差(分钟)" width="130" align="center">
            <template slot-scope="scope">
              <span :class="scope.row.timeDifferenceMinutes < 0 ? 'negative-value' : 'large-value'">
                {{ scope.row.timeDifferenceMinutes }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="errorReason" label="错误原因" min-width="200"></el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showErrorDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportErrorData">导出错误数据</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      showNavigation: true,
      // 全局错误数据状态（数据逻辑错误）
      errorData: [],
      errorCount: 0,
      showErrorDialog: false,
      // 文件格式错误通知状态
      formatErrorNotifications: [],
      formatErrorCount: 0,
      showFormatErrorList: false,
      showFormatErrorDetailDialog: false,
      currentFormatErrorDetail: null,
      // 数据逻辑错误通知状态
      logicErrorNotifications: [],
      logicErrorCount: 0,
      showLogicErrorList: false
    }
  },
  mounted() {
    // 添加键盘事件监听
    document.addEventListener('keydown', this.handleKeydown);
    
    // 添加点击外部关闭下拉菜单的监听
    document.addEventListener('click', this.handleClickOutside);
    
    // 将全局错误数据管理方法暴露到 $root，供子组件调用
    this.$root.updateErrorData = this.updateErrorData;
    this.$root.clearErrorData = this.clearErrorData;
    
    // 加载文件格式错误通知
    this.loadFormatErrorNotifications();
    // 加载数据逻辑错误通知
    this.loadLogicErrorNotifications();
    
    // 定期检查文件格式错误通知（每5秒检查一次）
    this.formatErrorCheckInterval = setInterval(() => {
      this.loadFormatErrorNotifications();
      this.loadLogicErrorNotifications();
    }, 5000);

    // 将记录数据逻辑错误的方法暴露，供子组件调用
    this.$root.addLogicErrorNotification = this.addLogicErrorNotification;
  },
  beforeDestroy() {
    // 移除键盘事件监听
    document.removeEventListener('keydown', this.handleKeydown);
    
    // 移除点击外部关闭下拉菜单的监听
    document.removeEventListener('click', this.handleClickOutside);
    
    // 清除定时器
    if (this.formatErrorCheckInterval) {
      clearInterval(this.formatErrorCheckInterval);
    }
  },
  methods: {
    toggleFullscreen() {
      this.showNavigation = !this.showNavigation;
    },
    showSettings() {
      this.$message.info('设置功能开发中...');
    },
    handleKeydown(event) {
      // ESC键退出全屏
      if (event.key === 'Escape' && !this.showNavigation) {
        this.showNavigation = true;
      }
    },
    /**
     * 更新全局错误数据（供子组件调用）
     */
    updateErrorData(errorData, errorCount) {
      this.errorData = errorData || [];
      this.errorCount = errorCount || 0;
      if (this.errorCount > 0) {
        const message = `发现 ${this.errorCount} 条错误数据，已记录到文件并可在导航栏通知中查看`;
        this.addLogicErrorNotification(message);
      }
    },
    /**
     * 清空全局错误数据（供子组件调用）
     */
    clearErrorData() {
      this.errorData = [];
      this.errorCount = 0;
    },
    /**
     * 关闭错误数据对话框
     */
    handleCloseErrorDialog() {
      this.showErrorDialog = false;
    },
    /**
     * 导出错误数据
     */
    exportErrorData() {
      // 这里可以实现导出功能，或者提示用户文件已保存在服务器
      this.$message.info('错误数据已自动保存到服务器文件：key_events_error_data.txt');
    },
    /**
     * 导出文件格式错误为CSV
     * 优先使用服务器上的错误文件（包含所有错误），如果没有则使用前端生成的CSV
     */
    exportFormatErrorCsv() {
      if (!this.currentFormatErrorDetail) {
        this.$message.warning('没有可导出的错误数据');
        return;
      }
      
      // 优先使用服务器上的错误文件URL（包含所有错误）
      if (this.currentFormatErrorDetail.errorExportUrl) {
        try {
          // 使用服务器上的错误文件URL
          const serverUrl = this.currentFormatErrorDetail.errorExportUrl;
          // 如果是相对路径，需要加上baseURL
          const fullUrl = serverUrl.startsWith('http') ? serverUrl : (this.$axios.defaults.baseURL || '') + serverUrl;
          window.open(fullUrl, '_blank');
          this.$message.success('正在下载错误报告文件...');
          return;
        } catch (err) {
          console.error('下载服务器错误文件失败:', err);
          this.$message.warning('下载服务器错误文件失败，尝试使用本地生成的文件');
        }
      }
      
      // 如果没有服务器文件URL，使用前端生成的CSV（可能只包含部分错误）
      if (!this.currentFormatErrorDetail.errors || this.currentFormatErrorDetail.errors.length === 0) {
        this.$message.warning('没有可导出的错误数据');
        return;
      }
      
      try {
        const url = this.buildErrorsCsvBlobUrl(this.currentFormatErrorDetail.errors);
        if (!url) {
          this.$message.error('生成CSV失败');
          return;
        }
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const MM = String(now.getMinutes()).padStart(2, '0');
        a.download = `import_errors_${yyyy}${mm}${dd}_${HH}${MM}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.$message.info('已导出错误数据（注意：如果错误数量超过限制，此文件可能只包含部分错误，请使用服务器上的完整错误文件）');
      } catch (err) {
        console.error('导出CSV失败:', err);
        this.$message.error('导出失败');
      }
    },
    /**
     * 构建错误CSV并返回Blob URL
     */
    buildErrorsCsvBlobUrl(errors) {
      try {
        const headers = ['行号', '患者ID', '字段', '错误值', '错误原因'];
        const rows = (errors || []).map(e => {
          const esc = v => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
          };
          return [esc(e.row), esc(e.patientId), esc(e.field), esc(e.value), esc(e.message)].join(',');
        });
        const BOM = '\ufeff';
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error('生成错误CSV失败:', err);
        return null;
      }
    },
    /**
     * 加载文件格式错误通知
     */
    loadFormatErrorNotifications() {
      try {
        const stored = localStorage.getItem('importErrorNotifications');
        if (stored) {
          this.formatErrorNotifications = JSON.parse(stored);
          this.formatErrorCount = this.formatErrorNotifications.length;
        } else {
          this.formatErrorNotifications = [];
          this.formatErrorCount = 0;
        }
      } catch (error) {
        console.error('加载文件格式错误通知失败:', error);
        this.formatErrorNotifications = [];
        this.formatErrorCount = 0;
      }
    },
    /**
     * 切换文件格式错误列表显示
     */
    toggleFormatErrorList() {
      this.showFormatErrorList = !this.showFormatErrorList;
    },
    
    /**
     * 点击外部关闭下拉菜单
     */
    handleClickOutside(event) {
      // 如果点击的不是错误通知容器，则关闭错误列表
      const isFormatArea = event.target.closest('.error-notification-container');
      const isLogicArea = event.target.closest('.logic-error-notification-container');
      if (!isFormatArea) {
        this.showFormatErrorList = false;
      }
      if (!isLogicArea) {
        this.showLogicErrorList = false;
      }
    },
    
    /**
     * 显示文件格式错误详情
     */
    showFormatErrorDetail(error) {
      this.currentFormatErrorDetail = error;
      this.showFormatErrorDetailDialog = true;
      this.showFormatErrorList = false;
    },
    
    /**
     * 关闭文件格式错误详情对话框
     */
    closeFormatErrorDetailDialog() {
      this.showFormatErrorDetailDialog = false;
      this.currentFormatErrorDetail = null;
    },
    /**
     * 移除单个文件格式错误通知
     */
    removeFormatError(index) {
      this.formatErrorNotifications.splice(index, 1);
      this.saveFormatErrorNotifications();
      this.formatErrorCount = this.formatErrorNotifications.length;
    },
    /**
     * 清空所有文件格式错误通知
     */
    clearAllFormatErrors() {
      this.formatErrorNotifications = [];
      this.saveFormatErrorNotifications();
      this.formatErrorCount = 0;
      this.showFormatErrorList = false;
    },
    /**
     * 保存文件格式错误通知到localStorage
     */
    saveFormatErrorNotifications() {
      try {
        localStorage.setItem('importErrorNotifications', JSON.stringify(this.formatErrorNotifications));
      } catch (error) {
        console.error('保存文件格式错误通知失败:', error);
      }
    },
    /**
     * 加载数据逻辑错误通知
     */
    loadLogicErrorNotifications() {
      try {
        const stored = localStorage.getItem('logicErrorNotifications');
        if (stored) {
          this.logicErrorNotifications = JSON.parse(stored);
          this.logicErrorCount = this.logicErrorNotifications.length;
        } else {
          this.logicErrorNotifications = [];
          this.logicErrorCount = 0;
        }
      } catch (error) {
        console.error('加载数据逻辑错误通知失败:', error);
        this.logicErrorNotifications = [];
        this.logicErrorCount = 0;
      }
    },
    addLogicErrorNotification(message) {
      try {
        const stored = localStorage.getItem('logicErrorNotifications');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          timestamp: Date.now(),
          message: message || '发现错误数据，已记录并可在导航栏查看'
        });
        while (list.length > 20) list.pop();
        localStorage.setItem('logicErrorNotifications', JSON.stringify(list));
        this.logicErrorNotifications = list;
        this.logicErrorCount = list.length;
      } catch (e) {
        console.error('记录数据逻辑错误通知失败:', e);
      }
    },
    toggleLogicErrorList() {
      this.showLogicErrorList = !this.showLogicErrorList;
    },
    removeLogicError(index) {
      this.logicErrorNotifications.splice(index, 1);
      this.saveLogicErrorNotifications();
      this.logicErrorCount = this.logicErrorNotifications.length;
    },
    clearAllLogicErrors() {
      this.logicErrorNotifications = [];
      this.saveLogicErrorNotifications();
      this.logicErrorCount = 0;
      this.showLogicErrorList = false;
    },
    saveLogicErrorNotifications() {
      try {
        localStorage.setItem('logicErrorNotifications', JSON.stringify(this.logicErrorNotifications));
      } catch (error) {
        console.error('保存数据逻辑错误通知失败:', error);
      }
    },
    /**
     * 格式化错误时间
     */
    formatErrorTime(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
      } else {
        return date.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  }
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航菜单样式 */
.main-nav {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;
}

.nav-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 60px;
  position: relative;
}

.nav-menu {
  display: flex;
  gap: 15px;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  flex: 1;
}

.nav-brand-title {
  cursor: default;
  font-weight: bold;
  font-size: 24px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  margin-right: 20px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item i {
  margin-right: 8px;
  font-size: 16px;
}

.nav-actions {
  display: flex;
  gap: 10px;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.nav-actions .el-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s ease;
}

.nav-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* 错误通知样式 */
.error-notification-container {
  position: relative;
  margin-right: 10px;
}

.error-badge {
  position: relative;
}

.error-badge .el-button.has-errors {
  color: #f56c6c;
}

.error-badge .el-button.has-errors:hover {
  color: #f78989;
}

.error-list-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 400px;
  max-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.error-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.error-list-content {
  max-height: 400px;
  overflow-y: auto;
}

.error-item {
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s;
}

.error-item:hover {
  background-color: #f8f9fa;
}

.error-item:last-child {
  border-bottom: none;
}

.error-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.error-icon {
  color: #f56c6c;
  font-size: 16px;
}

.error-time {
  flex: 1;
  font-size: 12px;
  color: #909399;
}

.remove-error-btn {
  padding: 0;
  color: #909399;
  font-size: 14px;
}

.remove-error-btn:hover {
  color: #f56c6c;
}

.error-item-message {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
  font-weight: 500;
}

.error-item-count {
  font-size: 12px;
  color: #909399;
}

.no-errors {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 错误详情对话框样式 */
.error-detail-header {
  margin-bottom: 20px;
}

.error-detail-table {
  margin-top: 20px;
}

.error-detail-tables {
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.error-detail-tables h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.tables-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.table-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.table-name {
  font-weight: 500;
  color: #333;
}

.table-status {
  font-size: 14px;
  font-weight: 500;
}

.table-status.valid {
  color: #67c23a;
}

.table-status.invalid {
  color: #f56c6c;
}

/* 错误数据通知样式（数据逻辑错误） */
.error-notification {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-right: 10px;
}

.error-notification:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

/* 数据逻辑错误通知样式 */
.logic-error-notification .logic-icon {
  font-size: 20px;
  color: #ffd700;
}

.logic-error-notification .notification-text {
  color: #ffd700;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.notification-icon {
  font-size: 20px;
}

.notification-text {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.notification-badge {
  line-height: 1;
}

/* 错误数据对话框样式 */
.error-dialog-content {
  padding: 10px 0;
}

.error-summary {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 4px;
}

.format-error-summary {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}

.format-error-summary p {
  margin: 0;
  color: #f56c6c;
}

.logic-error-summary {
  background: #fef9e7;
  border: 1px solid #fde68a;
}

.logic-error-summary p {
  margin: 0;
  color: #E6A23C;
}

.negative-value {
  color: #f56c6c;
  font-weight: 600;
}

.large-value {
  color: #E6A23C;
  font-weight: 600;
}

/* 文件格式错误列表样式 */
.format-error-list {
  max-height: 500px;
  overflow-y: auto;
}

.format-error-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  background: #fef0f0;
  transition: all 0.3s;
}

.format-error-item:hover {
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.format-error-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.format-error-icon {
  color: #f56c6c;
  font-size: 18px;
}

.format-error-time {
  flex: 1;
  color: #909399;
  font-size: 12px;
}

.remove-error-btn {
  color: #909399;
  padding: 0;
}

.remove-error-btn:hover {
  color: #f56c6c;
}

.format-error-item-message {
  color: #f56c6c;
  font-weight: 500;
  margin-bottom: 8px;
}

.format-error-item-count {
  color: #909399;
  font-size: 12px;
  margin-bottom: 10px;
}

.format-error-details {
  margin-top: 10px;
}

.more-errors {
  margin-top: 10px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
  text-align: center;
}

.no-errors {
  text-align: center;
  padding: 40px;
  color: #909399;
  font-size: 14px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  min-height: calc(100vh - 60px);
}

.main-content.with-nav {
  min-height: calc(100vh - 60px);
}

/* 全屏模式下的控制按钮容器 */
.fullscreen-controls {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}

/* 退出全屏按钮样式 */
.exit-fullscreen-btn {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.exit-fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.exit-fullscreen-btn i {
  font-size: 16px;
}

/* 全屏模式下的错误通知容器样式 */
.error-notification-container-fullscreen {
  position: relative;
}

.error-notification-container-fullscreen .error-badge .el-button.has-errors {
  background: rgba(245, 108, 108, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.error-notification-container-fullscreen .error-badge .el-button.has-errors:hover {
  background: rgba(245, 108, 108, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.error-notification-container-fullscreen .error-list-dropdown {
  top: 60px;
  right: 0;
}

/* 全屏模式下的错误通知样式 */
.error-notification-fullscreen {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.error-notification-fullscreen:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 全屏模式下的数据逻辑错误通知 */
.logic-error-notification.error-notification-fullscreen {
  background: rgba(230, 162, 60, 0.9);
  color: white;
}

.logic-error-notification.error-notification-fullscreen:hover {
  background: rgba(230, 162, 60, 1);
}

.logic-error-notification.error-notification-fullscreen .notification-icon {
  color: white;
  font-size: 18px;
}

.logic-error-notification.error-notification-fullscreen .notification-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
    flex-wrap: wrap;
    height: auto;
    min-height: 60px;
  }
  
  .nav-menu {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 10px;
    gap: 10px;
  }
  
  .nav-actions {
    order: 2;
  }
  
  .nav-brand {
    order: 1;
    font-size: 16px;
  }
  
  .nav-item {
    padding: 6px 12px;
    font-size: 14px;
  }
  
  .main-content.with-nav {
    min-height: calc(100vh - 80px);
  }
}

@media (max-width: 480px) {
  .nav-container {
    flex-direction: column;
    height: auto;
    padding: 10px 15px;
  }
  
  .nav-menu {
    order: 2;
    width: 100%;
    justify-content: space-around;
    margin: 10px 0;
  }
  
  .nav-actions {
    order: 3;
    width: 100%;
    justify-content: center;
  }
  
  .nav-brand {
    order: 1;
    margin-bottom: 10px;
  }
}
</style>
