<template>
  <el-dialog
    :title="title"
    :visible="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleCancel"
    @update:visible="val => { dialogVisible = val }"
  >
    <div class="time-group-dialog">
      <!-- 操作栏 -->
      <div class="dialog-header">
        <div class="header-info">
          <span class="info-text">已创建 {{ groups.length }} 个分组</span>
          <span class="info-text">已使用 {{ usedHoursCount }} / 24 个时间段</span>
        </div>
        <div class="header-actions">
          <el-button size="small" type="primary" @click="addGroup" :disabled="availableHours.length === 0">
            <i class="el-icon-plus"></i> 添加分组
          </el-button>
          <el-button size="small" type="danger" @click="clearAllGroups" :disabled="groups.length === 0">
            <i class="el-icon-delete"></i> 清空所有
          </el-button>
        </div>
      </div>

      <!-- 24个时间段选择 - 时间轴样式 -->
      <div class="hours-selection">
        <div class="hours-label">
          <span>选择时间段（点击时间段进行选择）：</span>
        </div>
        <div class="hours-timeline">
          <div 
            v-for="hour in 24" 
            :key="hour - 1" 
            class="hour-item"
            :class="{ 
              'selected': currentSelectedHours[hour - 1],
              'used': isHourUsed(hour - 1),
              'available': !isHourUsed(hour - 1)
            }"
            @click="toggleHour(hour - 1)"
          >
            <div class="hour-time">{{ formatHourLabel(hour - 1) }}</div>
            <div class="hour-checkbox">
              <i class="el-icon-check" v-if="currentSelectedHours[hour - 1]"></i>
            </div>
            <div class="hour-group-badge" v-if="getHourGroupInfo(hour - 1)">
              组{{ getHourGroupInfo(hour - 1) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 分组列表 -->
      <div class="groups-list" v-if="groups.length > 0">
        <div class="group-item" v-for="(group, index) in groups" :key="index">
          <div class="group-header">
            <div class="group-title">
              <span class="group-number">分组 {{ index + 1 }}</span>
              <span class="group-hours-count">({{ group.hours.length }} 个时间段)</span>
            </div>
            <div class="group-actions">
              <el-button size="mini" @click="editGroup(index)" title="编辑分组">
                <i class="el-icon-edit"></i>
              </el-button>
              <el-button size="mini" type="danger" @click="removeGroup(index)" title="删除分组">
                <i class="el-icon-delete"></i>
              </el-button>
            </div>
          </div>
          <div class="group-content">
            <div class="group-hours-display">
              <el-tag 
                v-for="(hour, hIndex) in group.hours" 
                :key="hIndex" 
                size="small" 
                type="primary"
                closable
                @close="removeHourFromGroup(index, hour)"
                style="margin-right: 8px; margin-bottom: 8px;"
              >
                {{ formatHourLabel(hour) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-groups-tip">
        <el-alert type="info" :closable="false">
          <template slot="title">
            <span>提示：请先选择时间段，然后点击"添加分组"按钮创建分组</span>
          </template>
        </el-alert>
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :disabled="groups.length === 0">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'TimeGroupDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '自定义时间段分组'
    },
    value: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dialogVisible: false,
      groups: [],
      currentSelectedHours: Array(24).fill(false)
    }
  },
  computed: {
    usedHoursCount() {
      const usedHours = new Set()
      this.groups.forEach(g => {
        if (g.hours && Array.isArray(g.hours)) {
          g.hours.forEach(h => usedHours.add(h))
        }
      })
      return usedHours.size
    },
    availableHours() {
      const usedHours = new Set()
      this.groups.forEach(g => {
        if (g.hours && Array.isArray(g.hours)) {
          g.hours.forEach(h => usedHours.add(h))
        }
      })
      const available = []
      for (let i = 0; i < 24; i++) {
        if (!usedHours.has(i)) {
          available.push(i)
        }
      }
      return available
    }
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal
      if (newVal) {
        // 打开对话框时，初始化数据
        this.groups = this.value && this.value.length > 0 
          ? JSON.parse(JSON.stringify(this.value)) 
          : []
        this.currentSelectedHours = Array(24).fill(false)
      }
    },
    dialogVisible(newVal) {
      if (!newVal) {
        this.$emit('update:visible', false)
      }
    }
  },
  methods: {
    formatHourLabel(hour) {
      const nextHour = (hour + 1) % 24
      return `${hour.toString().padStart(2, '0')}:00-${nextHour.toString().padStart(2, '0')}:00`
    },
    toggleHour(hour) {
      // 如果该时间段已经被分组，不允许选择
      if (this.isHourUsed(hour)) {
        this.$message.warning('该时间段已属于某个分组，请先从分组中移除')
        return
      }
      this.$set(this.currentSelectedHours, hour, !this.currentSelectedHours[hour])
    },
    isHourUsed(hour) {
      return this.groups.some(g => g.hours && g.hours.includes(hour))
    },
    getHourGroupInfo(hour) {
      for (let i = 0; i < this.groups.length; i++) {
        if (this.groups[i].hours && this.groups[i].hours.includes(hour)) {
          return i + 1
        }
      }
      return null
    },
    addGroup() {
      // 获取当前选中的时间段
      const selectedHourList = []
      for (let i = 0; i < 24; i++) {
        if (this.currentSelectedHours[i]) {
          selectedHourList.push(i)
        }
      }
      
      if (selectedHourList.length === 0) {
        this.$message.warning('请先选择至少一个时间段')
        return
      }
      
      // 检查是否所有选中的时间段都已经被分组
      const allGroupedHours = this.groups.flatMap(g => g.hours || [])
      const ungroupedHours = selectedHourList.filter(h => !allGroupedHours.includes(h))
      
      if (ungroupedHours.length === 0) {
        this.$message.warning('所选时间段都已被分组，请选择其他时间段')
        return
      }
      
      // 创建新分组，只包含未分组的时间段
      this.groups.push({
        groupIndex: this.groups.length,
        hours: [...ungroupedHours].sort((a, b) => a - b)
      })
      
      // 清空选中状态
      this.currentSelectedHours = Array(24).fill(false)
      
      this.$message.success(`已创建分组 ${this.groups.length}，包含 ${ungroupedHours.length} 个时间段`)
    },
    removeGroup(index) {
      this.groups.splice(index, 1)
      // 重新设置组索引
      this.groups.forEach((g, i) => {
        g.groupIndex = i
      })
      this.$message.success('分组已删除')
    },
    removeHourFromGroup(groupIndex, hour) {
      const group = this.groups[groupIndex]
      const index = group.hours.indexOf(hour)
      if (index > -1) {
        group.hours.splice(index, 1)
        if (group.hours.length === 0) {
          this.removeGroup(groupIndex)
        }
      }
    },
    editGroup(index) {
      // 编辑分组：允许用户重新选择时间段
      const group = this.groups[index]
      this.$prompt('请输入时间段（用逗号分隔，如：0,1,2,3,4）', '编辑分组', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: group.hours.join(','),
        inputPattern: /^(\d+)(,\d+)*$/,
        inputErrorMessage: '格式不正确，请输入0-23之间的数字，用逗号分隔'
      }).then(({ value }) => {
        const hours = value.split(',').map(h => parseInt(h.trim())).filter(h => !isNaN(h) && h >= 0 && h < 24)
        if (hours.length === 0) {
          this.$message.warning('至少需要选择一个时间段')
          return
        }
        
        // 检查是否有时间段被其他分组使用
        const otherGroupsHours = this.groups.flatMap((g, idx) => idx !== index ? (g.hours || []) : [])
        const conflictHours = hours.filter(h => otherGroupsHours.includes(h))
        if (conflictHours.length > 0) {
          this.$message.warning(`时间段 ${conflictHours.join(',')} 已被其他分组使用`)
          return
        }
        
        group.hours = [...new Set(hours)].sort((a, b) => a - b)
        this.$message.success('分组已更新')
      }).catch(() => {})
    },
    clearAllGroups() {
      if (this.groups.length === 0) {
        return
      }
      this.$confirm('确定要清空所有分组吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.groups = []
        this.currentSelectedHours = Array(24).fill(false)
        this.$message.success('已清空所有分组')
      }).catch(() => {})
    },
    handleCancel() {
      this.dialogVisible = false
      this.$emit('cancel')
    },
    handleConfirm() {
      if (this.groups.length === 0) {
        this.$message.warning('请至少创建一个分组')
        return
      }
      
      // 验证所有分组都有时间段
      const invalidGroups = this.groups.filter(g => !g.hours || g.hours.length === 0)
      if (invalidGroups.length > 0) {
        this.$message.warning('存在空分组，请删除或添加时间段')
        return
      }
      
      // 发出确认事件，传递分组数据
      this.$emit('confirm', JSON.parse(JSON.stringify(this.groups)))
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.time-group-dialog {
  padding: 0;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #ebeef5;
}

.header-info {
  display: flex;
  gap: 20px;
}

.info-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.hours-selection {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.hours-label {
  font-weight: 600;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.hours-timeline {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.hour-item {
  position: relative;
  background: #fff;
  border: 2px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.hour-item:hover {
  border-color: #409EFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.hour-item.available {
  background: #fff;
}

.hour-item.selected {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

.hour-item.used {
  background: #f0f9ff;
  border-color: #67c23a;
  border-style: dashed;
  cursor: not-allowed;
}

.hour-item.used.selected {
  background: #e1f3d8;
  border-color: #67c23a;
}

.hour-time {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.hour-checkbox {
  width: 20px;
  height: 20px;
  margin: 0 auto;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.hour-item.selected .hour-checkbox {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}

.hour-item.selected .hour-checkbox i {
  font-size: 14px;
  font-weight: bold;
}

.hour-group-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #67c23a;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.group-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.3s;
}

.group-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-number {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.group-hours-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-hours-display {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.no-groups-tip {
  padding: 24px;
  text-align: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.dialog-footer {
  text-align: right;
}
</style>

