<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <!-- 标题和关闭按钮 -->
      <div class="modal-header">
        <h3>患者列表 (共 {{ patientIds.length }} 人)</h3>
        <button class="close-btn" @click="closeModal">&times;</button>
      </div>

      <!-- 患者列表 -->
      <div class="modal-body">
        <div v-if="patientIds.length === 0" class="empty-state">
          <p>该位置没有找到患者数据</p>
        </div>
        <div v-else>
          <div class="patient-list">
            <div 
              v-for="patientId in paginatedPatientIds" 
              :key="patientId" 
              class="patient-item"
            >
              <div class="patient-id">患者ID: {{ patientId }}</div>
              <div class="patient-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="showInjury(patientId)"
                  :loading="loadingStates[`injury_${patientId}`]"
                >
                  查看受伤程度
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="showIntervention(patientId)"
                  :loading="loadingStates[`intervention_${patientId}`]"
                >
                  干预时间
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="showGcs(patientId)"
                  :loading="loadingStates[`gcs_${patientId}`]"
                >
                  GCS
                </el-button>
                <el-button 
                  type="info" 
                  size="small" 
                  @click="showRts(patientId)"
                  :loading="loadingStates[`rts_${patientId}`]"
                >
                  RTS
                </el-button>
                <el-button 
                  type="primary" 
                  size="small" 
                  plain
                  @click="showOnAdmission(patientId)"
                  :loading="loadingStates[`onAdmission_${patientId}`]"
                >
                  入室前信息
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  plain
                  @click="showOffAdmission(patientId)"
                  :loading="loadingStates[`offAdmission_${patientId}`]"
                >
                  离室后信息
                </el-button>
              </div>
            </div>
          </div>
          
          <!-- 分页组件 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-if="totalPages > 1"
              @current-change="handlePageChange"
              :current-page="currentPage"
              :page-size="pageSize"
              :total="patientIds.length"
              layout="total, prev, pager, next, jumper"
              background
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 受伤程度弹窗 -->
    <InjuryFigureModal 
      v-if="showInjuryModal" 
      :patient="currentInjuryPatient"
      :patients="[]"
      :current-index="0"
      @close="closeInjuryModal"
    />

    <!-- 干预时间弹窗 -->
    <InterventionTimelineDialog
      v-if="showInterventionModal"
      :patient-id="currentPatientId"
      @close="closeInterventionModal"
    />

    <!-- GCS评分弹窗 -->
    <GcsScoreModal
      v-if="showGcsModal"
      :patient="currentGcsPatient"
      @close="closeGcsModal"
    />

    <!-- RTS评分弹窗 -->
    <RtsScoreModal
      v-if="showRtsModal"
      :patient="currentRtsPatient"
      @close="closeRtsModal"
    />

    <!-- 入室前信息弹窗 -->
    <PatientInfoOnAdmissionModal
      v-if="showOnAdmissionModal"
      :patient-id="currentPatientId"
      :patient-info="currentOnAdmissionData"
      @close="closeOnAdmissionModal"
    />

    <!-- 离室后信息弹窗 -->
    <PatientInfoOffAdmissionModal
      v-if="showOffAdmissionModal"
      :patient-id="currentPatientId"
      :patient-info="currentOffAdmissionData"
      @close="closeOffAdmissionModal"
    />
  </div>
</template>

<script>
import InjuryFigureModal from './InjuryFigureModal.vue';
import InterventionTimelineDialog from './InterventionTimelineDialog.vue';
import GcsScoreModal from './GcsScoreModal.vue';
import RtsScoreModal from './RtsScoreModal.vue';
import PatientInfoOnAdmissionModal from './PatientInfoOnAdmissionModal.vue';
import PatientInfoOffAdmissionModal from './PatientInfoOffAdmissionModal.vue';

