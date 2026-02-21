<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>入室前信息 - 患者ID: {{ patientId }}</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div v-if="patientInfo === null" class="loading-state">
          <p>加载中...</p>
        </div>
        <div v-else-if="!patientInfo || Object.keys(patientInfo).length === 0" class="empty-state">
          <p>暂无入室前信息</p>
        </div>
        <div v-else class="info-content">
          <div class="info-section">
            <h4>生命体征</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">血压:</span>
                <span class="value">
                  {{ patientInfo.systolicBp || 0 }}/{{ patientInfo.diastolicBp || 0 }} mmHg
                </span>
              </div>
              <div class="info-item">
                <span class="label">心率:</span>
                <span class="value">{{ patientInfo.heartRate || 0 }} 次/分</span>
              </div>
              <div class="info-item">
                <span class="label">呼吸频率:</span>
                <span class="value">{{ patientInfo.respiratoryRate || 0 }} 次/分</span>
              </div>
              <div class="info-item">
                <span class="label">体温:</span>
                <span class="value">{{ patientInfo.temperature || 0 }} °C</span>
              </div>
              <div class="info-item">
                <span class="label">指脉氧:</span>
                <span class="value">{{ patientInfo.oxygenSaturation || 0 }} %</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>意识状态</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">精神意识:</span>
                <span class="value">{{ patientInfo.consciousness || '未记录' }}</span>
              </div>
              <div class="info-item">
                <span class="label">瞳孔:</span>
                <span class="value">{{ patientInfo.pupil || '未记录' }}</span>
              </div>
              <div class="info-item">
                <span class="label">对光反射:</span>
                <span class="value">{{ patientInfo.lightReflex || '未记录' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>其他信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">皮肤:</span>
                <span class="value">{{ patientInfo.skin || '未记录' }}</span>
              </div>
              <div class="info-item">
                <span class="label">醉酒:</span>
                <span class="value">{{ patientInfo.drunk ? '是' : '否' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="label">既往病史:</span>
                <span class="value">{{ patientInfo.medicalHistory || '无' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <el-button @click="closeModal">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PatientInfoOnAdmissionModal',
  props: {
    patientId: {
      type: Number,
      required: true
    },
    patientInfo: {
      type: Object,
      default: null
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f7fa;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #909399;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #303133;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 16px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background-color: #fafafa;
}

.info-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 2px solid #409EFF;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-item .value {
  font-size: 15px;
  color: #303133;
  font-weight: 600;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>

