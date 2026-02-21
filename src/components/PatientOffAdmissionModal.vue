<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>患者离室后信息</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body">
        <div v-if="patientInfo" class="info-container">
          <div class="info-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>患者ID：</label>
                <span>{{ patient.patientId }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>生命体征</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>体温：</label>
                <span>{{ patientInfo.temperature }} °C</span>
              </div>
              <div class="info-item">
                <label>呼吸频率：</label>
                <span>{{ patientInfo.respiratoryRate }} 次/分</span>
              </div>
              <div class="info-item">
                <label>心率：</label>
                <span>{{ patientInfo.heartRate }} 次/分</span>
              </div>
              <div class="info-item">
                <label>血压：</label>
                <span>{{ patientInfo.systolicBp }}/{{ patientInfo.diastolicBp }} mmHg</span>
              </div>
              <div class="info-item">
                <label>指脉氧：</label>
                <span>{{ patientInfo.oxygenSaturation }}%</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>补液情况</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>总补液量：</label>
                <span>{{ patientInfo.totalFluidVolume }} ml</span>
              </div>
              <div class="info-item">
                <label>生理盐水：</label>
                <span>{{ patientInfo.salineSolution }} ml</span>
              </div>
              <div class="info-item">
                <label>平衡液：</label>
                <span>{{ patientInfo.balancedSolution }} ml</span>
              </div>
              <div class="info-item">
                <label>人工胶体：</label>
                <span>{{ patientInfo.artificialColloid }} ml</span>
              </div>
              <div class="info-item">
                <label>其他补液：</label>
                <span>{{ patientInfo.otherFluid || '无' }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>引流情况</h4>
            <div class="info-grid">
              <div class="info-item">
                <label>尿量：</label>
                <span>{{ patientInfo.urineOutput }} ml</span>
              </div>
              <div class="info-item">
                <label>其他引流量：</label>
                <span>{{ patientInfo.otherDrainage }} ml</span>
              </div>
              <div class="info-item">
                <label>出血量：</label>
                <span>{{ patientInfo.bloodLoss || '无' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="loading">
          <p>加载中...</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PatientOffAdmissionModal',
  props: {
    patient: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      patientInfo: null
    }
  },
  mounted() {
    this.fetchPatientInfo();
  },
  methods: {
    fetchPatientInfo() {
      const url = `/api/patient/off-admission/${this.patient.patientId}`;
      this.$axios.get(url)
        .then(res => {
          console.log('离室后信息数据:', res.data);
          if (res.data.data) {
            this.patientInfo = res.data.data;
          }
        })
        .catch(err => {
          console.error('获取离室后信息失败:', err);
          this.$message.error('获取离室后信息失败');
        });
    },
    closeModal() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
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
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
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
  color: #dc3545;
}

.modal-body {
  padding: 20px;
}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  background-color: #fafafa;
}

.info-section h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 16px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.info-item label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.info-item span {
  color: #6c757d;
  font-size: 14px;
  padding: 5px 0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 0 0 8px 8px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-header {
    padding: 15px;
  }
  
  .modal-body {
    padding: 15px;
  }
  
  .modal-footer {
    padding: 15px;
  }
}
</style>
