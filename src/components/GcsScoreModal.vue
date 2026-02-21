<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>GCS评分详情</h3>
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

        <div class="gcs-score-section">
          <h4>GCS评分详情</h4>
          
          <div class="score-grid">
            <!-- 睁眼评分 -->
            <div class="score-item">
              <div class="score-label">睁眼反应</div>
              <div class="score-value" :class="getEyeScoreClass(patient.eyeOpening)">
                {{ patient.eyeOpening || 'N/A' }}分
              </div>
              <div class="score-description">
                {{ patient.eyeDescription || getEyeDescription(patient.eyeOpening) }}
              </div>
            </div>

            <!-- 言语评分 -->
            <div class="score-item">
              <div class="score-label">言语反应</div>
              <div class="score-value" :class="getVerbalScoreClass(patient.verbalResponse)">
                {{ patient.verbalResponse || 'N/A' }}分
              </div>
              <div class="score-description">
                {{ patient.verbalDescription || getVerbalDescription(patient.verbalResponse) }}
              </div>
            </div>

            <!-- 运动评分 -->
            <div class="score-item">
              <div class="score-label">运动反应</div>
              <div class="score-value" :class="getMotorScoreClass(patient.motorResponse)">
                {{ patient.motorResponse || 'N/A' }}分
              </div>
              <div class="score-description">
                {{ patient.motorDescription || getMotorDescription(patient.motorResponse) }}
              </div>
            </div>
          </div>

          <!-- 总分和意识状态 -->
          <div class="total-score-section">
            <div class="total-score">
              <div class="score-label">GCS总分</div>
              <div class="score-value" :class="getTotalScoreClass(patient.totalScore)">
                {{ patient.totalScore || 'N/A' }}分
              </div>
              <div class="score-description">
                总分范围: 3-15分
              </div>
            </div>
            
            <div class="consciousness-level">
              <div class="score-label">意识状态</div>
              <div class="score-value" :class="getConsciousnessClass(patient.totalScore)">
                {{ patient.consciousnessLevel || getConsciousnessLevel(patient.totalScore) }}
              </div>
              <div class="score-description">
                基于GCS总分评估
              </div>
            </div>
          </div>

          <!-- 评分说明 -->
          <div class="score-explanation">
            <h5>GCS评分说明</h5>
            <ul>
              <li><strong>睁眼反应:</strong> 4分-自动睁眼, 3分-呼唤睁眼, 2分-疼痛睁眼, 1分-不睁眼</li>
              <li><strong>言语反应:</strong> 5分-回答正确, 4分-回答错误, 3分-言语不当, 2分-言语不清, 1分-无言语</li>
              <li><strong>运动反应:</strong> 6分-遵嘱动作, 5分-定位动作, 4分-逃避动作, 3分-屈曲动作, 2分-伸展动作, 1分-无动作</li>
              <li><strong>总分范围:</strong> 3-15分，分数越高意识状态越好</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GcsScoreModal',
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

    // 获取睁眼评分描述
    getEyeDescription(score) {
      const descriptions = {
        4: '自动睁眼',
        3: '呼唤睁眼', 
        2: '疼痛睁眼',
        1: '不睁眼'
      };
      return descriptions[score] || '未知';
    },

    // 获取言语评分描述
    getVerbalDescription(score) {
      const descriptions = {
        5: '回答正确',
        4: '回答错误',
        3: '言语不当',
        2: '言语不清',
        1: '无言语'
      };
      return descriptions[score] || '未知';
    },

    // 获取运动评分描述
    getMotorDescription(score) {
      const descriptions = {
        6: '遵嘱动作',
        5: '定位动作',
        4: '逃避动作',
        3: '屈曲动作',
        2: '伸展动作',
        1: '无动作'
      };
      return descriptions[score] || '未知';
    },

    // 获取意识状态
    getConsciousnessLevel(totalScore) {
      if (totalScore >= 13) return '轻度意识障碍';
      if (totalScore >= 9) return '中度意识障碍';
      if (totalScore >= 3) return '重度意识障碍';
      return '深度昏迷';
    },

    // 获取睁眼评分样式类
    getEyeScoreClass(score) {
      if (score >= 4) return 'score-excellent';
      if (score >= 3) return 'score-good';
      if (score >= 2) return 'score-fair';
      return 'score-poor';
    },

    // 获取言语评分样式类
    getVerbalScoreClass(score) {
      if (score >= 5) return 'score-excellent';
      if (score >= 4) return 'score-good';
      if (score >= 3) return 'score-fair';
      return 'score-poor';
    },

    // 获取运动评分样式类
    getMotorScoreClass(score) {
      if (score >= 6) return 'score-excellent';
      if (score >= 5) return 'score-good';
      if (score >= 4) return 'score-fair';
      return 'score-poor';
    },

    // 获取总分样式类
    getTotalScoreClass(score) {
      if (score >= 13) return 'score-excellent';
      if (score >= 9) return 'score-good';
      if (score >= 3) return 'score-fair';
      return 'score-poor';
    },

    // 获取意识状态样式类
    getConsciousnessClass(score) {
      if (score >= 13) return 'consciousness-mild';
      if (score >= 9) return 'consciousness-moderate';
      if (score >= 3) return 'consciousness-severe';
      return 'consciousness-coma';
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

.gcs-score-section h4 {
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

.total-score-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.total-score, .consciousness-level {
  text-align: center;
  padding: 15px 10px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.total-score:hover, .consciousness-level:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.total-score .score-label, .consciousness-level .score-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.total-score .score-value, .consciousness-level .score-value {
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

.total-score .score-description, .consciousness-level .score-description {
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

.score-explanation ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.score-explanation li {
  margin-bottom: 12px;
  color: #666;
  line-height: 1.6;
  padding: 8px 12px;
  background-color: #fff;
  border-radius: 6px;
  border-left: 3px solid #007bff;
  font-weight: 500;
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

/* 意识状态颜色样式 */
.consciousness-mild {
  background-color: #d4edda;
  color: #155724;
}

.consciousness-moderate {
  background-color: #fff3cd;
  color: #856404;
}

.consciousness-severe {
  background-color: #f8d7da;
  color: #721c24;
}

.consciousness-coma {
  background-color: #f5c6cb;
  color: #721c24;
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
  
  .total-score-section {
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
