<template>
  <div class="patient-list-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>病人详情信息</h1>
      <div class="header-actions">
        <button @click="goBack" class="back-btn">
          <i class="el-icon-arrow-left"></i>
          返回地图
        </button>
      </div>
    </div>

    <!-- 查询条件区域 -->
    <div class="search-form">
      <div class="form-row">
        <div class="form-group">
          <label>患者ID：</label>
          <input v-model="searchForm.patientId" type="number" placeholder="请输入患者ID" />
        </div>
        <div class="form-group">
          <label>性别：</label>
          <select v-model="searchForm.gender">
            <option value="">全部</option>
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div class="form-group">
          <label>年龄范围：</label>
          <input v-model="searchForm.minAge" type="number" placeholder="最小年龄" />
          <span>-</span>
          <input v-model="searchForm.maxAge" type="number" placeholder="最大年龄" />
        </div>
        <div class="form-group">
          <button @click="searchPatients" class="search-btn">查询</button>
          <button @click="resetSearch" class="reset-btn">重置</button>
          <button @click="showImportModal" class="import-btn">批量导入</button>
          <button 
            @click="handleBatchDelete" 
            class="batch-delete-btn" 
            :disabled="selectedPatients.length === 0"
          >
            批量删除 ({{ selectedPatients.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- 患者列表表格 -->
    <table class="patient-table">
      <thead>
        <tr>
          <th>
            <input 
              type="checkbox" 
              :checked="isAllSelected" 
              @change="toggleSelectAll"
              class="select-all-checkbox"
            />
          </th>
          <th>ID</th>
          <th>年龄</th>
          <th>性别</th>
          <th>身高</th>
          <th>体重</th>
          <th>绿色通道</th>
          <th>地址</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="patient in patients" :key="patient.patientId">
          <td>
            <input 
              type="checkbox" 
              :value="patient.patientId"
              v-model="selectedPatients"
              class="patient-checkbox"
            />
          </td>
          <td>{{ patient.patientId }}</td>
          <td>{{ patient.age }}</td>
          <td>{{ patient.gender }}</td>
          <td>{{ patient.height }}</td>
          <td>{{ patient.weight }}</td>
          <td>{{ patient.isGreenChannel ? '是' : '否' }}</td>
          <td class="address-cell">{{ patient.injuryLocation || '未填写' }}</td>
          <td>
            <button @click="showEditDialog(patient)" class="edit-btn">编辑</button>
            <button @click="showInjuryModal(patient)">查看受伤程度</button>
            <button @click="fetchInterventionData(patient)">查看干预时间</button>
            <button @click="showGcsModal(patient)">GCS评分</button>
            <button @click="showRtsModal(patient)">RTS评分</button>
            <button @click="showOnAdmissionModal(patient)">入室前信息</button>
            <button @click="showOffAdmissionModal(patient)">离室后信息</button>
            <button @click="handleDelete(patient)" class="delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 分页组件 -->
    <div class="pagination">
      <div class="pagination-left">
        <div class="pagination-info">
          共 {{ total }} 条记录，第 {{ current }} / {{ pages }} 页
        </div>
        <div class="page-size-selector">
          <label>每页显示：</label>
          <select v-model="size" @change="handlePageSizeChange" class="page-size-select">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
          </select>
        </div>
      </div>
      <div class="pagination-controls">
        <button 
          @click="goToPage(1)" 
          :disabled="current === 1"
          class="page-btn"
        >
          首页
        </button>
        <button 
          @click="goToPage(current - 1)" 
          :disabled="current === 1"
          class="page-btn"
        >
          上一页
        </button>
        <span class="page-numbers">
          <!-- 显示第一页 -->
          <button 
            v-if="showFirstPage"
            @click="goToPage(1)"
            :class="['page-btn', { active: current === 1 }]"
          >
            1
          </button>
          <!-- 前省略号 -->
          <span v-if="showFrontEllipsis" class="page-ellipsis">...</span>
          <!-- 显示中间页码 -->
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            :class="['page-btn', { active: page === current }]"
          >
            {{ page }}
          </button>
          <!-- 后省略号 -->
          <span v-if="showBackEllipsis" class="page-ellipsis">...</span>
          <!-- 显示最后一页 -->
          <button 
            v-if="showLastPage"
            @click="goToPage(pages)"
            :class="['page-btn', { active: current === pages }]"
          >
            {{ pages }}
          </button>
        </span>
        <button 
          @click="goToPage(current + 1)" 
          :disabled="current === pages"
          class="page-btn"
        >
          下一页
        </button>
        <button 
          @click="goToPage(pages)" 
          :disabled="current === pages"
          class="page-btn"
        >
          末页
        </button>
        <div class="page-jump">
          <span>跳转到</span>
          <input 
            type="number" 
            v-model.number="jumpPage" 
            :min="1" 
            :max="pages"
            @keyup.enter="handleJumpPage"
            class="page-jump-input"
          />
          <span>页</span>
          <button @click="handleJumpPage" class="page-jump-btn">确定</button>
        </div>
      </div>
    </div>

    <!-- 受伤弹窗 -->
    <InjuryFigureModal
      v-if="showModal"
      :patient="currentPatient"
      @close="closeModal"
    />

    <!-- 时间线弹窗 -->
    <intervention-timeline-dialog
      v-if="showTimeline"
      :patient-id="selectedPatientData.patientId"
      @close="closeTimeline"
    />

    <!-- GCS评分弹窗 -->
    <GcsScoreModal
      v-if="showGcsModalFlag"
      :patient="currentGcsPatient"
      @close="closeGcsModal"
    />

    <!-- RTS评分弹窗 -->
    <RtsScoreModal
      v-if="showRtsModalFlag"
      :patient="currentRtsPatient"
      @close="closeRtsModal"
    />

    <!-- 入室前信息弹窗 -->
    <PatientOnAdmissionModal
      v-if="showOnAdmissionModalFlag"
      :patient="currentOnAdmissionPatient"
      @close="closeOnAdmissionModal"
    />

    <!-- 离室后信息弹窗 -->
    <PatientOffAdmissionModal
      v-if="showOffAdmissionModalFlag"
      :patient="currentOffAdmissionPatient"
      @close="closeOffAdmissionModal"
    />

    <!-- 批量导入弹窗 -->
    <div v-if="showImportModalFlag" class="modal-overlay" @click="closeImportModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>批量导入患者信息</h3>
          <button @click="closeImportModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="upload-area" 
               @dragover.prevent 
               @drop.prevent="handleFileDrop"
               :class="{ 'drag-over': isDragOver }"
               @dragenter="isDragOver = true"
               @dragleave="isDragOver = false">
            <input 
              ref="fileInput" 
              type="file" 
              accept=".xlsx,.xls" 
              @change="handleFileSelect"
              style="display: none"
            />
            <div v-if="!selectedFile" class="upload-placeholder">
              <i class="upload-icon">📁</i>
              <p>点击选择文件或拖拽文件到此处</p>
              <p class="upload-hint">支持 .xlsx 和 .xls 格式</p>
            </div>
            <div v-else class="file-info">
              <i class="file-icon">📄</i>
              <div class="file-details">
                <p class="file-name">{{ selectedFile.name }}</p>
                <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              </div>
              <button @click="removeFile" class="remove-btn">删除</button>
            </div>
          </div>
          
          <div class="import-actions">
            <button @click="triggerFileSelect" class="select-btn">选择文件</button>
            <button @click="importFile" :disabled="!selectedFile || isImporting" class="import-btn">
              {{ isImporting ? '导入中...' : '开始导入' }}
            </button>
          </div>
          
          <div v-if="importResult" class="import-result" :class="importResult.success ? 'success' : 'error'">
            <h4>{{ importResult.success ? '导入成功' : '导入失败' }}</h4>
            <p>{{ importResult.message }}</p>
            <div v-if="importResult.success && importResult.data" class="result-details">
              <p>文件名: {{ importResult.data.fileName }}</p>
              <p>文件大小: {{ formatFileSize(importResult.data.fileSize) }}</p>
            </div>
            <div v-if="!importResult.success && importResult.errors && importResult.errors.length > 0" class="error-details">
              <h5>错误详情（共 {{ importResult.totalErrorCount || importResult.errors.length }} 个错误）</h5>
              <div v-if="importResult.errorExportUrl || importResult.clientErrorExportUrl" style="margin: 8px 0;">
                <!-- 导出错误CSV按钮已移动到 App.vue 错误详情处 -->
              </div>
              <div class="errors-table-container">
                <table class="errors-table">
                  <thead>
                    <tr>
                      <th>行号</th>
                      <th>患者ID</th>
                      <th>字段</th>
                      <th>错误值</th>
                      <th>错误原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(error, index) in importResult.errors" :key="index">
                      <td>{{ error.row }}</td>
                      <td>{{ error.patientId }}</td>
                      <td>{{ error.field }}</td>
                      <td>{{ error.value }}</td>
                      <td>{{ error.message }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="!importResult.success && importResult.tables" class="table-results">
              <h5>各表验证结果</h5>
              <div class="tables-status">
                <div v-for="(tableResult, tableName) in importResult.tables" :key="tableName" class="table-status-item">
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
        </div>
      </div>
    </div>

    <!-- 导入加载提示 -->
    <ImportLoadingModal
      :is-visible="showImportLoading"
      :progress="importProgress"
      :can-cancel="canCancelImport"
      @cancel="cancelImport"
    />

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay delete-modal-overlay" @click="handleOverlayClick">
      <div class="modal-content delete-dialog" :class="{ 'is-deleting': isDeleting }" @click.stop>
        <div class="delete-dialog-header">
          <div class="delete-icon-wrapper">
            <svg class="delete-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
          </div>
          <h3 class="delete-dialog-title">
            <span v-if="isDeleting">正在删除...</span>
            <span v-else>确认删除</span>
          </h3>
          <button 
            @click="closeDeleteDialog" 
            class="close-btn" 
            :disabled="isDeleting"
            :title="isDeleting ? '删除进行中，无法关闭' : '关闭'"
          >
            &times;
          </button>
        </div>
        
        <div class="delete-dialog-body">
          <div class="delete-warning-box">
            <div class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
              </svg>
            </div>
            <div class="warning-content">
              <p class="delete-confirm-text">
                <span v-if="isBatchDelete">
                  您即将删除 <span class="highlight-count">{{ patientsToDelete.length }}</span> 位患者的所有信息
                </span>
                <span v-else>
                  您即将删除患者 <span class="highlight-id">ID: {{ patientToDelete?.patientId }}</span> 的所有信息
                </span>
              </p>
              <p class="warning-text">
                <svg class="warning-icon-small" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor"/>
                </svg>
                此操作不可恢复，请谨慎操作！
              </p>
            </div>
          </div>

          <!-- 批量删除时显示患者列表预览 -->
          <div v-if="isBatchDelete && patientsToDelete.length > 0" class="patient-preview-list">
            <div class="preview-header">
              <span class="preview-title">待删除患者列表：</span>
              <span class="preview-count">共 {{ patientsToDelete.length }} 位</span>
            </div>
            <div class="patient-list-container">
              <div 
                v-for="patient in patientsToDelete.slice(0, 5)" 
                :key="patient.patientId"
                class="patient-preview-item"
              >
                <div class="patient-preview-avatar">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                </div>
                <div class="patient-preview-info">
                  <div class="patient-preview-id">ID: {{ patient.patientId }}</div>
                  <div class="patient-preview-details">
                    <span v-if="patient.gender">{{ patient.gender }}</span>
                    <span v-if="patient.age">{{ patient.age }}岁</span>
                  </div>
                </div>
              </div>
              <div v-if="patientsToDelete.length > 5" class="patient-preview-more">
                还有 {{ patientsToDelete.length - 5 }} 位患者...
              </div>
            </div>
          </div>

          <!-- 单个删除时显示患者详情 -->
          <div v-else-if="!isBatchDelete && patientToDelete" class="patient-detail-preview">
            <div class="patient-detail-card">
              <div class="patient-detail-avatar">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                </svg>
              </div>
              <div class="patient-detail-info">
                <div class="patient-detail-id">患者 ID: {{ patientToDelete.patientId }}</div>
                <div class="patient-detail-meta">
                  <span v-if="patientToDelete.gender" class="detail-tag">{{ patientToDelete.gender }}</span>
                  <span v-if="patientToDelete.age" class="detail-tag">{{ patientToDelete.age }}岁</span>
                  <span v-if="patientToDelete.height" class="detail-tag">身高: {{ patientToDelete.height }}cm</span>
                  <span v-if="patientToDelete.weight" class="detail-tag">体重: {{ patientToDelete.weight }}kg</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 删除进度条（批量删除时显示） -->
          <div v-if="isDeleting && isBatchDelete" class="delete-progress-container">
            <div class="delete-progress-info">
              <p class="progress-text">
                正在删除患者数据，请勿关闭窗口...
              </p>
              <p class="progress-count">
                已删除 {{ deleteProgress.current }} / {{ deleteProgress.total }} 位患者
              </p>
            </div>
            <div class="delete-progress-bar-wrapper">
              <div class="delete-progress-bar">
                <div 
                  class="delete-progress-bar-fill" 
                  :style="{ width: deleteProgress.percentage + '%' }"
                ></div>
              </div>
              <span class="delete-progress-percentage">{{ deleteProgress.percentage }}%</span>
            </div>
            <div v-if="deleteProgress.currentPatient" class="delete-current-patient">
              正在删除：患者 ID {{ deleteProgress.currentPatient }}
            </div>
          </div>
        </div>

        <div class="delete-dialog-footer">
          <button 
            @click="closeDeleteDialog" 
            class="cancel-btn" 
            :disabled="isDeleting"
          >
            取消
          </button>
          <button 
            @click="confirmDelete" 
            class="confirm-delete-btn" 
            :disabled="isDeleting"
          >
            <span v-if="isDeleting" class="btn-loading">
              <span class="spinner"></span>
              删除中...
            </span>
            <span v-else>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
              </svg>
              确认删除
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑患者对话框 -->
    <el-dialog
      title="编辑患者信息"
      :visible.sync="editDialogVisible"
      width="900px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        :model="editForm"
        :rules="editRules"
        ref="editForm"
        label-width="120px"
        label-position="right"
      >
        <!-- 患者基本信息模块 -->
        <div class="patient-basic-info-section">
          <h4 class="section-title">患者基本信息</h4>
          
          <!-- 第一行：患者ID、性别、年龄 -->
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="患者ID" prop="patientId">
                <el-input v-model="editForm.patientId" disabled></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="editForm.gender" placeholder="请选择性别" style="width: 100%">
                  <el-option label="男" value="男"></el-option>
                  <el-option label="女" value="女"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="年龄" prop="age">
                <el-input-number
                  v-model="editForm.age"
                  :min="0"
                  :max="120"
                  :precision="0"
                  :controls-position="'right'"
                  style="width: 100%"
                  placeholder="请输入年龄"
                  @change="validateAge"
                  @blur="validateAge"
                ></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
          
          <!-- 第二行：是否绿色通道、身高、体重 -->
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="是否绿色通道" prop="isGreenChannel">
                <el-select v-model="editForm.isGreenChannel" placeholder="请选择" style="width: 100%">
                  <el-option label="是" value="是"></el-option>
                  <el-option label="否" value="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="身高(cm)" prop="height">
                <el-input
                  v-model="editForm.height"
                  placeholder="请输入身高（整数或两位小数）"
                  @blur="formatDecimal('height')"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="体重(kg)" prop="weight">
                <el-input
                  v-model="editForm.weight"
                  placeholder="请输入体重（整数或两位小数）"
                  @blur="formatDecimal('weight')"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 创伤发生地 -->
        <el-form-item label="创伤发生地" prop="injuryLocation">
          <el-input
            v-model="editForm.injuryLocation"
            type="textarea"
            :rows="3"
            placeholder="请输入创伤发生地（地址）"
            maxlength="500"
            show-word-limit
          ></el-input>
        </el-form-item>
      </el-form>
      
      <!-- 分隔线 -->
      <el-divider></el-divider>
      
      <!-- 干预时间信息模块 -->
      <div class="intervention-time-section">
        <h3 style="margin-bottom: 20px; color: #409EFF;">干预时间信息</h3>
        <el-form
          :model="interventionForm"
          ref="interventionForm"
          label-width="140px"
          label-position="right"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="接诊日期">
                <el-date-picker
                  v-model="interventionForm.admissionDate"
                  type="date"
                  placeholder="选择接诊日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="接诊时间">
                <el-input
                  v-model="interventionForm.admissionTime"
                  placeholder="格式：HHMM，如0830"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="外周">
                <el-input
                  v-model="interventionForm.peripheral"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="深静脉">
                <el-input
                  v-model="interventionForm.ivLine"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="骨通道">
                <el-input
                  v-model="interventionForm.centralAccess"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="鼻导管">
                <el-input
                  v-model="interventionForm.nasalPipe"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="面罩">
                <el-input
                  v-model="interventionForm.faceMask"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="气管插管">
                <el-input
                  v-model="interventionForm.endotrachealTube"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="呼吸机">
                <el-input
                  v-model="interventionForm.ventilator"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="心肺复苏">
                <el-select v-model="interventionForm.cpr" placeholder="请选择" style="width: 100%">
                  <el-option label="是" value="是"></el-option>
                  <el-option label="否" value="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="心肺复苏开始时间">
                <el-input
                  v-model="interventionForm.cprStartTime"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="心肺复苏结束时间">
                <el-input
                  v-model="interventionForm.cprEndTime"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="B超">
                <el-input
                  v-model="interventionForm.ultrasound"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="CT">
                <el-input
                  v-model="interventionForm.CT"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="止血带">
                <el-input
                  v-model="interventionForm.tourniquet"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="采血">
                <el-input
                  v-model="interventionForm.bloodDraw"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="导尿">
                <el-input
                  v-model="interventionForm.catheter"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="胃管">
                <el-input
                  v-model="interventionForm.gastricTube"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="输血">
                <el-select v-model="interventionForm.transfusion" placeholder="请选择" style="width: 100%">
                  <el-option label="是" value="是"></el-option>
                  <el-option label="否" value="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="输血开始时间">
                <el-input
                  v-model="interventionForm.transfusionStart"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="输血结束时间">
                <el-input
                  v-model="interventionForm.transfusionEnd"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="离开抢救室时间">
                <el-input
                  v-model="interventionForm.leaveSurgeryTime"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="离开抢救室日期">
                <el-date-picker
                  v-model="interventionForm.leaveSurgeryDate"
                  type="date"
                  placeholder="选择离开日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                ></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="病人去向">
                <el-input
                  v-model="interventionForm.patientDestination"
                  placeholder="请输入病人去向"
                  maxlength="100"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="死亡">
                <el-select v-model="interventionForm.death" placeholder="请选择" style="width: 100%">
                  <el-option label="是" value="是"></el-option>
                  <el-option label="否" value="否"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="死亡日期">
                <el-date-picker
                  v-model="interventionForm.deathDate"
                  type="date"
                  placeholder="选择死亡日期"
                  value-format="yyyy-MM-dd"
                  style="width: 100%"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="死亡时间">
                <el-input
                  v-model="interventionForm.deathTime"
                  placeholder="格式：HHMM"
                  maxlength="4"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeEditDialog">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="isSubmitting">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import InjuryFigureModal from '@/components/InjuryFigureModal.vue'
import InterventionTimelineDialog from '@/components/InterventionTimelineDialog.vue'
import GcsScoreModal from '@/components/GcsScoreModal.vue'
import RtsScoreModal from '@/components/RtsScoreModal.vue'
import PatientOnAdmissionModal from '@/components/PatientOnAdmissionModal.vue'
import PatientOffAdmissionModal from '@/components/PatientOffAdmissionModal.vue'
import ImportLoadingModal from '@/components/ImportLoadingModal.vue'

export default {
  components: {
    InjuryFigureModal,
    InterventionTimelineDialog,
    GcsScoreModal,
    RtsScoreModal,
    PatientOnAdmissionModal,
    PatientOffAdmissionModal,
    ImportLoadingModal,
  },
  data() {
    return {
      patients: [],
      
      // 分页数据
      current: 1,
      size: 10,
      total: 0,
      pages: 0,
      jumpPage: 1, // 跳转页码输入框的值
      
      // 查询条件
      searchForm: {
        patientId: null,
        gender: '',
        minAge: null,
        maxAge: null
      },

      // 受伤弹窗
      showModal: false,
      currentPatient: null,

      // 干预时间弹窗
      showTimeline: false,
      selectedPatientData: {}, // 这里存放请求到的干预时间数据

      // GCS评分弹窗
      showGcsModalFlag: false,
      currentGcsPatient: null,

      // RTS评分弹窗
      showRtsModalFlag: false,
      currentRtsPatient: null,

      // 入室前信息弹窗
      showOnAdmissionModalFlag: false,
      currentOnAdmissionPatient: null,

      // 离室后信息弹窗
      showOffAdmissionModalFlag: false,
      currentOffAdmissionPatient: null,

      // 批量导入弹窗
      showImportModalFlag: false,
      selectedFile: null,
      isDragOver: false,
      isImporting: false,
      importResult: null,
      
      // 导入加载状态
      showImportLoading: false,
      importProgress: 0,
      canCancelImport: true,
      importStartTime: null,
      progressInterval: null,

      // 删除相关状态
      showDeleteDialog: false,
      patientToDelete: null,
      patientsToDelete: [],
      isBatchDelete: false,
      isDeleting: false,
      // 删除进度
      deleteProgress: {
        current: 0,
        total: 0,
        percentage: 0,
        currentPatient: null
      },
      // 批量选择
      selectedPatients: [],
      
      // 编辑相关状态
      editDialogVisible: false,
      editForm: {
        patientId: null,
        gender: '',
        age: null,
        isGreenChannel: '',
        height: null,
        weight: null,
        injuryLocation: '' // 创伤发生地（地址）
      },
      // 干预时间表单数据
      interventionForm: {
        admissionDate: null,
        admissionTime: null,
        peripheral: null,
        ivLine: null,
        centralAccess: null,
        nasalPipe: null,
        faceMask: null,
        endotrachealTube: null,
        ventilator: null,
        cpr: null,
        cprStartTime: null,
        cprEndTime: null,
        ultrasound: null,
        CT: null,
        tourniquet: null,
        bloodDraw: null,
        catheter: null,
        gastricTube: null,
        transfusion: null,
        transfusionStart: null,
        transfusionEnd: null,
        leaveSurgeryTime: null,
        leaveSurgeryDate: null,
        patientDestination: null,
        death: null,
        deathDate: null,
        deathTime: null
      },
      editRules: {
        gender: [
          { validator: (rule, value, callback) => {
              // 选填，但如果填写了必须符合格式
              if (value && value !== '' && value !== '男' && value !== '女') {
                callback(new Error('性别只能是"男"或"女"'));
              } else {
                callback();
              }
            }, trigger: 'change' }
        ],
        age: [
          { 
            validator: (rule, value, callback) => {
              // 选填，但如果填写了必须符合范围
              if (value === null || value === '' || value === undefined) {
                callback();
              } else {
                const ageNum = Number(value);
                if (isNaN(ageNum)) {
                  callback(new Error('年龄必须是数字'));
                } else if (ageNum < 0 || ageNum > 120) {
                  callback(new Error('年龄必须在0-120之间'));
                } else if (ageNum !== Math.floor(ageNum)) {
                  callback(new Error('年龄必须是整数'));
                } else {
                  callback();
                }
              }
            }, 
            trigger: ['change', 'blur'] 
          }
        ],
        isGreenChannel: [
          { validator: (rule, value, callback) => {
              // 选填，但如果填写了必须符合格式
              if (value && value !== '' && value !== '是' && value !== '否') {
                callback(new Error('是否绿色通道只能是"是"或"否"'));
              } else {
                callback();
              }
            }, trigger: 'change' }
        ],
        height: [
          { validator: (rule, value, callback) => {
              if (value === null || value === '' || value === undefined) {
                callback();
              } else {
                const heightStr = String(value);
                if (!/^\d+(\.\d{1,2})?$/.test(heightStr)) {
                  callback(new Error('身高格式不正确，应为整数或两位小数'));
                } else {
                  callback();
                }
              }
            }, trigger: 'blur' }
        ],
        weight: [
          { validator: (rule, value, callback) => {
              if (value === null || value === '' || value === undefined) {
                callback();
              } else {
                const weightStr = String(value);
                if (!/^\d+(\.\d{1,2})?$/.test(weightStr)) {
                  callback(new Error('体重格式不正确，应为整数或两位小数'));
                } else {
                  callback();
                }
              }
            }, trigger: 'blur' }
        ]
      },
      isSubmitting: false,
    }
  },
  computed: {
    // 计算可见的页码（动态显示，根据当前页位置调整）
    visiblePages() {
      const totalPages = this.pages;
      const current = this.current;
      
      if (totalPages <= 7) {
        // 如果总页数小于等于7，显示所有页码
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }
      
      const pages = [];
      
      // 情况1：当前页在前3页（1-3页）
      if (current <= 3) {
        // 显示：1、2、3、4、5……最后一页
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      }
      // 情况2：当前页在最后3页（倒数第3页到最后一页）
      else if (current >= totalPages - 2) {
        // 显示：1……倒数第5页、倒数第4页、倒数第3页、倒数第2页、最后一页
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      }
      // 情况3：当前页在中间
      else {
        // 显示：1……当前页-1、当前页、当前页+1……最后一页
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    },
    // 是否显示前省略号（当前页不在前3页时显示）
    showFrontEllipsis() {
      return this.pages > 7 && this.current > 4;
    },
    // 是否显示后省略号（当前页不在最后3页时显示）
    showBackEllipsis() {
      return this.pages > 7 && this.current < this.pages - 3;
    },
    // 是否显示第一页（当前页不在前3页时显示）
    showFirstPage() {
      return this.pages > 7 && this.current > 4;
    },
    // 是否显示最后一页（当前页不在最后3页时显示）
    showLastPage() {
      return this.pages > 7 && this.current < this.pages - 3;
    },
    // 是否全选
    isAllSelected() {
      return this.patients.length > 0 && this.selectedPatients.length === this.patients.length;
    }
  },
  methods: {
    // 返回地图页面
    goBack() {
      this.$router.push('/');
    },

    // 获取患者分页数据
    fetchPatients() {
      const params = {
        current: this.current,
        size: this.size,
        ...this.searchForm
      };
      
      // 清理空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '') {
          delete params[key];
        }
      });
      
      this.$axios.get('/api/patient/page', { params })
        .then(res => {
          const data = res.data.data;
          this.patients = data.records;
          this.current = data.current;
          this.size = data.size;
          this.total = data.total;
          this.pages = data.pages;
          // 同步更新跳转输入框的值
          this.jumpPage = data.current;
          // 清空选中状态
          this.selectedPatients = [];
        })
        .catch(err => {
          console.error('请求失败', err);
        });
    },

    // 搜索患者
    searchPatients() {
      this.current = 1; // 重置到第一页
      this.jumpPage = 1;
      this.fetchPatients();
    },

    // 重置搜索条件
    resetSearch() {
      this.searchForm = {
        patientId: null,
        gender: '',
        minAge: null,
        maxAge: null
      };
      this.current = 1;
      this.jumpPage = 1;
      this.fetchPatients();
    },

    // 跳转到指定页
    goToPage(page) {
      if (page >= 1 && page <= this.pages && page !== this.current) {
        this.current = page;
        this.jumpPage = page; // 同步更新跳转输入框的值
        this.fetchPatients();
      }
    },
    
    // 处理每页记录数变化
    handlePageSizeChange() {
      this.current = 1; // 重置到第一页
      this.jumpPage = 1;
      this.fetchPatients();
    },
    
    // 处理页码跳转
    handleJumpPage() {
      const page = parseInt(this.jumpPage);
      if (page >= 1 && page <= this.pages) {
        this.goToPage(page);
      } else {
        // 如果输入无效，重置为当前页
        this.jumpPage = this.current;
        this.$message.warning(`请输入有效的页码（1-${this.pages}）`);
      }
    },

    showInjuryModal(patient) {
      this.currentPatient = patient;
      this.showModal = true;
      
      // 获取受伤程度数据
      this.fetchInjuryData(patient);
    },
    closeModal() {
      this.showModal = false;
    },

    // 获取受伤程度数据
    fetchInjuryData(patient) {
      const url = `/api/iss/injury/${patient.patientId}`;
      this.$axios.get(url)
        .then(res => {
          console.log('受伤程度数据:', res.data);
          
          if (res.data.data) {
            // 将受伤数据合并到患者对象中
            this.currentPatient = {
              ...patient,
              ...res.data.data
            };
          }
        })
        .catch(err => {
          console.error('获取受伤程度数据失败:', err);
          // 即使获取失败，也显示弹窗，但数据可能不完整
        });
    },

    fetchInterventionData(patient) {
      const url = `/api/intervention/patient/${patient.patientId}`;
      this.$axios.get(url)
        .then(res => {
          console.log('干预数据:', res.data);
          
          // 修正：确保我们获取的是对象而不是数组
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            this.selectedPatientData = res.data.data[0];
          } else if (typeof res.data.data === 'object') {
            this.selectedPatientData = res.data.data;
          } else {
            this.selectedPatientData = {};
          }
          
          this.showTimeline = true; // 弹出时间线
        })
        .catch(err => {
          console.error('请求干预时间失败', err);
          alert('获取干预时间失败');
        });
    },

    closeTimeline() {
      this.showTimeline = false;
    },

    // GCS评分相关方法
    showGcsModal(patient) {
      this.currentGcsPatient = patient;
      this.showGcsModalFlag = true;
      
      // 获取GCS评分数据
      this.fetchGcsData(patient);
    },

    closeGcsModal() {
      this.showGcsModalFlag = false;
    },

    // 获取GCS评分数据
    fetchGcsData(patient) {
      const url = `/api/gcs/score/${patient.patientId}`;
      this.$axios.get(url)
        .then(res => {
          console.log('GCS评分数据:', res.data);
          if (res.data.data) {
            // 将GCS数据合并到患者对象中
            this.currentGcsPatient = {
              ...patient,
              ...res.data.data
            };
          }
        })
        .catch(err => {
          console.error('获取GCS评分数据失败:', err);
          // 即使获取失败，也显示弹窗，但数据可能不完整
        });
    },

    // RTS评分相关方法
    showRtsModal(patient) {
      this.currentRtsPatient = patient;
      this.showRtsModalFlag = true;
      
      // 获取RTS评分数据
      this.fetchRtsData(patient);
    },

    closeRtsModal() {
      this.showRtsModalFlag = false;
    },

    // 获取RTS评分数据
    fetchRtsData(patient) {
      const url = `/api/rts/score/${patient.patientId}`;
      this.$axios.get(url)
        .then(res => {
          console.log('RTS评分数据:', res.data);
          if (res.data.data) {
            // 将RTS数据合并到患者对象中
            this.currentRtsPatient = {
              ...patient,
              ...res.data.data
            };
          }
        })
        .catch(err => {
          console.error('获取RTS评分数据失败:', err);
          // 即使获取失败，也显示弹窗，但数据可能不完整
        });
    },

    // 入室前信息相关方法
    showOnAdmissionModal(patient) {
      this.currentOnAdmissionPatient = patient;
      this.showOnAdmissionModalFlag = true;
    },

    closeOnAdmissionModal() {
      this.showOnAdmissionModalFlag = false;
    },

    // 离室后信息相关方法
    showOffAdmissionModal(patient) {
      this.currentOffAdmissionPatient = patient;
      this.showOffAdmissionModalFlag = true;
    },

    closeOffAdmissionModal() {
      this.showOffAdmissionModalFlag = false;
    },

    // 批量导入相关方法
    showImportModal() {
      this.showImportModalFlag = true;
      this.selectedFile = null;
      this.importResult = null;
    },

    closeImportModal() {
      this.showImportModalFlag = false;
      this.selectedFile = null;
      this.importResult = null;
      this.isDragOver = false;
    },

    triggerFileSelect() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.importResult = null;
      }
    },

    handleFileDrop(event) {
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (this.isValidFile(file)) {
          this.selectedFile = file;
          this.importResult = null;
        } else {
          alert('请选择有效的Excel文件（.xlsx或.xls格式）');
        }
      }
    },

    isValidFile(file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      const validExtensions = ['.xlsx', '.xls'];
      
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      
      return hasValidType || hasValidExtension;
    },

    removeFile() {
      this.selectedFile = null;
      this.importResult = null;
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },

    async importFile() {
      if (!this.selectedFile) {
        alert('请先选择文件');
        return;
      }

      // 开始导入流程
      this.startImportProcess();

      try {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        // 模拟进度更新
        this.simulateProgress();

        const response = await this.$axios.post('/api/file/uploadPatientExcel', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // 完成导入
        this.completeImport(response);

      } catch (error) {
        console.error('导入失败:', error);
        this.handleImportError(error);
      }
    },

    // 开始导入流程
    startImportProcess() {
      this.isImporting = true;
      this.showImportLoading = true;
      this.importProgress = 0;
      this.canCancelImport = true;
      this.importStartTime = Date.now();
      this.importResult = null;
      
      // 关闭导入弹窗
      this.showImportModalFlag = false;
    },

    // 模拟进度更新
    simulateProgress() {
      const progressInterval = setInterval(() => {
        if (this.importProgress < 90) {
          this.importProgress += Math.random() * 15;
          if (this.importProgress > 90) {
            this.importProgress = 90;
          }
        }
      }, 500);

      // 保存interval以便清理
      this.progressInterval = progressInterval;
    },

    // 完成导入
    completeImport(response) {
      // 清理进度模拟
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      // 设置完成进度
      this.importProgress = 100;
      
      // 延迟一下让用户看到100%的进度
      setTimeout(() => {
        this.showImportLoading = false;
        this.isImporting = false;
        this.canCancelImport = true;

        if (response.data.code === 200) {
          this.importResult = {
            success: true,
            message: response.data.data.message || response.data.message || '导入成功',
            data: response.data.data,
            tables: response.data.data.tables || null
          };
          
          // 导入成功后刷新患者列表
          this.fetchPatients();
          
          // 显示成功提示
          this.showSuccessMessage('🎉 导入成功！患者数据已成功导入系统。');
        } else {
          this.importResult = {
            success: false,
            message: response.data.message || '导入失败',
            errors: response.data.errors || [],
            totalErrorCount: response.data.totalErrorCount || (response.data.errors ? response.data.errors.length : 0),
            tables: response.data.tables || null,
            errorExportFile: response.data.errorExportFile || null,
            errorExportUrl: response.data.errorExportUrl || null
          };
          if (!this.importResult.errorExportUrl && this.importResult.errors && this.importResult.errors.length > 0) {
            this.importResult.clientErrorExportUrl = this.buildErrorsCsvBlobUrl(this.importResult.errors);
          }
          this.showErrorMessage('❌ 导入失败：' + (response.data.message || '未知错误'));
          
          // 保存错误信息到全局错误通知系统
          this.saveErrorToGlobalNotification(this.importResult);
        }
        
        // 重新打开导入弹窗显示结果
        this.showImportModalFlag = true;
      }, 1000);
    },

    // 处理导入错误
    handleImportError(error) {
      // 清理进度模拟
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      this.showImportLoading = false;
      this.isImporting = false;
      this.canCancelImport = true;

      this.importResult = {
        success: false,
        message: error.response?.data?.message || '导入失败，请检查文件格式',
        errors: error.response?.data?.errors || [],
        totalErrorCount: error.response?.data?.totalErrorCount || (error.response?.data?.errors ? error.response.data.errors.length : 0),
        tables: error.response?.data?.tables || null,
        errorExportFile: error.response?.data?.errorExportFile || null,
        errorExportUrl: error.response?.data?.errorExportUrl || null
      };
      if (!this.importResult.errorExportUrl && this.importResult.errors && this.importResult.errors.length > 0) {
        this.importResult.clientErrorExportUrl = this.buildErrorsCsvBlobUrl(this.importResult.errors);
      }

      this.showErrorMessage('❌ 导入失败：' + this.importResult.message);
      
      // 保存错误信息到全局错误通知系统
      this.saveErrorToGlobalNotification(this.importResult);
      
      // 重新打开导入弹窗显示错误
      this.showImportModalFlag = true;
    },
    
    downloadErrorReport() {
      if (!this.importResult) return;
      const url = this.importResult.errorExportUrl || this.importResult.clientErrorExportUrl;
      if (url) {
        window.open(url, '_blank');
      }
    },
    
    buildErrorsCsvBlobUrl(errors) {
      try {
        const BOM = '\uFEFF';
        const headers = ['行号', '患者ID', '字段', '错误值', '错误原因'];
        const escapeCell = (val) => {
          const s = val == null ? '' : String(val).replace(/\r?\n/g, ' ').replace(/"/g, '""');
          return /,|"/.test(s) ? `"${s}"` : s;
        };
        const rows = errors.map(e => [
          e.row ?? '',
          e.patientId ?? '',
          e.field ?? '',
          e.value ?? '',
          e.message ?? ''
        ].map(escapeCell).join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error('生成错误CSV失败:', err);
        return null;
      }
    },

    // 取消导入
    cancelImport() {
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      this.showImportLoading = false;
      this.isImporting = false;
      this.canCancelImport = true;
      this.importProgress = 0;

      this.showWarningMessage('⚠️ 导入已取消');
    },

    // 显示成功消息
    showSuccessMessage(message) {
      this.$message({
        message: message,
        type: 'success',
        duration: 3000,
        showClose: true
      });
    },

    // 显示错误消息
    showErrorMessage(message) {
      this.$message({
        message: message,
        type: 'error',
        duration: 4000,
        showClose: true
      });
    },

    // 显示警告消息
    showWarningMessage(message) {
      this.$message({
        message: message,
        type: 'warning',
        duration: 3000,
        showClose: true
      });
    },

    // 保存错误信息到全局错误通知系统
    saveErrorToGlobalNotification(errorResult) {
      if (!errorResult || errorResult.success) {
        return;
      }
      
      try {
        // 构建错误通知对象
        const errorNotification = {
          timestamp: Date.now(),
          message: errorResult.message || '导入失败',
          errors: errorResult.errors || [],
          totalErrorCount: errorResult.totalErrorCount || (errorResult.errors ? errorResult.errors.length : 0),
          tables: errorResult.tables || null
        };
        
        // 从localStorage读取现有的错误通知
        let formatErrorNotifications = [];
        const stored = localStorage.getItem('importErrorNotifications');
        if (stored) {
          try {
            formatErrorNotifications = JSON.parse(stored);
          } catch (e) {
            console.error('解析错误通知失败:', e);
            formatErrorNotifications = [];
          }
        }
        
        // 添加到通知列表（最多保存20条）
        formatErrorNotifications.unshift(errorNotification);
        if (formatErrorNotifications.length > 20) {
          formatErrorNotifications = formatErrorNotifications.slice(0, 20);
        }
        
        // 保存到localStorage
        localStorage.setItem('importErrorNotifications', JSON.stringify(formatErrorNotifications));
      } catch (error) {
        console.error('保存错误通知到全局系统失败:', error);
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 编辑患者相关方法
    async showEditDialog(patient) {
      // 处理isGreenChannel的多种可能格式（boolean、String '是'/'否'、String 'true'/'false'）
      let isGreenChannelValue = '';
      if (patient.isGreenChannel === true || patient.isGreenChannel === '是' || patient.isGreenChannel === 'true') {
        isGreenChannelValue = '是';
      } else if (patient.isGreenChannel === false || patient.isGreenChannel === '否' || patient.isGreenChannel === 'false') {
        isGreenChannelValue = '否';
      } else if (patient.isGreenChannel) {
        // 其他非空值，尝试转换
        isGreenChannelValue = String(patient.isGreenChannel);
      }
      
      // 回显患者信息
      this.editForm = {
        patientId: patient.patientId,
        gender: patient.gender || '',
        age: patient.age || null,
        isGreenChannel: isGreenChannelValue,
        height: patient.height || null,
        weight: patient.weight || null,
        injuryLocation: '' // 先设置为空，后面会加载
      };
      
      // 加载地址数据
      await this.loadInjuryLocation(patient.patientId);
      
      // 加载干预时间数据
      await this.loadInterventionTimeData(patient.patientId);
      
      this.editDialogVisible = true;
      // 清除表单验证状态
      this.$nextTick(() => {
        if (this.$refs.editForm) {
          this.$refs.editForm.clearValidate();
        }
      });
    },
    
    // 加载地址数据
    async loadInjuryLocation(patientId) {
      try {
        const response = await this.$axios.get('/api/map/injury-location', {
          params: { patientId }
        });
        if (response.data && response.data.code === 200) {
          this.editForm.injuryLocation = response.data.data || '';
        } else {
          this.editForm.injuryLocation = '';
        }
      } catch (error) {
        console.error('加载地址数据失败:', error);
        this.editForm.injuryLocation = '';
      }
    },
    
    // 加载干预时间数据
    async loadInterventionTimeData(patientId) {
      try {
        const response = await this.$axios.get(`/api/intervention/edit/${patientId}`);
        if (response.data && response.data.code === 200 && response.data.data) {
          const data = response.data.data;
          // 回显干预时间数据
          this.interventionForm = {
            admissionDate: data.admissionDate || null,
            admissionTime: data.admissionTime || null,
            peripheral: data.peripheral || null,
            ivLine: data.ivLine || null,
            centralAccess: data.centralAccess || null,
            nasalPipe: data.nasalPipe || null,
            faceMask: data.faceMask || null,
            endotrachealTube: data.endotrachealTube || null,
            ventilator: data.ventilator || null,
            cpr: data.cpr || null,
            cprStartTime: data.cprStartTime || null,
            cprEndTime: data.cprEndTime || null,
            ultrasound: data.ultrasound || null,
            CT: data.CT || null,
            tourniquet: data.tourniquet || null,
            bloodDraw: data.bloodDraw || null,
            catheter: data.catheter || null,
            gastricTube: data.gastricTube || null,
            transfusion: data.transfusion || null,
            transfusionStart: data.transfusionStart || null,
            transfusionEnd: data.transfusionEnd || null,
            leaveSurgeryTime: data.leaveSurgeryTime || null,
            leaveSurgeryDate: data.leaveSurgeryDate || null,
            patientDestination: data.patientDestination || null,
            death: data.death || null,
            deathDate: data.deathDate || null,
            deathTime: data.deathTime || null
          };
        } else {
          // 如果没有数据，重置表单
          this.resetInterventionForm();
        }
      } catch (error) {
        console.error('加载干预时间数据失败:', error);
        // 加载失败时重置表单
        this.resetInterventionForm();
      }
    },
    
    // 重置干预时间表单
    resetInterventionForm() {
      this.interventionForm = {
        admissionDate: null,
        admissionTime: null,
        peripheral: null,
        ivLine: null,
        centralAccess: null,
        nasalPipe: null,
        faceMask: null,
        endotrachealTube: null,
        ventilator: null,
        cpr: null,
        cprStartTime: null,
        cprEndTime: null,
        ultrasound: null,
        CT: null,
        tourniquet: null,
        bloodDraw: null,
        catheter: null,
        gastricTube: null,
        transfusion: null,
        transfusionStart: null,
        transfusionEnd: null,
        leaveSurgeryTime: null,
        leaveSurgeryDate: null,
        patientDestination: null,
        death: null,
        deathDate: null,
        deathTime: null
      };
    },

    closeEditDialog() {
      this.editDialogVisible = false;
      this.editForm = {
        patientId: null,
        gender: '',
        age: null,
        isGreenChannel: '',
        height: null,
        weight: null
      };
      this.resetInterventionForm();
      if (this.$refs.editForm) {
        this.$refs.editForm.clearValidate();
      }
    },

    // 格式化小数（保留最多两位小数）
    formatDecimal(field) {
      if (this.editForm[field] !== null && this.editForm[field] !== '' && this.editForm[field] !== undefined) {
        let value = String(this.editForm[field]).trim();
        // 移除非数字和小数点的字符
        value = value.replace(/[^\d.]/g, '');
        // 确保只有一个小数点
        const parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        }
        // 限制小数位数为2位
        if (parts.length === 2 && parts[1].length > 2) {
          value = parts[0] + '.' + parts[1].substring(0, 2);
        }
        // 转换为数字
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          this.editForm[field] = numValue;
        } else {
          this.editForm[field] = null;
        }
      }
    },

    // 验证年龄并自动修正超出范围的值
    validateAge() {
      const age = this.editForm.age;
      if (age !== null && age !== undefined && age !== '') {
        const ageNum = Number(age);
        if (!isNaN(ageNum)) {
          // 自动修正超出范围的值
          if (ageNum < 0) {
            this.editForm.age = 0;
          } else if (ageNum > 120) {
            this.editForm.age = 120;
          } else if (ageNum !== Math.floor(ageNum)) {
            this.editForm.age = Math.floor(ageNum);
          }
        }
      }
      // 触发表单验证
      this.$nextTick(() => {
        if (this.$refs.editForm) {
          this.$refs.editForm.validateField('age');
        }
      });
    },

    // 提交编辑
    async submitEdit() {
      try {
        // 表单验证
        await this.$refs.editForm.validate();
        
        // 额外验证：年龄必须在0-120之间（严格验证，防止绕过前端限制）
        const age = this.editForm.age;
        // 严格检查：null、undefined、空字符串都视为有效（选填）
        if (age !== null && age !== undefined && age !== '') {
          // 转换为数字
          const ageNum = Number(age);
          
          // 检查是否为有效数字
          if (isNaN(ageNum)) {
            this.showErrorMessage('编辑失败：年龄必须是有效的数字');
            return;
          }
          
          // 检查范围：必须 >= 0 且 <= 120
          if (ageNum < 0) {
            this.showErrorMessage('编辑失败：年龄不能小于0');
            return;
          }
          if (ageNum > 120) {
            this.showErrorMessage('编辑失败：年龄不能大于120');
            return;
          }
          
          // 确保年龄是整数
          if (ageNum !== Math.floor(ageNum)) {
            this.showErrorMessage('编辑失败：年龄必须是整数');
            return;
          }
          
          // 最终赋值确保是整数
          this.editForm.age = Math.floor(ageNum);
        }
        
        this.isSubmitting = true;
        
        // 构建提交数据
        const updateData = {
          patientId: this.editForm.patientId,
          gender: this.editForm.gender,
          age: this.editForm.age,
          isGreenChannel: this.editForm.isGreenChannel,
          height: this.editForm.height || null,
          weight: this.editForm.weight || null
        };
        
        // 构建干预时间数据
        const interventionData = {
          patientId: this.editForm.patientId,
          admissionDate: this.interventionForm.admissionDate || null,
          admissionTime: this.interventionForm.admissionTime || null,
          peripheral: this.interventionForm.peripheral || null,
          ivLine: this.interventionForm.ivLine || null,
          centralAccess: this.interventionForm.centralAccess || null,
          nasalPipe: this.interventionForm.nasalPipe || null,
          faceMask: this.interventionForm.faceMask || null,
          endotrachealTube: this.interventionForm.endotrachealTube || null,
          ventilator: this.interventionForm.ventilator || null,
          cpr: this.interventionForm.cpr || null,
          cprStartTime: this.interventionForm.cprStartTime || null,
          cprEndTime: this.interventionForm.cprEndTime || null,
          ultrasound: this.interventionForm.ultrasound || null,
          CT: this.interventionForm.CT || null,
          tourniquet: this.interventionForm.tourniquet || null,
          bloodDraw: this.interventionForm.bloodDraw || null,
          catheter: this.interventionForm.catheter || null,
          gastricTube: this.interventionForm.gastricTube || null,
          transfusion: this.interventionForm.transfusion || null,
          transfusionStart: this.interventionForm.transfusionStart || null,
          transfusionEnd: this.interventionForm.transfusionEnd || null,
          leaveSurgeryTime: this.interventionForm.leaveSurgeryTime || null,
          leaveSurgeryDate: this.interventionForm.leaveSurgeryDate || null,
          patientDestination: this.interventionForm.patientDestination || null,
          death: this.interventionForm.death || null,
          deathDate: this.interventionForm.deathDate || null,
          deathTime: this.interventionForm.deathTime || null
        };
        
        // 先更新患者基本信息
        const response = await this.$axios.post('/api/patient/update', updateData);
        
        // 然后更新干预时间数据
        try {
          await this.$axios.put('/api/intervention/update', interventionData);
        } catch (interventionError) {
          console.error('更新干预时间数据失败:', interventionError);
          // 如果干预时间更新失败，仍然显示患者信息更新成功的消息
          // 但可以记录错误日志
        }
        
        // 最后更新地址数据
        try {
          await this.$axios.put('/api/map/injury-location', null, {
            params: {
              patientId: this.editForm.patientId,
              injuryLocation: this.editForm.injuryLocation || ''
            }
          });
        } catch (locationError) {
          console.error('更新地址数据失败:', locationError);
          // 如果地址更新失败，仍然显示患者信息更新成功的消息
          // 但可以记录错误日志
        }
        
        // 检查响应是否成功（优先检查失败情况，再检查成功情况）
        // 1. 检查顶层 success 字段为 false
        const isFailed = response.data.success === false || 
                        (response.data.data && response.data.data.success === false);
        
        // 2. 检查成功条件
        const isSuccess = response.data.code === 200 || 
                         response.data.success === true ||
                         (response.data.data && response.data.data.success === true);
        
        // 如果明确失败，显示错误信息
        if (isFailed) {
          // 获取错误信息（兼容多种字段名）
          const errorMsg = response.data.errorMsg || 
                          response.data.message || 
                          (response.data.data && response.data.data.message) ||
                          '未知错误';
          this.showErrorMessage('编辑失败：' + errorMsg);
          return; // 阻止后续操作
        }
        
        // 如果成功，显示成功信息
        if (isSuccess) {
          this.showSuccessMessage('编辑成功！患者信息已更新');
          this.closeEditDialog();
          // 刷新列表
          this.fetchPatients();
        } else {
          // 既不是明确失败也不是明确成功，可能是未知格式，尝试获取错误信息
          const errorMsg = response.data.errorMsg || 
                          response.data.message || 
                          (response.data.data && response.data.data.message) ||
                          '未知错误';
          this.showErrorMessage('编辑失败：' + errorMsg);
        }
      } catch (error) {
        // 获取错误信息（兼容多种字段名和响应格式）
        let errorMsg = '未知错误';
        
        if (error.response && error.response.data) {
          errorMsg = error.response.data.errorMsg || 
                    error.response.data.message ||
                    (error.response.data.data && error.response.data.data.message) ||
                    error.response.data.error ||
                    '未知错误';
        } else if (error.message && !error.message.includes('validate')) {
          errorMsg = error.message;
        } else if (error.message && error.message.includes('validate')) {
          // 表单验证失败，不需要额外提示
          return;
        }
        
        this.showErrorMessage('编辑失败：' + errorMsg);
      } finally {
        this.isSubmitting = false;
      }
    },

    // 批量选择相关方法
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedPatients = [];
      } else {
        this.selectedPatients = this.patients.map(p => p.patientId);
      }
    },

    // 删除患者相关方法
    handleDelete(patient) {
      this.patientToDelete = patient;
      this.patientsToDelete = [];
      this.isBatchDelete = false;
      this.showDeleteDialog = true;
    },

    handleBatchDelete() {
      if (this.selectedPatients.length === 0) {
        return;
      }
      // 获取选中的患者对象
      this.patientsToDelete = this.patients.filter(p => 
        this.selectedPatients.includes(p.patientId)
      );
      this.patientToDelete = null;
      this.isBatchDelete = true;
      this.showDeleteDialog = true;
    },

    // 处理遮罩层点击
    handleOverlayClick() {
      if (!this.isDeleting) {
        this.closeDeleteDialog();
      } else {
        this.$message.warning('删除进行中，请等待完成后再关闭');
      }
    },
    
    closeDeleteDialog(force = false) {
      // 如果强制关闭或者不在删除中，则关闭对话框
      if (force || !this.isDeleting) {
        this.showDeleteDialog = false;
        this.patientToDelete = null;
        this.patientsToDelete = [];
        this.isBatchDelete = false;
        // 重置删除进度
        this.deleteProgress = {
          current: 0,
          total: 0,
          percentage: 0,
          currentPatient: null
        };
      } else {
        // 如果正在删除，提示用户
        this.$message.warning('删除进行中，请等待完成后再关闭');
      }
    },

    async confirmDelete() {
      if (this.isDeleting) {
        return;
      }

      // 确定要删除的患者ID列表
      let patientIdsToDelete = [];
      if (this.isBatchDelete) {
        if (this.patientsToDelete.length === 0) {
          return;
        }
        patientIdsToDelete = this.patientsToDelete.map(p => p.patientId);
      } else {
        if (!this.patientToDelete) {
          return;
        }
        patientIdsToDelete = [this.patientToDelete.patientId];
      }

      this.isDeleting = true;
      
      // 初始化删除进度
      this.deleteProgress = {
        current: 0,
        total: patientIdsToDelete.length,
        percentage: 0,
        currentPatient: null
      };
      
      try {
        // 批量删除：循环调用单个删除API
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (let i = 0; i < patientIdsToDelete.length; i++) {
          const patientId = patientIdsToDelete[i];
          
          // 更新当前删除的患者ID
          this.deleteProgress.currentPatient = patientId;
          
          try {
            const response = await this.$axios.delete(`/api/patient/${patientId}`);
            if (response.data.code === 200) {
              successCount++;
            } else {
              failCount++;
              errors.push(`患者ID ${patientId}: ${response.data.message || '未知错误'}`);
            }
          } catch (error) {
            failCount++;
            const errorMsg = error.response?.data?.message || error.message || '删除失败';
            errors.push(`患者ID ${patientId}: ${errorMsg}`);
          }
          
          // 更新进度
          this.deleteProgress.current = i + 1;
          this.deleteProgress.percentage = Math.round(((i + 1) / patientIdsToDelete.length) * 100);
        }

        // 显示结果消息
        if (failCount === 0) {
          // 删除成功，显示成功提示和删除条数
          const message = patientIdsToDelete.length === 1 
            ? `删除成功！已删除 1 位患者` 
            : `删除成功！已删除 ${successCount} 位患者`;
          this.showSuccessMessage(message);
        } else if (successCount > 0) {
          this.showErrorMessage(`⚠️ 部分删除失败：成功 ${successCount} 个，失败 ${failCount} 个`);
          if (errors.length > 0) {
            console.error('删除错误详情:', errors);
          }
        } else {
          this.showErrorMessage('❌ 删除失败：' + (errors[0] || '未知错误'));
        }

        // 清空选中状态
        this.selectedPatients = [];
        
        // 延迟刷新列表，确保对话框已关闭
        setTimeout(() => {
          this.fetchPatients();
        }, 100);
      } catch (error) {
        console.error('删除患者失败:', error);
        const errorMsg = error.response?.data?.message || error.message || '删除失败';
        this.showErrorMessage('❌ 删除失败：' + errorMsg);
      } finally {
        // 无论成功还是失败，都关闭对话框并重置状态
        this.isDeleting = false;
        // 延迟关闭对话框，让用户看到最终结果
        setTimeout(() => {
          this.showDeleteDialog = false;
          this.patientToDelete = null;
          this.patientsToDelete = [];
          this.isBatchDelete = false;
          // 重置删除进度
          this.deleteProgress = {
            current: 0,
            total: 0,
            percentage: 0,
            currentPatient: null
          };
        }, 1500);
      }
    },
  },
  mounted() {
    // 获取患者数据
    this.fetchPatients();
  },
  beforeDestroy() {
    // 清理定时器
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}
</script>

