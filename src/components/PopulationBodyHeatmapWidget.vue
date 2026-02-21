<template>
  <div class="population-body-heatmap-widget">
    <!-- 右上角标题 -->
    <div class="chart-title-overlay">
      <div class="chart-title">
        <i>👥</i>
        人群身体热力图
      </div>
    </div>
    
    <!-- 整体内容滚动区域 -->
    <div class="content-scroll-area">
      <!-- 核心人体图区域 -->
      <div class="chart-container">
        <div ref="svgContainer" class="human-figure">
          <p v-if="!svgLoaded" class="svg-placeholder">加载人体图中...</p>
        </div>
        
        <!-- 颜色等级图例 - 位于左下角 -->
        <div class="color-legend-overlay">
          <div class="legend-items">
            <div v-for="i in 7" :key="i" class="legend-item">
              <span class="color-box" :style="{ backgroundColor: getSeverityColor(i-1) }"></span>
              <span class="level-label">等级 {{ i-1 }}</span>
            </div>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-overlay">
          <div class="loading-spinner"></div>
          <p>加载热力图数据中...</p>
        </div>
      </div>
      
      <!-- 各部位热度数据区域（位于人体图下方） -->
      <div class="body-parts-area">
        <div class="body-parts-container">
          <div class="body-parts-content">
            <div 
              v-for="part in bodyPartsData" 
              :key="part.body_part"
              class="part-item"
              :class="{ highlighted: highlightedPart === part.body_part }"
              @mouseenter="highlightPart(part.body_part)"
              @mouseleave="unhighlightPart"
              @click="handlePartClick(part)"
            >
              <div class="part-header">
                <span class="part-name">{{ getPartName(part.body_part) }}</span>
                <span class="part-severity" :style="{ color: getSeverityColor(part.average_severity) }">
                  {{ part.average_severity.toFixed(2) }}
                </span>
              </div>
              <div class="part-details">
                <span class="patient-count">{{ part.patient_count }}例</span>
                <div class="severity-bar">
                  <div 
                    class="severity-fill" 
                    :style="{ 
                      width: (part.average_severity / 6 * 100) + '%',
                      backgroundColor: getSeverityColor(part.average_severity)
                    }"
                  ></div>
                </div>
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
  name: 'PopulationBodyHeatmapWidget',
  props: {
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    timePeriod: {
      type: String,
      default: null
    },
    year: {
      type: String,
      default: null
    },
    customStartTime: {
      type: String,
      default: null
    },
    customEndTime: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      svgLoaded: false,
      svgElement: null,
      highlightedPart: null,
      bodyPartsData: [],
      // SVG字符串 - 复制自InjuryFigureModal.vue
      svgStr: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
        head_neck: '头颈部',
        face: '面部',
        chest: '胸部',
        abdomen: '腹部',
        limbs: '四肢',
        body: '体表'
      }
    };
  },
  watch: {
    // 监听props变化，自动获取数据
    startDate: {
      handler() {
        this.fetchHeatmapData();
      }
    },
    endDate: {
      handler() {
        this.fetchHeatmapData();
      }
    },
    timePeriod: {
      handler() {
        this.fetchHeatmapData();
      }
    },
    year: {
      handler() {
        this.fetchHeatmapData();
      }
    },
    customStartTime: {
      handler() {
        this.fetchHeatmapData();
      }
    },
    customEndTime: {
      handler() {
        this.fetchHeatmapData();
      }
    }
  },
  methods: {
    // 获取部位名称
    getPartName(partKey) {
      return this.partNames[partKey] || partKey;
    },
    
    // 获取严重程度颜色
    getSeverityColor(level) {
      const startColor = [255, 255, 255]; // 白色
      const endColor = [139, 0, 0]; // 深红色
      const levelsCount = 7; // 0-6
      const factor = level / (levelsCount - 1);
      const rgb = startColor.map((c, i) => Math.round(c + (endColor[i] - c) * factor));
      return `rgb(${rgb.join(',')})`;
    },
    
    
    // 获取热力图数据
    async fetchHeatmapData() {
      this.loading = true;
      try {
        // 构建查询参数，使用props中的值
        const params = {};
        
        // 处理年份参数（只在有有效值时才添加）
        if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
          const yearInt = parseInt(this.year);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 处理时间段参数
        if (this.timePeriod && this.timePeriod !== 'all') {
          const timePeriodMapping = {
            'night': 0,           // 夜间
            'morning_peak': 1,    // 早高峰
            'noon_peak': 2,       // 午高峰
            'afternoon': 3,       // 下午
            'evening_peak': 4,    // 晚高峰
            'evening': 5          // 晚上
          };
          params.timePeriod = timePeriodMapping[this.timePeriod];
        }
        
        // 处理日期参数
        if (this.startDate && this.startDate !== '') {
          params.startDate = this.startDate;
        }
        if (this.endDate && this.endDate !== '') {
          params.endDate = this.endDate;
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        console.log('发送热力图查询请求，参数:', params);
        
        const response = await this.$axios.get('/api/patient-statistics/population-body-heatmap', { params });
        
        console.log('热力图API响应:', response.data);
        
        if (response.data.success) {
          this.bodyPartsData = response.data.data || [];
          console.log('处理后的身体部位数据:', this.bodyPartsData);
          this.updateSVGColors();
        } else {
          console.error('API返回错误:', response.data.errorMsg);
          this.$message.error('获取热力图数据失败: ' + (response.data.errorMsg || '未知错误'));
        }
      } catch (error) {
        console.error('获取热力图数据失败:', error);
        this.$message.error('获取热力图数据失败: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    
    // 更新SVG颜色
    updateSVGColors() {
      if (!this.svgElement) {
        console.log('SVG元素未加载，跳过颜色更新');
        return;
      }

      const levelMap = {
        face: this.getPartSeverity('face'),
        neck: this.getPartSeverity('head_neck'),
        chest: this.getPartSeverity('chest'),
        abdomen: this.getPartSeverity('abdomen'),
        limbs: this.getPartSeverity('limbs'),
        body: this.getPartSeverity('body')
      };

      console.log('更新SVG颜色，严重程度映射:', levelMap);

      for (const part in levelMap) {
        const severity = levelMap[part];
        const color = this.getSeverityColor(severity);
        const elements = this.svgElement.querySelectorAll(`.${part}`);
        
        console.log(`部位 ${part}: 严重程度=${severity}, 颜色=${color}, 元素数量=${elements.length}`);
        
        elements.forEach(el => {
          el.setAttribute('fill', color);
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '2');
        });
      }
    },
    
    // 获取部位严重程度
    getPartSeverity(partKey) {
      const part = this.bodyPartsData.find(p => p.body_part === partKey);
      const severity = part ? parseFloat(part.average_severity) || 0 : 0;
      console.log(`获取部位 ${partKey} 严重程度:`, severity);
      return severity;
    },
    
    // 高亮部位
    highlightPart(partName) {
      this.highlightedPart = partName;
      
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
    
    // 取消高亮
    unhighlightPart() {
      this.highlightedPart = null;
      
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
    
    // 加载SVG
    loadSVG() {
      this.svgLoaded = false;
      const container = this.$refs.svgContainer;
      if (!container) return;

      container.innerHTML = '';
      
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.svgStr;
        const svgEl = tempDiv.querySelector('svg');

        if (!svgEl) {
          console.error("SVG元素未创建成功");
          return;
        }

        svgEl.style.width = '100%';
        svgEl.style.height = '100%';
        svgEl.style.display = 'block';
        svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        this.svgElement = svgEl;
        container.appendChild(svgEl);
        this.svgLoaded = true;
        
        // 绑定事件
        container.addEventListener('mouseover', this.handleSvgMouseOver);
        container.addEventListener('mouseout', this.handleSvgMouseOut);
        container.addEventListener('click', this.handleSvgClick);
        
      } catch (e) {
        console.error("加载SVG出错：", e);
        container.innerHTML = '<p class="svg-error">加载人体图失败</p>';
      }
    },
    
    // SVG鼠标悬停事件
    handleSvgMouseOver(event) {
      const target = event.target;
      if (target.classList.contains('face')) {
        this.highlightPart('face');
      } else if (target.classList.contains('neck')) {
        this.highlightPart('head_neck');
      } else if (target.classList.contains('chest')) {
        this.highlightPart('chest');
      } else if (target.classList.contains('abdomen')) {
        this.highlightPart('abdomen');
      } else if (target.classList.contains('limbs')) {
        this.highlightPart('limbs');
      } else if (target.classList.contains('body')) {
        this.highlightPart('body');
      }
    },
    
    // SVG鼠标离开事件
    handleSvgMouseOut() {
      this.unhighlightPart();
    },
    
    // SVG点击事件
    handleSvgClick(event) {
      const target = event.target;
      let bodyPart = null;
      
      if (target.classList.contains('face')) {
        bodyPart = 'face';
      } else if (target.classList.contains('neck')) {
        bodyPart = 'head_neck';
      } else if (target.classList.contains('chest')) {
        bodyPart = 'chest';
      } else if (target.classList.contains('abdomen')) {
        bodyPart = 'abdomen';
      } else if (target.classList.contains('limbs')) {
        bodyPart = 'limbs';
      } else if (target.classList.contains('body')) {
        bodyPart = 'body';
      }
      
      if (bodyPart) {
        this.handleBodyPartClick(bodyPart);
      }
    },
    
    // 处理部位数据项点击
    async handlePartClick(part) {
      await this.handleBodyPartClick(part.body_part);
    },
    
    // 处理身体部位点击
    async handleBodyPartClick(bodyPart) {
      console.log('点击身体部位:', bodyPart);
      
      try {
        // 构建查询参数
        const params = {
          bodyPart: bodyPart
        };
        
        // 添加日期范围参数（转换为字符串格式 YYYY-MM-DD）
        if (this.startDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.startDate instanceof Date) {
            const year = this.startDate.getFullYear();
            const month = String(this.startDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.startDate.getDate()).padStart(2, '0');
            params.startDate = `${year}-${month}-${day}`;
          } else {
            params.startDate = this.startDate;
          }
        }
        
        if (this.endDate) {
          // 如果是 Date 对象，转换为字符串
          if (this.endDate instanceof Date) {
            const year = this.endDate.getFullYear();
            const month = String(this.endDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.endDate.getDate()).padStart(2, '0');
            params.endDate = `${year}-${month}-${day}`;
          } else {
            params.endDate = this.endDate;
          }
        }
        
        // 添加年份参数（只在有有效值时才添加）
        if (this.year && this.year !== 'all' && this.year !== '' && this.year != null) {
          const yearInt = parseInt(this.year);
          if (!isNaN(yearInt)) {
            params.year = yearInt;
          }
        }
        
        // 添加时间段参数（转换为数字）
        if (this.timePeriod && this.timePeriod !== 'all') {
          const timePeriodMapping = {
            'night': 0,           // 夜间
            'morning_peak': 1,    // 早高峰
            'noon_peak': 2,       // 午高峰
            'afternoon': 3,       // 下午
            'evening_peak': 4,    // 晚高峰
            'evening': 5          // 晚上
          };
          params.timePeriod = timePeriodMapping[this.timePeriod];
        }
        
        // 添加自定义时间段参数
        if (this.customStartTime && this.customEndTime) {
          params.customStartTime = this.customStartTime;
          params.customEndTime = this.customEndTime;
        }
        
        console.log('身体部位查询参数:', params);
        
        // 调用API获取患者ID列表
        const response = await this.$axios.get('/api/patient-statistics/body-part-patient-ids', { params });
        console.log('身体部位患者ID列表请求成功:', response.data);
        
        if (response.data.success) {
          const patientIds = response.data.data || [];
          
          // 构建标题
          const partName = this.getPartName(bodyPart);
          const title = `${partName}损伤患者列表`;
          
          // 发送事件给父组件
          this.$emit('show-patient-list', {
            patientIds: patientIds,
            title: title
          });
        } else {
          this.$message.error(response.data.errorMsg || '获取患者列表失败');
        }
      } catch (error) {
        console.error('获取身体部位患者列表失败:', error);
        this.$message.error('获取患者列表失败: ' + (error.response?.data?.errorMsg || error.message));
      }
    }
  },
  mounted() {
    this.loadSVG();
    // 自动获取数据（通过watch监听器触发）
    this.fetchHeatmapData();
  }
};
</script>

<style scoped>
/* 标题样式 */
.chart-title-overlay {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 10;
}

.chart-title {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.chart-title i {
  margin-right: 4px;
  font-size: 14px;
}

.population-body-heatmap-widget {
  position: relative;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 整体内容滚动区域 */
.content-scroll-area {
  flex: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  min-height: 0;
}

.content-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.content-scroll-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.content-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.3);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.content-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.5);
}

/* 核心人体图区域 */
.chart-container {
  width: 100%;
  height: 320px;
  padding: 0;
  flex-shrink: 0;
  background: transparent;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.human-figure {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.human-figure svg path {
  cursor: pointer;
  transition: all 0.2s ease;
}

.human-figure svg path:hover {
  opacity: 0.8;
}

.svg-placeholder {
  color: #909399;
  font-style: italic;
  font-size: 14px;
}

/* 颜色等级图例覆盖层 - 位于左下角 */
.color-legend-overlay {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 6px;
  padding: 8px 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 5;
}

.color-legend-overlay .legend-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.color-legend-overlay .legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-legend-overlay .color-box {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.color-legend-overlay .level-label {
  font-size: 9px;
  color: #409EFF;
  font-weight: 600;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #409EFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 各部位热度数据区域 */
.body-parts-area {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 8px;
  margin-top: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.body-parts-container {
  padding: 8px 12px;
}

.body-parts-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.part-item {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.part-item:hover {
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.part-item.highlighted {
  background: rgba(64, 158, 255, 0.1);
  border-color: #409EFF;
}

.part-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.part-name {
  color: #409EFF;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.part-severity {
  color: #409EFF;
  font-weight: 700;
  font-size: 11px;
  background: rgba(64, 158, 255, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.part-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.patient-count {
  color: #6c757d;
  font-weight: 500;
  font-size: 10px;
  flex-shrink: 0;
}

.severity-bar {
  width: 80px;
  height: 4px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.severity-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .chart-container {
    height: 250px;
  }
  
  .human-figure {
    height: 250px !important;
  }
  
  .body-parts-container {
    padding: 6px 8px;
  }
  
  .body-parts-content {
    gap: 6px;
  }
  
  .part-item {
    padding: 6px 8px;
  }
  
  .legend-items {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
}
</style>