export default {
  name: 'PatientListModal',
  components: {
    InjuryFigureModal,
    InterventionTimelineDialog,
    GcsScoreModal,
    RtsScoreModal,
    PatientInfoOnAdmissionModal,
    PatientInfoOffAdmissionModal
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    patientIds: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loadingStates: {},
      showInjuryModal: false,
      showInterventionModal: false,
      showGcsModal: false,
      showRtsModal: false,
      showOnAdmissionModal: false,
      showOffAdmissionModal: false,
      currentPatientId: null,
      currentInjuryPatient: null,
      currentGcsPatient: null,
      currentRtsPatient: null,
      currentOnAdmissionData: null,
      currentOffAdmissionData: null,
      // 分页相关
      currentPage: 1,
      pageSize: 10
    };
  },
  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.patientIds.length / this.pageSize);
    },
    // 计算当前页显示的患者ID列表
    paginatedPatientIds() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.patientIds.slice(start, end);
    }
  },
  watch: {
    // 当patientIds变化时，重置到第一页
    patientIds: {
      handler() {
        this.currentPage = 1;
      },
      immediate: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    
    // 分页相关方法
    handlePageChange(page) {
      this.currentPage = page;
      // 滚动到顶部
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    },
    
    setLoading(key, value) {
      // 使用Vue.set确保响应式更新
      this.$set(this.loadingStates, key, value);
    },

    // 查看受伤程度
    async showInjury(patientId) {
      console.log('点击查看受伤程度，患者ID:', patientId);
      this.setLoading(`injury_${patientId}`, true);
      try {
        console.log('发起请求: /api/iss/injury/' + patientId);
        const res = await this.$axios.get(`/api/iss/injury/${patientId}`);
        console.log('受伤程度数据响应:', res.data);
        if (res.data.success && res.data.data) {
          this.currentInjuryPatient = {
            patientId: patientId,
            ...res.data.data
          };
          this.showInjuryModal = true;
        } else {
          this.$message.error('获取受伤程度数据失败');
        }
      } catch (err) {
        console.error('获取受伤程度数据失败:', err);
        console.error('错误详情:', err.response ? err.response.data : err.message);
        this.$message.error('获取受伤程度数据失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        this.setLoading(`injury_${patientId}`, false);
      }
    },

    closeInjuryModal() {
      this.showInjuryModal = false;
      this.currentInjuryPatient = null;
    },

    // 查看干预时间
    showIntervention(patientId) {
      this.currentPatientId = patientId;
      this.showInterventionModal = true;
    },

    closeInterventionModal() {
      this.showInterventionModal = false;
      this.currentPatientId = null;
    },

    // 查看GCS评分
    async showGcs(patientId) {
      console.log('点击查看GCS评分，患者ID:', patientId);
      this.setLoading(`gcs_${patientId}`, true);
      try {
        console.log('发起请求: /api/gcs/score/' + patientId);
        const res = await this.$axios.get(`/api/gcs/score/${patientId}`);
        console.log('GCS评分数据响应:', res.data);
        if (res.data.success && res.data.data) {
          this.currentGcsPatient = {
            patientId: patientId,
            ...res.data.data
          };
          console.log('设置GCS患者数据:', this.currentGcsPatient);
          this.showGcsModal = true;
        } else {
          this.$message.error('获取GCS评分数据失败');
        }
      } catch (err) {
        console.error('获取GCS评分数据失败:', err);
        console.error('错误详情:', err.response ? err.response.data : err.message);
        this.$message.error('获取GCS评分数据失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        this.setLoading(`gcs_${patientId}`, false);
      }
    },

    closeGcsModal() {
      this.showGcsModal = false;
      this.currentGcsPatient = null;
    },

    // 查看RTS评分
    async showRts(patientId) {
      console.log('点击查看RTS评分，患者ID:', patientId);
      this.setLoading(`rts_${patientId}`, true);
      try {
        console.log('发起请求: /api/rts/score/' + patientId);
        const res = await this.$axios.get(`/api/rts/score/${patientId}`);
        console.log('RTS评分数据响应:', res.data);
        if (res.data.success && res.data.data) {
          this.currentRtsPatient = {
            patientId: patientId,
            ...res.data.data
          };
          console.log('设置RTS患者数据:', this.currentRtsPatient);
          this.showRtsModal = true;
        } else {
          this.$message.error('获取RTS评分数据失败');
        }
      } catch (err) {
        console.error('获取RTS评分数据失败:', err);
        console.error('错误详情:', err.response ? err.response.data : err.message);
        this.$message.error('获取RTS评分数据失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        this.setLoading(`rts_${patientId}`, false);
      }
    },

    closeRtsModal() {
      this.showRtsModal = false;
      this.currentRtsPatient = null;
    },

    // 查看入室前信息
    async showOnAdmission(patientId) {
      this.setLoading(`onAdmission_${patientId}`, true);
      try {
        const res = await this.$axios.get(`/api/patient/on-admission/${patientId}`);
        if (res.data.success) {
          this.currentPatientId = patientId;
          // 允许显示空数据，如果数据不存在则显示空对象
          this.currentOnAdmissionData = res.data.data || {};
          this.showOnAdmissionModal = true;
        } else {
          this.$message.error(res.data.errorMsg || '获取入室前信息失败');
        }
      } catch (err) {
        console.error('获取入室前信息失败:', err);
        this.$message.error('获取入室前信息失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        this.setLoading(`onAdmission_${patientId}`, false);
      }
    },

    closeOnAdmissionModal() {
      this.showOnAdmissionModal = false;
      this.currentPatientId = null;
      this.currentOnAdmissionData = null;
    },

    // 查看离室后信息
    async showOffAdmission(patientId) {
      this.setLoading(`offAdmission_${patientId}`, true);
      try {
        const res = await this.$axios.get(`/api/patient/off-admission/${patientId}`);
        if (res.data.success) {
          this.currentPatientId = patientId;
          // 允许显示空数据，如果数据不存在则显示空对象
          this.currentOffAdmissionData = res.data.data || {};
          this.showOffAdmissionModal = true;
        } else {
          this.$message.error(res.data.errorMsg || '获取离室后信息失败');
        }
      } catch (err) {
        console.error('获取离室后信息失败:', err);
        this.$message.error('获取离室后信息失败: ' + (err.response?.data?.errorMsg || err.message));
      } finally {
        this.setLoading(`offAdmission_${patientId}`, false);
      }
    },

    closeOffAdmissionModal() {
      this.showOffAdmissionModal = false;
      this.currentPatientId = null;
      this.currentOffAdmissionData = null;
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
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.patient-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.patient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #fafafa;
  transition: all 0.3s ease;
}

.patient-item:hover {
  background-color: #f0f2f5;
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.patient-id {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  min-width: 120px;
}

.patient-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .patient-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .patient-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .patient-actions .el-button {
    flex: 1;
    min-width: calc(50% - 4px);
  }
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #e0e0e0;
}
</style>

