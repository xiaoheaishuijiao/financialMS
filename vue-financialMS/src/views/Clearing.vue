<template>
  <div class="clearing-container">
    <div class="status-panel">
      <h2>系统状态</h2>
      <div class="status-info">
        <p><strong>当前工作日：</strong> {{ currentWorkDay }}</p>
        <p><strong>营业状态：</strong>
          <span :class="{'status-open': isOperating, 'status-closed': !isOperating}">
            {{ isOperating ? '正在营业' : '已结算' }}
          </span>
        </p>
        <p><strong>当前时间：</strong> {{ currentTime }}</p>
      </div>
    </div>

    <div class="operation-panel">
      <div class="operation-card">
        <h3>日初始化</h3>
        <p class="operation-desc">每日早晨九点前后，执行日初始化开始一天的营业。</p>
        <el-button
            type="primary"
            :disabled="isOperating"
            @click="handleDayInit"
            :loading="dayInitLoading">
          执行日初始化
        </el-button>
        <p v-if="dayInitError" class="error-message">{{ dayInitError }}</p>
      </div>

      <div class="operation-card">
        <h3>日终结算</h3>
        <p class="operation-desc">工作日结束后，执行结算处理当日所有委托。</p>
        <el-button
            type="success"
            :disabled="!isOperating"
            @click="handleSettlement"
            :loading="settlementLoading">
          执行结算
        </el-button>
        <p v-if="settlementError" class="error-message">{{ settlementError }}</p>
      </div>
    </div>

    <div class="log-panel" v-if="operationLogs.length > 0">
      <h3>操作日志</h3>
      <el-timeline>
        <el-timeline-item
            v-for="(log, index) in operationLogs"
            :key="index"
            :timestamp="log.timestamp">
          {{ log.message }}
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
// import { dayInitialize, settle } from '@/api/clearing'
import { formatDateTime } from '@/utils/date'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.js";

// 响应式数据
const currentWorkDay = ref('2023-01-01') // 从后端获取
const isOperating = ref(false) // 从后端获取
const currentTime = ref('')
const dayInitLoading = ref(false)
const dayInitError = ref('')
const settlementLoading = ref(false)
const settlementError = ref('')
const operationLogs = ref([])
let timer = null

// 获取系统状态
const fetchSystemStatus = async () => {
  try {
    // 这里应该是调用API获取系统状态
    // const res = await getSystemStatus();
    // currentWorkDay.value = res.workDay;
    // isOperating.value = res.isOperating;

    // 模拟数据
    currentWorkDay.value = new Date().toISOString().split('T')[0]
    isOperating.value = new Date().getHours() >= 9 && new Date().getHours() < 15
  } catch (error) {
    console.error('获取系统状态失败:', error)
  }
}

// 更新当前时间
const updateCurrentTime = () => {
  currentTime.value = formatDateTime(new Date())
}

// 执行日初始化
const handleDayInit = async () => {
  dayInitLoading.value = true
  dayInitError.value = ''

  await request.post("/clearing/initialize").then(res=>{
    if (res.code === '200'){
      // 更新本地状态
      const newDate = new Date(currentWorkDay.value)
      newDate.setDate(newDate.getDate() + 1)
      currentWorkDay.value = newDate.toISOString().split('T')[0]
      isOperating.value = true

      // 记录日志
      addOperationLog(`日初始化成功，新工作日：${currentWorkDay.value}`)

      ElMessage.success('日初始化成功')
    }else {
      console.error('日初始化失败:', res.msg)
      dayInitError.value = res.msg || '日初始化失败'
      ElMessage.error(res.msg||'日初始化失败')
    }
  })
  dayInitLoading.value = false
}

// 执行结算
const handleSettlement = async () => {
  settlementLoading.value = true
  settlementError.value = ''
  // 调用结算API
  await request.post("/clearing/settle").then(res=>{
    if (res.code === '200'){
      // 更新本地状态
      isOperating.value = false
      // 记录日志
      addOperationLog(`结算成功，工作日：${currentWorkDay.value}已完成结算`)
      ElMessage.success('结算成功')
    }else {
      console.error('结算失败:', res.msg)
      settlementError.value = res.msg || '结算失败'
      ElMessage.error(res.msg||'结算失败')
    }
  })
  settlementLoading.value = false
}

// 添加操作日志
const addOperationLog = (message) => {
  const log = {
    timestamp: formatDateTime(new Date()),
    message: message
  }

  operationLogs.value.unshift(log)

  // 保持最多50条日志
  if (operationLogs.value.length > 50) {
    operationLogs.value.pop()
  }

  // 保存到本地存储
  localStorage.setItem('clearingOperationLogs', JSON.stringify(operationLogs.value))
}

// 生命周期钩子
onMounted(() => {
  fetchSystemStatus()
  timer = setInterval(updateCurrentTime, 1000)

  // 从本地存储加载操作日志
  const savedLogs = localStorage.getItem('clearingOperationLogs')
  if (savedLogs) {
    operationLogs.value = JSON.parse(savedLogs)
  }
})

onBeforeUnmount(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.clearing-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.status-panel {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.status-info {
  margin-top: 15px;
}

.status-info p {
  margin: 8px 0;
  font-size: 16px;
}

.status-open {
  color: #67c23a;
  font-weight: bold;
}

.status-closed {
  color: #f56c6c;
  font-weight: bold;
}

.operation-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.operation-card {
  flex: 1;
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.operation-desc {
  color: #606266;
  margin: 15px 0;
  font-size: 14px;
}

.log-panel {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
}

.error-message {
  color: #f56c6c;
  margin-top: 10px;
  font-size: 14px;
}

.el-timeline {
  margin-top: 15px;
}
</style>