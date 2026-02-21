<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>RTS评分详情</h3>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="patient-info">
          <h4>患者信息</h4>
          <div class="patient-details">
            <div class="patient-item">
              <span class="label">患者ID:</span>
              <span class="value">{{ patient.patientId }}</span>
            </div>
            <div class="patient-item">
              <span class="label">性别:</span>
              <span class="value">{{ patient.gender }}</span>
            </div>
            <div class="patient-item">
              <span class="label">年龄:</span>
              <span class="value">{{ patient.age }}岁</span>
            </div>
          </div>
        </div>

        <div class="rts-score-section">
          <h4>RTS评分详情</h4>
          
          <div class="score-grid">
            <!-- GCS评分 -->
            <div class="score-item">
              <div class="score-label">GCS评分</div>
              <div class="score-value" :class="getScoreClass(patient.gcsScore)">
                {{ patient.gcsScore !== null && patient.gcsScore !== undefined ? patient.gcsScore : 'N/A' }}分
              </div>
              <div class="score-description">
                {{ getGcsDescription(patient.gcsScore) }}
              </div>
            </div>

            <!-- 收缩压评分 -->
            <div class="score-item">
              <div class="score-label">收缩压评分</div>
              <div class="score-value" :class="getScoreClass(patient.sbpScore)">
                {{ patient.sbpScore !== null && patient.sbpScore !== undefined ? patient.sbpScore : 'N/A' }}分
              </div>
              <div class="score-description">
                {{ getSbpDescription(patient.sbpScore) }}
              </div>
            </div>

            <!-- 呼吸频率评分 -->
            <div class="score-item">
              <div class="score-label">呼吸频率评分</div>
              <div class="score-value" :class="getScoreClass(patient.rrScore)">
                {{ patient.rrScore !== null && patient.rrScore !== undefined ? patient.rrScore : 'N/A' }}分
              </div>
              <div class="score-description">
                {{ getRrDescription(patient.rrScore) }}
              </div>
            </div>
          </div>


          <!-- 评分说明 -->
          <div class="score-explanation">
            <h5>RTS评分说明</h5>
            <div class="explanation-grid">
              <div class="explanation-item">
                <h6>GCS评分 (0-4分)</h6>
                <ul>
                  <li><strong>4分:</strong> GCS 13-15</li>
                  <li><strong>3分:</strong> GCS 9-12</li>
                  <li><strong>2分:</strong> GCS 6-8</li>
                  <li><strong>1分:</strong> GCS 4-5</li>
                  <li><strong>0分:</strong> GCS 3</li>
                </ul>
              </div>
              
              <div class="explanation-item">
                <h6>收缩压评分 (0-4分)</h6>
                <ul>
                  <li><strong>4分:</strong> SBP > 89</li>
                  <li><strong>3分:</strong> SBP 76-89</li>
                  <li><strong>2分:</strong> SBP 50-75</li>
                  <li><strong>1分:</strong> SBP 1-49</li>
                  <li><strong>0分:</strong> SBP 0</li>
                </ul>
              </div>
              
              <div class="explanation-item">
                <h6>呼吸频率评分 (0-4分)</h6>
                <ul>
                  <li><strong>4分:</strong> RR 10-29</li>
                  <li><strong>3分:</strong> RR > 29</li>
                  <li><strong>2分:</strong> RR 6-9</li>
                  <li><strong>1分:</strong> RR 1-5</li>
                  <li><strong>0分:</strong> RR 0</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RtsScoreModal',
  props: {
    patient: {
      type: Object,
      required: true
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },

    // 获取GCS评分描述
    getGcsDescription(score) {
      if (score === null || score === undefined) {
        return '未知';
      }
      const descriptions = {
        4: 'GCS 13-15 (轻度意识障碍)',
        3: 'GCS 9-12 (中度意识障碍)',
        2: 'GCS 6-8 (重度意识障碍)',
        1: 'GCS 4-5 (深度昏迷)',
        0: 'GCS 3 (极深度昏迷)'
      };
      return descriptions[score] !== undefined ? descriptions[score] : '未知';
    },

    // 获取收缩压评分描述
    getSbpDescription(score) {
      if (score === null || score === undefined) {
        return '未知';
      }
      const descriptions = {
        4: 'SBP > 89 (正常血压)',
        3: 'SBP 76-89 (轻度低血压)',
        2: 'SBP 50-75 (中度低血压)',
        1: 'SBP 1-49 (重度低血压)',
        0: 'SBP 0 (无血压)'
      };
      return descriptions[score] !== undefined ? descriptions[score] : '未知';
    },

    // 获取呼吸频率评分描述
    getRrDescription(score) {
      if (score === null || score === undefined) {
        return '未知';
      }
      const descriptions = {
        4: 'RR 10-29 (正常呼吸)',
        3: 'RR > 29 (呼吸急促)',
        2: 'RR 6-9 (呼吸缓慢)',
        1: 'RR 1-5 (呼吸微弱)',
        0: 'RR 0 (无呼吸)'
      };
      return descriptions[score] !== undefined ? descriptions[score] : '未知';
    },


    // 获取评分样式类
    getScoreClass(score) {
      if (score >= 4) return 'score-excellent';
      if (score >= 3) return 'score-good';
      if (score >= 2) return 'score-fair';
      if (score >= 1) return 'score-poor';
      return 'score-critical';
    },

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
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 8px 8px 0 0;
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
  color: #666;
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

.patient-info {
  margin-bottom: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.patient-info h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.patient-details {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.patient-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.patient-item .label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.patient-item .value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
  background-color: #fff;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.rts-score-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.score-item {
  text-align: center;
  padding: 15px 10px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.score-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.score-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.score-description {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  font-weight: 500;
  line-height: 1.3;
}


.score-explanation {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 25px;
  border-radius: 12px;
  border-left: 4px solid #007bff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-explanation h5 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.explanation-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.explanation-item {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.explanation-item h6 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.explanation-item ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.explanation-item li {
  margin-bottom: 8px;
  color: #666;
  line-height: 1.4;
  font-size: 12px;
  padding: 4px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 2px solid #007bff;
}

/* 评分颜色样式 */
.score-excellent {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.score-good {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 2px solid #bee5eb;
}

.score-fair {
  background-color: #fff3cd;
  color: #856404;
  border: 2px solid #ffeaa7;
}

.score-poor {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.score-critical {
  background-color: #f5c6cb;
  color: #721c24;
  border: 2px solid #f1aeb5;
}


@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .patient-details {
    flex-direction: column;
    gap: 15px;
  }
  
  .patient-item {
    justify-content: space-between;
  }
  
  .score-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  
  .explanation-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .score-value {
    font-size: 18px;
    min-height: 35px;
  }
  
  .score-label {
    font-size: 12px;
  }
  
  .score-description {
    font-size: 11px;
  }
}
</style>
