<template>
  <div class="map-page">
    <!-- 内容区域 -->
    <div class="content">
      <HeatMap />
    </div>
  </div>
</template>

<script>
import HeatMap from '../components/HeatMap.vue'

export default {
  components: {
    HeatMap
  }
}
</script>

<style scoped>
.map-page {
  height: 100%;
}

.content {
  height: 100%;
  padding: 0;
}
</style>