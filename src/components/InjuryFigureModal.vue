<template>
  <div>
    <transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <!-- 标题和关闭按钮 -->
          <div class="modal-header">
            <h3>病人受伤人体图 (ID: {{ patient.patientId }})</h3>
            <button class="close-btn" @click="closeModal">&times;</button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-container">
            <div class="spinner"></div>
            <p>加载伤情信息中...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="error" class="error-container">
            <p>⚠️ {{ errorMessage }}</p>
            <button @click="fetchInjuryData">重试</button>
          </div>

          <!-- 内容区域 -->
          <div v-else class="modal-body">
            <!-- 受伤等级展示 -->
            <div class="injury-summary">
              <div class="severity-indicator" :class="'severity-' + patient.injurySeverity">
                <div class="severity-info">
                    <span class="severity-text">损伤等级：{{ severityText }}</span>
                    <span class="iss-score">ISS评分：{{ patient.issScore }}</span>
                </div>
              </div>
            
              <div class="color-legend">
                <h4>创伤等级颜色指示</h4>
                <div class="legend-items">
                  <div v-for="i in 7" :key="i" class="legend-item">
                    <span class="color-box" :style="{ backgroundColor: getGradientColor(i-1) }"></span>
                    <span class="level-label">等级 {{ i-1 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SVG人体图和部位详情 -->
            <div class="injury-details">
              <div class="svg-container">
                <div ref="svgContainer" class="human-figure">
                  <p v-if="!svgLoaded" class="svg-placeholder">加载人体图中...</p>
                </div>
              </div>
              
              <div class="injury-levels">
                <div 
                  v-for="(level, partName) in injuryLevels" 
                  :key="partName" 
                  class="injury-item"
                  :class="{ highlighted: highlightedPart === partName }"
                  @mouseenter="highlightPart(partName)"
                  @mouseleave="unhighlightPart"
                >
                  <div class="injury-item-header">
                    <span class="part-name">{{ partNames[partName] }}:</span>
                    <span class="part-level" :style="{ color: getGradientColor(level) }">
                      {{ formatScore(partName) }} ({{ getLevelDescription(level) }})
                    </span>
                  </div>
                  <!-- 显示详细伤情信息 -->
                  <div v-if="getInjuryDetails(partName)" class="injury-details">
                    <div class="details-content" v-html="getInjuryDetails(partName)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <!-- 轮播导航按钮 -->
            <div class="carousel-nav" v-if="patients.length > 1">
              <button class="nav-btn prev" @click="$emit('prev')" :disabled="patients.length <= 1">
                <i class="fas fa-chevron-left"></i> 上一个
              </button>
              <button class="nav-btn next" @click="$emit('next')" :disabled="patients.length <= 1">
                下一个 <i class="fas fa-chevron-right"></i>
              </button>
            </div>
              <!-- 患者轮播指示器 -->
              <div class="patient-carousel-indicator" v-if="patients.length > 1">
                <span class="indicator-text">患者 {{ currentIndex + 1 }} / {{ patients.length }}</span>
                <div class="indicator-dots">
                  <span 
                    v-for="(p, index) in patients" 
                    :key="p.patientId" 
                    :class="['dot', { active: index === currentIndex }]"
                    @click="$emit('goto', index)"
                  ></span>
                </div>
              </div>        
            <button class="btn-close" @click="closeModal">关闭</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    patient: {
      type: Object,
      required: true
    },
    patients: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      visible: true,
      injuryLevels: {
        neck: 0,
        face: 0,
        chest: 0,
        abdomen: 0,
        limbs: 0,
        body: 0
      },
      loading: false,
      error: false,
      errorMessage: '',
      highlightedPart: null,
      svgLoaded: false,
      // SVG字符串占位符 - 实际使用时替换为完整SVG
      svgStr: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <!-- 简化的SVG内容，实际使用时替换为完整SVG -->
        <g>
          <!--面部-->
          <path class="face" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;M256,63.613L256,63.613c-13.282,0-24.048-10.767-24.048-24.048v-8.016C231.952,18.267,242.718,7.5,256,7.5h0&#10;&#9;&#9;c13.282,0,24.048,10.767,24.048,24.048v8.016C280.048,52.846,269.282,63.613,256,63.613z"/>
          <!--左手-->
          <path class="limbs" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="
          M180.208,243.765c-2.84,7.953-8.12,14.805-15.085,19.579l-15.318,10.5c-8.221,5.635-19.371,4.151-25.831-3.439h0c-6.42-7.542-4.534-19.044,3.959-24.140l23.858-14.315" />
          <!--左臂-->
          <path style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="M215.919,143.774l-35.711,99.991M150.066,229.45l12.277-41.983" /> 
          <!--右手-->
          <path class="limbs" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;M365.280, 233.929l23.858,14.315c8.493,5.096,10.38,16.598,3.959,24.140l0,0c-6.461,7.59-17.61,9.074-25.831,3.439l-15.318-10.5&#10;&#9;&#9;c-6.965-4.774-12.245-11.627-15.085-19.579"/>
          <!--右臂-->
          <path style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;M288.065,85.276l21.240,7.080c9.958,3.319,17.660,11.302,20.622,21.372l35.353,120.201&#10;&#9;&#9;M332.073,246.322l-35.711-99.991"/>
          <!---->
          <path style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;M296.081,239.968l-26.342,15.805C261.215,260.887,256,270.098,256,280.038v0.011l4.270,59.783&#10;&#9;&#9;c0.820,11.482,10.374,20.378,21.885,20.378h0c12.118,0,21.941-9.823,21.941-21.941"/>
	
      <polyline style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" points="&#10;&#9;&#9;304.097,472.435 269.801,463.411 291.999,358.948 &#9;"/>
    
		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="256" y1="167.823" x2="256" y2="95.677"/>

		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="247.984" y1="167.823" x2="264.016" y2="167.823"/>

    
  
		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="151.790" y1="231.952" x2="175.277" y2="251.873"/>
	
		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="189.532" y1="184.081" x2="196.714" y2="186.257"/>
	
		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="360.210" y1="231.952" x2="336.723" y2="251.873"/>
	
		<line style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" x1="322.468" y1="184.081" x2="315.286" y2="186.257"/>
		<!--左肩-->
    <path style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
      M229.794,139.901
      l-14.801-6.743
      l-41.821,26.095
      l13.971-47.502
      c2.962-10.070,10.664-18.052,20.622-21.372
      l21.240-7.080&#10;&#9;&#9;"/>
    <!--颈部-->
    <path class="neck" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="
      M272.032,62.422
      V68.090
      c0,6.901,4.416,13.027,10.962,15.210     
      l-28.065,10.276
      l-28.065,-10.276
      c6.547-2.182,10.962-8.309,10.962-15.210
      V62.422
    " />
		<polyline style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" points="&#10;&#9;&#9;282.206,139.901 297.006,133.158 338.028,159.488 &#9;"/>
    <path class="limbs" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
  M242.199,463.411L241.031,489.610c-0.599,8.390-7.580,14.890-15.992,14.890h-41.185v-6.715c0-10.351,6.624-19.541,16.444-22.814l7.605-2.535&#10;&#9;&#9;
  "/>
  <!--右脚-->
  <path class="limbs" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
  M304.097, 472.436l7.605,2.535c9.820,3.273,16.444,12.463,16.444,22.814v6.715H286.960c-8.411,0-15.392-6.500-15.992-14.890&#10;&#9;&#9;L269.801,463.411"/>
<!--腹部-->
 <path class="abdomen" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
M 216.539, 233.790
l5.623-19.679c1.171-4.097,1.513-8.387,1.007-12.618
L289.114,204.050
c-0.506,4.231-0.164,8.520,1.007,12.618&#10;&#9;&#9;
l5.623,19.679
l-26.342,15.805
C261.215,260.887,256,270.098,256,280.038
  "/>
<!--左侧大腿-->
<path class="body" style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
M215.919,239.968
l26.342,15.805
c8.523,5.114,13.738,14.325,13.738,24.264
v0.011l-4.270,59.783&#10;&#9;&#9;
c-0.820,11.482-10.374,20.378-21.885,20.378
h0
c-12.118,0-21.941-9.823-21.941-21.941"/>
  <!--胸部-->
 <path class="chest" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" 
  d="&#10;&#9;&#9;
  M296.363,146.331
  l0.926-10.616
l-8.175,68.335
L223.169,201.493
l-8.175-68.335
l0.926,10.616
L296.363,146.331
"/>
  <!--身体右侧-->
    <path class="body" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" 
    d="&#10;&#9;&#9;
    M295.744,236.347
  c5.729,20.053,8.636,40.806,8.636,61.662
  v6.271
  L304.097,332.736  v139.700
  L269.801,463.411
  L256,280.048
  "/>
  <!--身体左侧-->
  <path class="body" style="stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;
M256,280.048
L242.199,463.411
L207.903,472.435
V295.452
c0-20.855,2.907-41.609,8.636-61.662
  "/>
	<path style="fill:none;stroke:#000000;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;" d="&#10;&#9;&#9;M304.097,332.736v139.700l7.605,2.535c9.820,3.273,16.444,12.463,16.444,22.814v6.715H286.960c-8.411,0-15.392-6.500-15.992-14.890&#10;&#9;&#9;L256,280.048L241.031,489.610c-0.599,8.390-7.580,14.890-15.992,14.890h-41.185v-6.715c0-10.351,6.624-19.541,16.444-22.814l7.605-2.535&#10;&#9;&#9;V295.452c0-20.855,2.907-41.609,8.636-61.662l5.623-19.679c1.171-4.097,1.513-8.387,1.007-12.618l-8.175-68.335"/>
        </g>
      </svg>`,
      partNames: {
        neck: '头颈部',
        face: '面部',
        chest: '胸部',
        abdomen: '腹部',
        limbs: '四肢',
        body: '体表'
      },
      svgElement: null,
    };
  },
  computed: {
    severityText() {
      const texts = ['轻伤', '重伤', '严重'];
      return texts[this.patient.injurySeverity] || '未知';
    }
  },
  methods: {
    getGradientColor(level) {
      const startColor = [255, 255, 255]; // 白色
      const endColor = [139, 0, 0]; // 深红色
      const levelsCount = 7; // 0-6
      const factor = level / (levelsCount - 1);
      const rgb = startColor.map((c, i) => Math.round(c + (endColor[i] - c) * factor));
      return `rgb(${rgb.join(',')})`;
    },
    getLevelDescription(level) {
      const descriptions = ['无', '轻微', '轻度', '中度', '较重', '严重', '危重'];
      return descriptions[level] || '未知';
    },
    getInjuryDetails(partName) {
      // 根据部位名称获取对应的详细伤情信息
      const detailsMap = {
        neck: this.patient.headNeckDetails,
        face: this.patient.faceDetails,
        chest: this.patient.chestDetails,
        abdomen: this.patient.abdomenDetails,
        limbs: this.patient.limbsDetails,
        body: this.patient.bodyDetails
      };
      
      const details = detailsMap[partName];
      // 处理列表类型或字符串类型的详细伤情信息
      if (!details) {
        return null;
      }
      
      // 如果是数组类型（List<InjuryDetailDTO>）
      if (Array.isArray(details)) {
        if (details.length === 0) {
          return null;
        }
        return this.formatInjuryDetailsList(details);
      }
      
      // 如果是字符串类型（兼容旧格式）
      if (typeof details === 'string' && details.trim() !== '') {
        return this.formatInjuryDetailsString(details);
      }
      
      return null;
    },
    formatInjuryDetailsList(detailsList) {
      // 将列表类型的详细伤情信息格式化为HTML显示
      if (!detailsList || detailsList.length === 0) return '';
      
      // 按分数分组
      const groupedByScore = {};
      detailsList.forEach(detail => {
        const score = detail.scoreValue || 0;
        if (!groupedByScore[score]) {
          groupedByScore[score] = [];
        }
        groupedByScore[score].push(detail);
      });
      
      // 按分数从高到低排序
      const sortedScores = Object.keys(groupedByScore).sort((a, b) => parseInt(b) - parseInt(a));
      
      let formattedHtml = '';
      sortedScores.forEach(score => {
        const injuries = groupedByScore[score];
        const injuryTexts = injuries.map((detail, index) => {
          const prefix = index === 0 ? '①' : String.fromCharCode(9311 + index); // ①, ②, ③...
          let text = `${prefix}${detail.injuryName || detail.injuryDescription || ''}`;
          if (detail.injuryCount && detail.injuryCount > 1) {
            text += `（${detail.injuryCount}处）`;
          }
          if (detail.notes) {
            text += `：${detail.notes}`;
          }
          return text;
        }).join('，');
        
        formattedHtml += `<div class="score-group">
          <span class="score-badge">${score}分</span>
          <span class="injuries-list">（${injuryTexts}）</span>
        </div>`;
      });
      
      return formattedHtml;
    },
    formatInjuryDetailsString(details) {
      // 将字符串类型的详细伤情信息格式化为HTML显示（兼容旧格式）
      // 例如: "3分（①骨盆粉碎性骨折，②股骨骨折），2分（②脱位：肘、手、肩、肩锁关节）"
      if (!details) return '';
      
      // 使用正则表达式匹配所有 "数字分（描述）" 的模式
      const scorePattern = /(\d+)分（([^）]+)）/g;
      let formattedHtml = '';
      let match;
      
      // 使用全局匹配来找到所有匹配项
      while ((match = scorePattern.exec(details)) !== null) {
        const score = match[1];
        const injuries = match[2];
        
        formattedHtml += `<div class="score-group">
          <span class="score-badge">${score}分</span>
          <span class="injuries-list">（${injuries}）</span>
        </div>`;
      }
      
      return formattedHtml;
    },
    closeModal() {
      this.visible = false;
      this.$emit('close');
    },
    updateSVGColors() {
      if (!this.svgElement) return;

      const levelMap = {
        face: this.injuryLevels.face,
        neck: this.injuryLevels.neck,
        chest: this.injuryLevels.chest,
        abdomen: this.injuryLevels.abdomen,
        limbs: this.injuryLevels.limbs,
        body: this.injuryLevels.body
      };

      const getColor = (level) => this.getGradientColor(level);

      for (const part in levelMap) {
        const elements = this.svgElement.querySelectorAll(`.${part}`);
        elements.forEach(el => {
          el.setAttribute('fill', getColor(levelMap[part]));
        });
      }
    },

    // 以下是原有方法，需要保留但未在提供的代码片段中显示
    loadAndColorSVG() {
      this.svgLoaded = false;

      const container = this.$refs.svgContainer;
      if (!container) {
        console.error("SVG容器未找到");
        return;
      }

      // 清空容器内容
      container.innerHTML = '';

      try {
        // 创建临时div解析SVG字符串
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.svgStr;
        const svgEl = tempDiv.querySelector('svg');

        if (!svgEl) {
          console.error("SVG元素未创建成功");
          return;
        }

        // 设置样式
        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.display = 'block';
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // 存储SVG DOM
        this.svgElement = svgEl;

        // 着色
        this.updateSVGColors();
        
        // 附加到容器
        container.appendChild(svgEl);

        // 绑定事件（悬停）
        container.addEventListener('mouseover', this.handleSvgMouseOver);
        container.addEventListener('mouseout', this.handleSvgMouseOut);

        this.svgLoaded = true;
      } catch (e) {
        console.error("加载SVG出错：", e);
        container.innerHTML = '<p class="svg-error">加载人体图失败</p>';
      }
    },
    highlightPart(partName) {
      this.highlightedPart = partName;
      
      // 高亮SVG中的对应部位 - 添加null检查
      if (this.svgElement && this.svgElement.querySelectorAll) {
        try {
          const elements = this.svgElement.querySelectorAll(`.${partName}`);
          elements.forEach(el => {
            el.style.filter = 'brightness(1.2) drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))';
          });
        } catch (error) {
          console.error("高亮部位时出错:", error);
        }
      }
    },
    unhighlightPart() {
      this.highlightedPart = null;
      
      // 移除SVG高亮 - 添加null检查
      if (this.svgElement && this.svgElement.querySelectorAll) {
        try {
          const elements = this.svgElement.querySelectorAll('*');
          elements.forEach(el => {
            el.style.filter = '';
          });
        } catch (error) {
          console.error("取消高亮时出错:", error);
        }
      }
    },
    // 获取部位的分数值（数字类型，用于颜色显示和等级判断）
    // 优先从详细伤情信息中提取，否则从基础分数字段提取
    getScoreValue(partName) {
      // 首先检查是否有详细伤情信息
      const detailsMap = {
        neck: this.patient.headNeckDetails,
        face: this.patient.faceDetails,
        chest: this.patient.chestDetails,
        abdomen: this.patient.abdomenDetails,
        limbs: this.patient.limbsDetails,
        body: this.patient.bodyDetails
      };
      
      const details = detailsMap[partName];
      
      // 如果有详细伤情信息，从详细伤情信息中提取分数
      if (details) {
        // 如果是数组类型（List<InjuryDetailDTO>）
        if (Array.isArray(details) && details.length > 0) {
          // 从详细伤情信息中提取所有分数，取最大值
          const scores = details
            .map(detail => detail.scoreValue)
            .filter(score => score != null && score > 0);
          if (scores.length > 0) {
            return Math.max(...scores);
          }
        }
        // 如果是字符串类型（兼容旧格式）
        if (typeof details === 'string' && details.trim() !== '') {
          // 从字符串中提取分数，例如 "3分（①...）" 或 "3分（①...），2分（②...）"
          const scorePattern = /(\d+)分/g;
          const matches = details.match(scorePattern);
          if (matches && matches.length > 0) {
            // 提取所有分数，取最大值
            const scores = matches.map(m => parseInt(m.replace('分', ''))).filter(n => !isNaN(n) && n > 0);
            if (scores.length > 0) {
              return Math.max(...scores);
            }
          }
        }
      }
      
      // 如果没有详细伤情信息，使用基础分数字段
      const scoreMap = {
        neck: this.patient.headNeck,
        face: this.patient.face,
        chest: this.patient.chest,
        abdomen: this.patient.abdomen,
        limbs: this.patient.limbs,
        body: this.patient.body
      };
      
      const scoreStr = scoreMap[partName];
      return this.getMaxScore(scoreStr);
    },
    updateInjuryLevels() {
      // 更新等级，使用统一的分数提取逻辑（确保颜色和显示数字一致）
      this.injuryLevels = {
        neck: this.getScoreValue('neck'),
        face: this.getScoreValue('face'),
        chest: this.getScoreValue('chest'),
        abdomen: this.getScoreValue('abdomen'),
        limbs: this.getScoreValue('limbs'),
        body: this.getScoreValue('body')
      };
      // 重新加载SVG
      this.svgLoaded = false;
      this.$nextTick(() => {
        this.loadAndColorSVG();
      });
    },
    // 从String类型的得分中提取最大值（用于颜色显示）
    getMaxScore(scoreStr) {
      if (!scoreStr || scoreStr === '0' || scoreStr.trim() === '') {
        return 0;
      }
      // 处理 "1|2" 格式，提取最大值
      const scores = scoreStr.split('|').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
      return scores.length > 0 ? Math.max(...scores) : 0;
    },
    // 格式化得分显示（显示原始字符串，如 "1|2"）
    // 如果有详细伤情信息，从详细伤情信息中提取分数；否则使用基础分数字段
    formatScore(partName) {
      // 使用统一的分数提取逻辑
      const scoreValue = this.getScoreValue(partName);
      if (scoreValue === 0) {
        return '0';
      }
      return scoreValue.toString();
    },
    fetchInjuryData() {
      // 实现获取伤情数据逻辑
    }
  },
  watch: {
    patient: {
      handler() {
        this.updateInjuryLevels();
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.updateInjuryLevels();
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
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.injury-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.severity-indicator {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  flex: 1;
  min-width: 250px;
  margin-right: 20px;
}

.severity-0 {
  background-color: #f0f9ff;
  border-left: 4px solid #409EFF;
}

.severity-1 {
  background-color: #fef6e7;
  border-left: 4px solid #e6a23c;
}

.severity-2 {
  background-color: #fef0f0;
  border-left: 4px solid #f56c6c;
}

.severity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.severity-text {
  font-weight: 600;
  font-size: 16px;
}

.iss-score {
  font-size: 14px;
  color: #606266;
}

.color-legend {
  flex: 1;
  min-width: 250px;
}

.color-legend h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
}

.color-box {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-right: 6px;
}

.level-label {
  font-size: 12px;
  color: #606266;
}

.injury-details {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.svg-container {
  flex: 1;
  min-width: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.human-figure {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-placeholder {
  color: #909399;
  font-style: italic;
}

.injury-levels {
  flex: 1;
  min-width: 200px;
}

.injury-item {
  padding: 10px 15px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;
}

.injury-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.injury-details {
  margin-top: 8px;
  padding-left: 10px;
  border-left: 3px solid #e0e0e0;
}

.details-content {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.score-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 4px;
  gap: 6px;
}

.score-badge {
  background: linear-gradient(135deg, #409EFF, #64b5ff);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.injuries-list {
  color: #555;
  font-size: 12px;
  line-height: 1.3;
}

.injury-item:hover {
  background-color: #f0f0f0;
}

.injury-item.highlighted {
  background-color: #ecf5ff;
  border-left: 3px solid #409EFF;
}

.part-name {
  font-weight: 500;
  margin-right: 8px;
}

.part-level {
  font-weight: 600;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.carousel-nav {
  display: flex;
  gap: 10px;
}

.nav-btn {
  padding: 8px 12px;
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background-color: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.patient-carousel-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.indicator-text {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.indicator-dots {
  display: flex;
  gap: 5px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dcdfe6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot.active {
  background-color: #409EFF;
  transform: scale(1.2);
}

.btn-close {
  padding: 8px 16px;
  background-color: #f56c6c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: #f78989;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container button {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .injury-details {
    flex-direction: column;
  }
  
  .injury-summary {
    flex-direction: column;
  }
  
  .severity-indicator {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .legend-items {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .carousel-nav {
    order: 2;
  }
  
  .patient-carousel-indicator {
    order: 1;
  }
  
  .btn-close {
    order: 3;
  }
}
</style>