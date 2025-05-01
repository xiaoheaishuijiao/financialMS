<template>
  <div class="clearing-container">
    <!-- 系统状态面板 -->
    <div class="status-panel">
      <h2>系统状态</h2>
      <div class="status-info">
        <p><strong>当前工作日：</strong> {{ currentWorkDay }}</p>
        <p><strong>营业状态：</strong>
          <span :class="{'status-open': !isOperating, 'status-closed': isOperating}">
            {{ !isOperating ? '正在营业' : '已结算' }}
          </span>
        </p>
        <p><strong>当前时间：</strong> {{ currentTime }}</p>
      </div>
    </div>

    <!-- 操作面板 -->
    <div class="operation-panel">
      <div class="operation-card">
        <h3>日初始化</h3>
        <p class="operation-desc">每日早晨九点前后，执行日初始化开始一天的营业。</p>
        <el-button
            type="primary"
            :disabled="!isOperating"
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
            :disabled="isOperating"
            @click="handleSettlement"
            :loading="settlementLoading">
          执行结算
        </el-button>
        <p v-if="settlementError" class="error-message">{{ settlementError }}</p>
      </div>
    </div>

    <!-- 操作日志 -->
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

    <!-- 日初始化确认对话框 -->
    <el-dialog
        title="确认执行日初始化"
        v-model="dayInitDialogVisible"
        width="50%"
        @closed="dayInitForm.password = ''">
      <el-alert
          title="警告：此操作不可逆"
          type="error"
          :closable="false"
          show-icon>
        执行后工作日将变为 <strong>{{ nextWorkDay }}</strong>，系统将进入营业状态
      </el-alert>

      <el-form :model="dayInitForm" label-width="120px" class="confirm-form">
        <el-form-item label="操作员密码" required>
          <el-input
              v-model="dayInitForm.password"
              type="password"
              placeholder="请输入您的登录密码确认操作"
              show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dayInitDialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            @click="confirmDayInit"
            :loading="dayInitLoading">
          确认执行日初始化
        </el-button>
      </template>
    </el-dialog>

    <!-- 结算确认对话框 -->
    <el-dialog
        title="确认执行日终结算"
        v-model="settleDialogVisible"
        width="50%"
        @closed="settleForm.password = ''">
      <el-alert
          title="警告：结算将处理所有当日交易"
          type="error"
          :closable="false"
          show-icon>
        执行后系统将进入结算状态，当日所有交易将最终确认
      </el-alert>

      <div class="settle-summary">
        <h4>当日交易统计</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申购委托">{{ settleStats.subscription }}</el-descriptions-item>
          <el-descriptions-item label="赎回委托">{{ settleStats.redemption }}</el-descriptions-item>
          <el-descriptions-item label="涉及基金">{{ settleStats.funds }}</el-descriptions-item>
          <el-descriptions-item label="涉及金额">{{ settleStats.amount }} 元</el-descriptions-item>
        </el-descriptions>
      </div>

      <el-form :model="settleForm" label-width="120px" class="confirm-form" style="margin-top: 10px">
        <el-form-item label="操作员密码" required>
          <el-input
              v-model="settleForm.password"
              type="password"
              placeholder="请输入您的登录密码确认操作"
              show-password />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="settleDialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            @click="confirmSettle"
            :loading="settlementLoading">
          确认执行日终结算
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.js"
import { formatDateTime } from '@/utils/date'

// 系统状态
const currentWorkDay = ref('')
const isOperating = ref(false)
const currentTime = ref('')
let timer = null

// 操作状态
const dayInitLoading = ref(false)
const dayInitError = ref('')
const settlementLoading = ref(false)
const settlementError = ref('')

// 操作日志
const operationLogs = ref([])

// 日初始化相关
const dayInitDialogVisible = ref(false)
const dayInitForm = ref({
  password: '',
})

// 结算相关
const settleDialogVisible = ref(false)
const settleForm = ref({
  password: '',
})

const settleStats = ref({
  subscription: 0,
  redemption: 0,
  funds: 0,
  amount: '0.00'
})

// 计算下一个工作日
const nextWorkDay = computed(() => {
  if (!currentWorkDay.value) return ''
  const date = new Date(currentWorkDay.value)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

// 更新当前时间
const updateCurrentTime = () => {
  currentTime.value = formatDateTime(new Date())
}

// 添加操作日志
const addOperationLog = (message) => {
  operationLogs.value.unshift({
    timestamp: formatDateTime(new Date()),
    message
  })
  // 限制日志数量并保存到本地存储
  if (operationLogs.value.length > 50) {
    operationLogs.value = operationLogs.value.slice(0, 50)
  }
  localStorage.setItem('clearingOperationLogs', JSON.stringify(operationLogs.value))
}

// 获取系统状态
const fetchSystemStatus = async () => {
  try {
    const res = await request.get('/clearing/status')
    if (res.code === '200') {
      currentWorkDay.value = res.data.workDay
      isOperating.value = res.data.isOperating
    } else {
      ElMessage.error(res.msg || '获取系统状态失败')
    }
  } catch (error) {
    console.error('获取系统状态失败:', error)
    ElMessage.error('获取系统状态失败')
  }
}

// 获取交易统计数据
const fetchSettleStats = async () => {
  try {
    const res = await request.get('/clearing/settle-stats')
    if (res.code === '200') {
      settleStats.value = res.data
    }else {
      ElMessage.error(res.msg||"获取交易统计数据失败")
    }
  } catch (error) {
    console.error('获取交易统计数据失败:', error)
  }
}

// 日初始化操作
const handleDayInit = () => {
  dayInitForm.value.password = ''
  dayInitDialogVisible.value = true
}

const confirmDayInit = async () => {
  if (!dayInitForm.value.password) {
    ElMessage.warning('请输入操作员密码')
    return
  }

  dayInitLoading.value = true
  try {
    const res = await request.post('/clearing/initialize', {
      password: dayInitForm.value.password
    })

    if (res.code === '200') {
      isOperating.value = true
      currentWorkDay.value = nextWorkDay.value
      dayInitDialogVisible.value = false
      addOperationLog(`日初始化成功，新工作日：${currentWorkDay.value}`)
      ElMessage.success('日初始化成功')
    } else {
      ElMessage.error(res.msg || '日初始化失败')
    }
  } catch (error) {
    console.error('日初始化失败:', error)
    ElMessage.error('日初始化请求失败')
  } finally {
    dayInitLoading.value = false
  }
}

// 结算操作
const handleSettlement = async () => {
  await fetchSettleStats()
  settleForm.value.password = ''
  settleDialogVisible.value = true
}

const confirmSettle = async () => {
  if (!settleForm.value.password) {
    ElMessage.warning('请输入操作员密码')
    return
  }

  settlementLoading.value = true
  try {
    const res = await request.post('/clearing/settle', {
      password: settleForm.value.password
    })

    if (res.code === '200') {
      isOperating.value = false
      settleDialogVisible.value = false
      addOperationLog(`日终结算成功，工作日：${currentWorkDay.value}`)
      ElMessage.success('日终结算成功')
    } else {
      ElMessage.error(res.msg || '日终结算失败')
    }
  } catch (error) {
    console.error('日终结算失败:', error)
    ElMessage.error('日终结算请求失败')
  } finally {
    settlementLoading.value = false
  }
}

// 初始化
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

.settle-summary {
  margin: 15px 0;
}

.confirm-form {
  margin-top: 20px;
}
</style>