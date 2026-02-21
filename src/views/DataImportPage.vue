<template>
  <div class="data-import-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>
        <i class="el-icon-upload"></i>
        数据导入管理
      </h1>
      <div class="header-actions">
        <button @click="goBack" class="back-btn">
          <i class="el-icon-arrow-left"></i>
          返回
        </button>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-section">
      <el-card class="upload-card">
        <div slot="header">
          <span>选择Excel文件</span>
        </div>
        <el-upload
          class="upload-dragger"
          drag
          :action="uploadAction"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :file-list="fileList"
          :auto-upload="false"
          ref="upload"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">只能上传Excel文件（.xlsx, .xls）</div>
        </el-upload>
        <div class="upload-actions">
          <el-button type="primary" @click="submitUpload" :loading="uploading">
            <i class="el-icon-upload2"></i>
            上传文件
          </el-button>
          <el-button @click="clearFiles">
            <i class="el-icon-delete"></i>
            清空文件
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 数据表导入区域 -->
    <div class="import-tables-section">
      <el-card class="tables-card">
        <div slot="header">
          <span>数据表导入</span>
        </div>
        <div class="tables-grid">
          <div
            v-for="table in tables"
            :key="table.name"
            class="table-card"
            :class="{ 'disabled': !currentFilePath }"
          >
            <div class="table-header">
              <i :class="table.icon"></i>
              <span class="table-name">{{ table.label }}</span>
            </div>
            <div class="table-actions">
              <el-button
                type="primary"
                size="small"
                @click="importTable(table)"
                :loading="table.importing"
                :disabled="!currentFilePath"
              >
                <i class="el-icon-upload2"></i>
                导入数据
              </el-button>
            </div>
            <div v-if="table.importResult" class="table-status">
              <div
                v-if="table.importResult.success"
                class="status-success"
              >
                <i class="el-icon-success"></i>
                导入成功（{{ table.importResult.successCount }} 条记录）
              </div>
              <div v-else class="status-error">
                <i class="el-icon-error"></i>
                导入失败（{{ table.importResult.errorCount || 0 }} 个错误）
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 验证结果对话框 -->
    <el-dialog
      title="数据验证结果"
      :visible.sync="validationDialogVisible"
      width="80%"
      :before-close="handleDialogClose"
    >
      <div v-if="currentValidationResult">
        <div class="validation-summary">
          <el-alert
            :title="currentValidationResult.valid ? '验证通过' : '验证失败'"
            :type="currentValidationResult.valid ? 'success' : 'error'"
            :description="`共发现 ${currentValidationResult.errorCount} 个错误`"
            show-icon
            :closable="false"
          ></el-alert>
        </div>
        <div v-if="currentValidationResult.errors && currentValidationResult.errors.length > 0" class="errors-table">
          <el-table :data="currentValidationResult.errors" border stripe max-height="400">
            <el-table-column prop="row" label="行号" width="80" align="center"></el-table-column>
            <el-table-column prop="patientId" label="患者ID" width="100" align="center"></el-table-column>
            <el-table-column prop="field" label="字段" width="150"></el-table-column>
            <el-table-column prop="value" label="错误值" width="150"></el-table-column>
            <el-table-column prop="message" label="错误原因" show-overflow-tooltip></el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DataImportPage',
  data() {
    return {
      uploadAction: '', // 不使用自动上传
      fileList: [],
      currentFilePath: null,
      uploading: false,
      validationDialogVisible: false,
      currentValidationResult: null,
      tables: [
        {
          name: 'patient',
          label: '患者基本信息',
          icon: 'el-icon-user',
          importing: false,
          importResult: null
        },
        {
          name: 'injury_record',
          label: '受伤记录',
          icon: 'el-icon-document',
          importing: false,
          importResult: null
        },
        {
          name: 'gcs_score',
          label: 'GCS评分',
          icon: 'el-icon-data-line',
          importing: false,
          importResult: null
        },
        {
          name: 'rts_score',
          label: 'RTS评分',
          icon: 'el-icon-data-line',
          importing: false,
          importResult: null
        },
        {
          name: 'patient_info_on_admission',
          label: '患者入室信息',
          icon: 'el-icon-s-home',
          importing: false,
          importResult: null
        },
        {
          name: 'patient_info_off_admission',
          label: '患者离室信息',
          icon: 'el-icon-s-home',
          importing: false,
          importResult: null
        },
        {
          name: 'intervention_time',
          label: '干预时间',
          icon: 'el-icon-time',
          importing: false,
          importResult: null
        },
        {
          name: 'intervention_extra',
          label: '干预补充数据',
          icon: 'el-icon-document-copy',
          importing: false,
          importResult: null
        },
        {
          name: 'iss',
          label: 'ISS数据',
          icon: 'el-icon-data-analysis',
          importing: false,
          importResult: null
        }
      ]
    }
  },
  methods: {
    beforeUpload(file) {
      // 检查文件类型
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.endsWith('.xlsx') ||
                     file.name.endsWith('.xls')
      if (!isExcel) {
        this.$message.error('只能上传Excel文件（.xlsx, .xls）！')
        return false // 阻止添加不正确的文件类型
      }
      // 由于设置了 auto-upload="false"，返回 true 允许文件添加到列表，但不会自动上传
      return true
    },
    handleFileChange(file, fileList) {
      // 更新文件列表
      this.fileList = fileList
      console.log('文件已选择:', file.name)
    },
    submitUpload() {
      if (this.fileList.length === 0) {
        this.$message.warning('请先选择文件')
        return
      }
      
      const file = this.fileList[0].raw
      const formData = new FormData()
      formData.append('file', file)
      
      this.uploading = true
      // 上传文件，只保存文件，不执行导入
      axios.post('/api/upload/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(response => {
        this.uploading = false
        if (response.data.success) {
          const data = response.data.data
          if (data && data.filePath) {
            this.currentFilePath = data.filePath
            console.log('文件路径已设置:', this.currentFilePath)
            this.$message.success('文件上传成功，可以开始导入数据')
          } else {
            console.error('后端返回的数据中没有filePath:', data)
            this.$message.error('文件上传成功，但未获取到文件路径')
          }
        } else {
          this.$message.error(response.data.errorMsg || '文件上传失败')
        }
      })
      .catch(error => {
        this.uploading = false
        console.error('上传失败:', error)
        this.$message.error('文件上传失败: ' + (error.response?.data?.errorMsg || error.message))
      })
    },
    // eslint-disable-next-line no-unused-vars
    handleUploadSuccess(_response, _file) {
      // 不使用自动上传，此方法不会被调用
    },
    // eslint-disable-next-line no-unused-vars
    handleUploadError(_error) {
      this.$message.error('文件上传失败')
    },
    clearFiles() {
      this.fileList = []
      this.currentFilePath = null
      // 重置所有表的状态
      this.tables.forEach(table => {
        table.importResult = null
      })
    },
    importTable(table) {
      if (!this.currentFilePath) {
        this.$message.warning('请先上传文件')
        return
      }
      
      table.importing = true
      
      // 根据表名调用不同的导入接口
      let endpoint = ''
      if (table.name === 'patient') {
        endpoint = '/api/upload/import/patient'
      } else if (table.name === 'injury_record') {
        endpoint = '/api/upload/import/injury'
      } else if (table.name === 'iss') {
        endpoint = '/api/upload/import/iss'
      } else if (table.name === 'intervention_time') {
        endpoint = '/api/upload/import/intervention-time'
      } else if (table.name === 'gcs_score') {
        endpoint = '/api/upload/import/gcs-score'
      } else if (table.name === 'rts_score') {
        endpoint = '/api/upload/import/rts-score'
      } else if (table.name === 'patient_info_on_admission') {
        endpoint = '/api/upload/import/patient-info-on-admission'
      } else if (table.name === 'patient_info_off_admission') {
        endpoint = '/api/upload/import/patient-info-off-admission'
      } else if (table.name === 'intervention_extra') {
        endpoint = '/api/upload/import/intervention-extra'
      } else {
        table.importing = false
        this.$message.warning(`${table.label} 的导入功能尚未实现`)
        return
      }
      
      // 使用查询参数传递filePath，Spring的@RequestParam支持从查询参数读取
      axios.post(endpoint, null, {
        params: {
          filePath: this.currentFilePath
        }
      })
      .then(response => {
        table.importing = false
        if (response.data.success) {
          const data = response.data.data
          
          // 构建导入结果对象
          const importResult = {
            success: data.success || false,
            successCount: data.import?.successCount || 0,
            failedCount: data.import?.failedCount || 0,
            errorCount: data.validation?.errorCount || 0,
            message: data.message || data.import?.message || ''
          }
          
          table.importResult = importResult
          
          if (importResult.success) {
            // 导入成功，显示成功信息和记录条数
            this.$message.success(`${table.label} 导入成功，成功导入 ${importResult.successCount} 条记录`)
          } else {
            // 导入失败（验证有错误），显示错误信息
            this.$message.error(`${table.label} 导入失败：${importResult.message}`)
            
            // 如果有验证错误，显示错误详情
            if (data.validation && data.validation.errors && data.validation.errors.length > 0) {
              this.currentValidationResult = data.validation
              this.validationDialogVisible = true
            }
          }
        } else {
          table.importResult = {
            success: false,
            successCount: 0,
            failedCount: 0,
            errorCount: 0,
            message: response.data.errorMsg || '导入失败'
          }
          this.$message.error(response.data.errorMsg || '导入失败')
        }
      })
      .catch(error => {
        table.importing = false
        console.error('导入失败:', error)
        const errorMsg = error.response?.data?.errorMsg || error.message || '导入失败'
        table.importResult = {
          success: false,
          successCount: 0,
          failedCount: 0,
          errorCount: 0,
          message: errorMsg
        }
        this.$message.error('导入失败: ' + errorMsg)
      })
    },
    handleDialogClose() {
      this.validationDialogVisible = false
      this.currentValidationResult = null
    },
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style scoped>
.data-import-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  background: #66b1ff;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-card {
  border-radius: 8px;
}

.upload-dragger {
  width: 100%;
}

.upload-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.import-tables-section {
  margin-top: 20px;
}

.tables-card {
  border-radius: 8px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.table-card {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  transition: all 0.3s;
}

.table-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.table-status {
  margin-top: 10px;
  padding: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.status-success {
  color: #67c23a;
  background: #f0f9ff;
}

.status-error {
  color: #f56c6c;
  background: #fef0f0;
}

.validation-summary {
  margin-bottom: 20px;
}

.errors-table {
  margin-top: 20px;
}

.import-stats {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.import-stats p {
  margin: 5px 0;
  font-size: 14px;
}
</style>

