<template>
  <div class="result-block">
    <el-alert v-if="value && value.error" type="error" :title="value.error" :closable="false" show-icon />
    <template v-else-if="value == null || value === ''">
      <p class="placeholder">暂无数据，请先查询</p>
    </template>
    <template v-else-if="raw">
      <pre class="json-block">{{ jsonStr }}</pre>
    </template>
    <template v-else-if="value.probabilities">
      <el-descriptions :column="1" border size="small" class="desc">
        <el-descriptions-item label="主因">{{ value.top_cause || '-' }}</el-descriptions-item>
        <el-descriptions-item label="置信度">{{ value.confidence || '-' }}</el-descriptions-item>
        <el-descriptions-item label="样本量">{{ value.sample_n != null ? value.sample_n : '-' }}</el-descriptions-item>
        <el-descriptions-item label="降级">{{ value.is_fallback ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="模型版本">{{ value.model_version || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="probRows" size="small" stripe style="margin-top: 12px">
        <el-table-column prop="cause" label="伤因" width="120" />
        <el-table-column label="概率">
          <template slot-scope="scope">
            <el-progress
              :percentage="pct(scope.row.p)"
              :format="() => String(scope.row.p)"
            />
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template v-else>
      <pre class="json-block">{{ jsonStr }}</pre>
    </template>
  </div>
</template>

<script>
export default {
  name: 'PredictionResultBlock',
  props: {
    value: { type: [Object, Array, String, Number], default: null },
    raw: { type: Boolean, default: false }
  },
  computed: {
    jsonStr() {
      try {
        return JSON.stringify(this.value, null, 2)
      } catch (e) {
        return String(this.value)
      }
    },
    probRows() {
      const v = this.value
      if (!v || !v.probabilities) return []
      return Object.keys(v.probabilities).map((k) => ({
        cause: k,
        p: v.probabilities[k]
      }))
    }
  },
  methods: {
    pct(p) {
      const n = Number(p)
      if (Number.isNaN(n)) return 0
      return Math.min(100, Math.round(n * 10000) / 100)
    }
  }
}
</script>

<style scoped>
.result-block {
  margin-top: 12px;
}
.placeholder {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}
.json-block {
  margin: 0;
  padding: 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.45;
  overflow: auto;
  max-height: 420px;
}
.desc {
  margin-top: 4px;
}
</style>