<style scoped>
/* 患者基本信息模块样式 */
.patient-basic-info-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.section-title {
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409EFF;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 确保表单项在列布局中正确显示 */
.patient-basic-info-section .el-form-item {
  margin-bottom: 18px;
}

/* 响应式调整：小屏幕时改为单列布局 */
@media (max-width: 768px) {
  .patient-basic-info-section .el-col {
    width: 100% !important;
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}

/* 页面标题样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.back-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #545b62;
}

/* 查询表单样式 */
.search-form {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.form-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.search-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #0056b3;
}

.reset-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn:hover {
  background-color: #545b62;
}

.import-btn {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.import-btn:hover {
  background-color: #218838;
}

.batch-delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.batch-delete-btn:hover:not(:disabled) {
  background-color: #c82333;
}

.batch-delete-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 表格样式 */
table.patient-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.patient-table th,
.patient-table td {
  border: 1px solid #e9ecef;
  padding: 12px;
  text-align: left;
}

.patient-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.patient-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 复选框样式 */
.select-all-checkbox,
.patient-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff;
}

.patient-table th:first-child,
.patient-table td:first-child {
  width: 50px;
  text-align: center;
}

/* 操作按钮样式 */
.patient-table button {
  padding: 6px 12px;
  margin: 0 3px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.patient-table button:hover {
  background-color: #0056b3;
}

.patient-table .edit-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;
  margin-right: 5px;
}

.patient-table .edit-btn:hover {
  background-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.patient-table .delete-btn {
  background-color: #dc3545;
  margin-left: 5px;
}

.patient-table .delete-btn:hover {
  background-color: #c82333;
}

/* 地址列样式 */
.patient-table .address-cell {
  max-width: 300px;
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector label {
  color: #6c757d;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.page-size-select:hover {
  border-color: #adb5bd;
}

.page-size-select:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.page-ellipsis {
  padding: 8px 4px;
  color: #6c757d;
  font-size: 14px;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid #dee2e6;
}

.page-jump span {
  color: #6c757d;
  font-size: 14px;
}

.page-jump-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  outline: none;
}

.page-jump-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.page-jump-btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.page-jump-btn:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #007bff;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.page-btn:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  border-color: #dee2e6;
}

.page-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .form-group {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 批量导入弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 20px;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.upload-placeholder {
  color: #6c757d;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.upload-hint {
  font-size: 12px;
  color: #adb5bd;
  margin-top: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.file-icon {
  font-size: 24px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: #333;
}

.file-size {
  margin: 0;
  font-size: 12px;
  color: #6c757d;
}

.remove-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background-color: #c82333;
}

.import-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.select-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.select-btn:hover {
  background-color: #545b62;
}

.import-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.import-result {
  padding: 16px;
  border-radius: 6px;
  margin-top: 16px;
}

.import-result.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.import-result.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.import-result h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.import-result p {
  margin: 4px 0;
  font-size: 14px;
}

.result-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.result-details p {
  font-size: 12px;
  color: #6c757d;
}

.error-details {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.error-details h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #721c24;
}

.errors-table-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.errors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.errors-table thead {
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.errors-table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  color: #495057;
}

.errors-table td {
  padding: 8px;
  border-bottom: 1px solid #dee2e6;
  color: #495057;
}

.errors-table tbody tr:hover {
  background-color: #f8f9fa;
}

.table-results {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #dee2e6;
}

.table-results h5 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.tables-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.table-name {
  font-weight: 500;
  color: #495057;
}

.table-status {
  font-size: 12px;
  font-weight: 600;
}

.table-status.valid {
  color: #28a745;
}

.table-status.invalid {
  color: #dc3545;
}

/* 删除确认对话框样式 */
.delete-modal-overlay {
  animation: fadeIn 0.2s ease-out;
  backdrop-filter: blur(2px);
}

/* 删除进行中时，禁用遮罩层点击关闭 */
.delete-modal-overlay:has(.is-deleting) {
  cursor: wait;
}

.delete-dialog.is-deleting {
  pointer-events: auto;
}

/* 删除进度条样式 */
.delete-progress-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.delete-progress-info {
  margin-bottom: 15px;
}

.progress-text {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
}

.progress-count {
  margin: 0;
  color: #6c757d;
  font-size: 13px;
}

.delete-progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.delete-progress-bar {
  flex: 1;
  height: 24px;
  background-color: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.delete-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  border-radius: 12px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.delete-progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progress-shine 1.5s infinite;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.delete-progress-percentage {
  color: #495057;
  font-size: 14px;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.delete-current-patient {
  padding: 8px 12px;
  background-color: #e7f3ff;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  color: #0056b3;
  font-size: 13px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.delete-dialog {
  max-width: 600px;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.delete-dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
}

.delete-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.delete-icon {
  width: 24px;
  height: 24px;
  color: #dc2626;
}

.delete-dialog-title {
  flex: 1;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.delete-dialog-body {
  padding: 24px;
}

.delete-warning-box {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.warning-icon {
  width: 24px;
  height: 24px;
  color: #f97316;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-icon svg {
  width: 100%;
  height: 100%;
}

.warning-content {
  flex: 1;
}

.delete-confirm-text {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin: 0 0 12px 0;
}

.highlight-count {
  font-weight: 700;
  color: #dc2626;
  font-size: 18px;
  padding: 0 4px;
}

.highlight-id {
  font-weight: 700;
  color: #dc2626;
  font-size: 16px;
  padding: 0 4px;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #dc2626;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}

.warning-icon-small {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 患者列表预览样式 */
.patient-preview-list {
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.preview-count {
  font-size: 13px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 4px 10px;
  border-radius: 12px;
}

.patient-list-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
}

.patient-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
}

.patient-preview-item:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateX(2px);
}

.patient-preview-item:last-child {
  margin-bottom: 0;
}

.patient-preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.patient-preview-avatar svg {
  width: 24px;
  height: 24px;
  color: #3b82f6;
}

.patient-preview-info {
  flex: 1;
  min-width: 0;
}

.patient-preview-id {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.patient-preview-details {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.patient-preview-more {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 6px;
  margin-top: 8px;
}

/* 单个患者详情预览样式 */
.patient-detail-preview {
  margin-top: 20px;
}

.patient-detail-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #bae6fd;
  border-radius: 12px;
}

.patient-detail-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.patient-detail-avatar svg {
  width: 32px;
  height: 32px;
  color: white;
}

.patient-detail-info {
  flex: 1;
}

.patient-detail-id {
  font-size: 18px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 8px;
}

.patient-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  display: inline-block;
  padding: 4px 12px;
  background: white;
  border: 1px solid #93c5fd;
  border-radius: 16px;
  font-size: 13px;
  color: #1e40af;
  font-weight: 500;
}

/* 删除进度条样式 */
.delete-progress-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.delete-progress-info {
  margin-bottom: 15px;
}

.progress-text {
  margin: 0 0 8px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 500;
}

.progress-count {
  margin: 0;
  color: #6c757d;
  font-size: 13px;
}

.delete-progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.delete-progress-bar {
  flex: 1;
  height: 24px;
  background-color: #e9ecef;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.delete-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  border-radius: 12px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.delete-progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: progress-shine 1.5s infinite;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.delete-progress-percentage {
  color: #495057;
  font-size: 14px;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.delete-current-patient {
  padding: 8px 12px;
  background-color: #e7f3ff;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  color: #0056b3;
  font-size: 13px;
}

/* 对话框底部样式 */
.delete-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e9ecef;
  background: #fafafa;
}

.cancel-btn {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 100px;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 140px;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.confirm-delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.confirm-delete-btn:active:not(:disabled) {
  transform: translateY(0);
}

.confirm-delete-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
