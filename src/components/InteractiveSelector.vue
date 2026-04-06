<template>
  <div 
    class="interactive-selector"
    :class="{ 
      'is-large': size === 'large',
      'is-active': isOpen,
      'has-value': hasValue
    }"
  >
    <div class="selector-label">
      <span class="label-icon">{{ icon }}</span>
      <span class="label-text">{{ label }}</span>
    </div>
    
    <div class="selector-trigger" @click="toggleOpen">
      <div class="trigger-value">
        <span v-if="!hasValue" class="placeholder">选择{{ label }}</span>
        <span v-else class="value-text">{{ displayValue }}</span>
      </div>
      <div class="trigger-arrow" :class="{ 'is-open': isOpen }">
        <i class="el-icon-arrow-down"></i>
      </div>
    </div>
    
    <transition name="dropdown">
      <div v-show="isOpen" class="selector-dropdown" v-click-outside="close">
        <div v-if="filterable" class="dropdown-search">
          <i class="el-icon-search"></i>
          <input 
            v-model="searchText"
            type="text"
            placeholder="搜索..."
            @click.stop
          />
        </div>
        
        <div class="dropdown-options">
          <div
            v-for="opt in filteredOptions"
            :key="opt.v"
            class="option-item"
            :class="{ 
              'is-selected': isSelected(opt.v),
              'is-all': opt.v === '__ALL__'
            }"
            @click="selectOption(opt)"
          >
            <span class="option-icon">{{ getOptionIcon(opt) }}</span>
            <span class="option-text">{{ opt.l }}</span>
            <i v-if="isSelected(opt.v)" class="el-icon-check option-check"></i>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- 选中动画效果 -->
    <div v-if="showRipple" class="ripple-effect" @animationend="showRipple = false"></div>
  </div>
</template>

<script>
export default {
  name: 'InteractiveSelector',
  props: {
    value: { type: [String, Number], default: null },
    options: { type: Array, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: '📋' },
    size: { type: String, default: 'normal' }, // normal, large
    filterable: { type: Boolean, default: false }
  },
  data() {
    return {
      isOpen: false,
      searchText: '',
      showRipple: false
    }
  },
  computed: {
    hasValue() {
      return this.value !== null && this.value !== undefined && this.value !== ''
    },
    displayValue() {
      const opt = this.options.find(o => o.v === this.value)
      return opt ? opt.l : this.value
    },
    filteredOptions() {
      if (!this.filterable || !this.searchText) {
        return this.options
      }
      const text = this.searchText.toLowerCase()
      return this.options.filter(o => 
        String(o.l).toLowerCase().includes(text)
      )
    }
  },
  watch: {
    isOpen(val) {
      if (!val) {
        this.searchText = ''
      }
    }
  },
  methods: {
    toggleOpen() {
      this.isOpen = !this.isOpen
    },
    close() {
      this.isOpen = false
    },
    isSelected(val) {
      return this.value === val
    },
    selectOption(opt) {
      this.$emit('input', opt.v)
      this.showRipple = true
      this.isOpen = false
    },
    getOptionIcon(opt) {
      if (opt.v === '__ALL__') return '✨'
      // 根据选项内容返回不同图标
      const text = String(opt.l)
      if (text.includes('春')) return '🌸'
      if (text.includes('夏')) return '☀️'
      if (text.includes('秋')) return '🍂'
      if (text.includes('冬')) return '❄️'
      if (text.includes('夜间')) return '🌙'
      if (text.includes('高峰')) return '🚗'
      if (text.includes('下午')) return '☕'
      if (text.includes('晚上')) return '🌃'
      if (text.includes('交通')) return '🚑'
      if (text.includes('高坠')) return '🏗️'
      if (text.includes('机械')) return '⚙️'
      if (text.includes('跌倒')) return '🚶'
      if (text.includes('区')) return '🏘️'
      return '•'
    }
  },
  directives: {
    'click-outside': {
      bind(el, binding) {
        el._clickOutside = (e) => {
          if (!el.contains(e.target)) {
            binding.value()
          }
        }
        document.addEventListener('click', el._clickOutside, true)
      },
      unbind(el) {
        document.removeEventListener('click', el._clickOutside, true)
      }
    }
  }
}
</script>

<style scoped>
.interactive-selector {
  position: relative;
  min-width: 160px;
  flex: 1;
}

.interactive-selector.is-large {
  min-width: 240px;
  max-width: 320px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.label-icon {
  font-size: 16px;
}

.selector-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.selector-trigger:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-1px);
}

.interactive-selector.is-active .selector-trigger {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
}

.interactive-selector.has-value .selector-trigger {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 100%);
}

.trigger-value {
  flex: 1;
  overflow: hidden;
}

.placeholder {
  color: #c0c4cc;
}

.value-text {
  color: #303133;
  font-weight: 600;
}

.trigger-arrow {
  margin-left: 8px;
  color: #909399;
  transition: transform 0.3s;
}

.trigger-arrow.is-open {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.selector-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.dropdown-enter-active, .dropdown-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.dropdown-search {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  gap: 8px;
  color: #909399;
}

.dropdown-search input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #303133;
}

.dropdown-search input::placeholder {
  color: #c0c4cc;
}

.dropdown-options {
  overflow-y: auto;
  padding: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.option-item:hover {
  background: #f5f7fa;
}

.option-item.is-selected {
  background: #ecf5ff;
  color: #409eff;
}

.option-item.is-all {
  font-weight: 600;
  background: linear-gradient(135deg, #f0f9eb 0%, #fff 0%);
  border: 1px dashed #67c23a;
}

.option-item.is-all.is-selected {
  background: #f0f9eb;
  color: #67c23a;
  border-style: solid;
}

.option-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.option-text {
  flex: 1;
  font-size: 14px;
}

.option-check {
  font-size: 14px;
}

/* 涟漪效果 */
.ripple-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background: rgba(64, 158, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .interactive-selector {
    min-width: 100%;
  }
  
  .interactive-selector.is-large {
    max-width: 100%;
  }
}
</style>
