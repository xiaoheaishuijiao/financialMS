<template>
  <div class="admin-dashboard">
    <!-- 顶部安全警示栏 -->
    <el-alert
        title="安全操作警示"
        type="warning"
        :closable="false"
        class="security-alert">
      <p>您正在访问<strong>基金清算系统管理控制台</strong>，请注意：</p>
      <ul>
        <li>所有操作将被<strong>记录并审计</strong>，请谨慎执行</li>
        <li>日初始化、结算等关键操作需<strong>复核</strong></li>
        <li>操作前请确认业务数据已<strong>确认无误</strong></li>
      </ul>
    </el-alert>

    <!-- 管理员信息及登录记录 -->
    <el-card class="admin-info-card">
      <div class="admin-info">

        <div class="admin-details">
          <h3>{{ admin.name }} <el-tag type="warning" class="admin-role">{{ "系统管理员" }}</el-tag></h3>
          <p>上次登录: {{ admin.lastLogin }} <el-tag size="small">{{ admin.lastIp }}</el-tag></p>
          <p>登录次数: {{ admin.loginCount }} | 操作记录: {{ admin.operationCount }}</p>
        </div>
      </div>
    </el-card>

    <!-- 关键操作面板 -->
    <div class="critical-operations">
      <h3 class="section-title"><i class="el-icon-warning"></i> 关键清算操作</h3>
      <p class="section-desc">以下操作将直接影响系统业务数据，执行前请确保已完成必要检查</p>

      <div class="operation-cards">
        <!-- 日初始化操作 -->
        <el-card shadow="hover" class="operation-card">
          <div class="card-header">
            <h4><i class="el-icon-sunny"></i> 日初始化</h4>
            <el-tag v-if="!systemStatus.isOperating" type="danger">已营业</el-tag>
            <el-tag v-else type="success">已结算</el-tag>
          </div>
          <p class="operation-desc">每日营业前执行，将工作日推进一天并开启系统营业状态</p>

          <div class="operation-warning">
            <el-alert
                title="操作影响"
                type="error"
                :closable="false"
                show-icon>
              <ul>
                <li>工作日将不可逆地+1</li>
                <li>系统将进入营业状态允许交易</li>
                <li>需在营业前完成所有准备工作</li>
              </ul>
            </el-alert>
          </div>

          <el-button
              type="primary"
              :disabled="!systemStatus.isOperating"
              @click="showDayInitDialog"
              class="operation-button">
            <i class="el-icon-unlock"></i> 执行日初始化
          </el-button>

          <p class="operation-guide">
            <el-link type="primary" :underline="false" @click="showGuide('dayInit')">
              <i class="el-icon-document"></i> 查看操作指南
            </el-link>
          </p>
        </el-card>

        <!-- 日终结算操作 -->
        <el-card shadow="hover" class="operation-card">
          <div class="card-header">
            <h4><i class="el-icon-moon"></i> 日终结算</h4>
            <el-tag v-if="!systemStatus.isOperating" type="success">可结算</el-tag>
            <el-tag v-else type="info">已结算</el-tag>
          </div>
          <p class="operation-desc">每日营业结束后执行，计算净值并处理当日所有交易</p>

          <div class="operation-warning">
            <el-alert
                title="操作影响"
                type="error"
                :closable="false"
                show-icon>
              <ul>
                <li>将计算所有基金当日净值</li>
                <li>处理申购/赎回交易并执行资金划转</li>
                <li>系统将进入结算状态禁止交易</li>
              </ul>
            </el-alert>
          </div>

          <el-button
              type="danger"
              :disabled="systemStatus.isOperating"
              @click="showSettleDialog"
              class="operation-button">
            <i class="el-icon-lock"></i> 执行日终结算
          </el-button>

          <p class="operation-guide">
            <el-link type="primary" :underline="false" @click="showGuide('settle')">
              <i class="el-icon-document"></i> 查看操作指南
            </el-link>
          </p>
        </el-card>
      </div>
    </div>

    <!-- 操作指南对话框 -->
    <el-dialog
        :title="guideTitle"
        v-model="guideDialogVisible"
        width="60%">
      <div v-html="guideContent"></div>
      <template #footer>
        <el-button @click="guideDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printGuide">打印指南</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from "@/router/index.js";
import request from "@/utils/request.js";

// 管理员信息
const admin = ref({
  name: '张安全',
  lastLogin: '2023-06-15 08:30:45',
  lastIp: '192.168.1.100',
  loginCount: 128,
  operationCount: 356
})

// 系统状态
const systemStatus = ref({
  workDay: '2023-06-15',
  isOperating: false,
})

// 操作指南相关
const guideDialogVisible = ref(false)
const guideTitle = ref('')
const guideContent = ref('')
const guides = {
  dayInit: `<h3>日初始化操作指南</h3>
            <p><strong>执行时机：</strong>每日营业前，通常在上午9:00前完成</p>
            <p><strong>执行条件：</strong></p>
            <ol>
              <li>确认前一日结算已完成</li>
              <li>确认所有待处理事务已解决</li>
              <li>确认数据备份已完成</li>
            </ol>
            <p><strong>操作步骤：</strong></p>
            <ol>
              <li>主操作员登录系统</li>
              <li>选择复核人员（需不同岗位）</li>
              <li>输入操作密码确认</li>
              <li>点击确认执行</li>
            </ol>
            <p><strong>注意事项：</strong></p>
            <ul>
              <li>工作日推进后将无法回退</li>
              <li>执行后系统将立即允许交易委托</li>
              <li>请确保所有准备工作已完成</li>
            </ul>`,
  settle: `<h3>日终结算操作指南</h3>
           <p><strong>执行时机：</strong>每日营业结束后，通常在15:00后</p>
           <p><strong>执行条件：</strong></p>
           <ol>
             <li>确认当日所有委托已录入</li>
             <li>确认无异常交易需要处理</li>
             <li>确认数据备份已完成</li>
           </ol>
           <p><strong>操作步骤：</strong></p>
           <ol>
             <li>主操作员登录系统</li>
             <li>复核当日交易统计数据</li>
             <li>选择复核人员</li>
             <li>输入操作密码确认</li>
             <li>点击确认执行</li>
           </ol>
           <p><strong>结算内容：</strong></p>
           <ul>
             <li>计算所有基金当日净值</li>
             <li>处理申购/赎回交易</li>
             <li>执行资金划转</li>
             <li>生成结算报告</li>
           </ul>`,
}


// 获取当前系统信息
const fetchSystemStatus = async () => {
  try {
    const res = await request.get('/clearing/status')
    if (res.code === '200') {
      systemStatus.value.workDay = res.data.workDay
      systemStatus.value.isOperating = res.data.isOperating
    } else {
      ElMessage.error(res.msg || '获取系统状态失败')
    }
  } catch (error) {
    console.error('获取系统状态失败:', error)
    ElMessage.error('获取系统状态失败')
  }
}

// 获取当前管理员信息
const fetchAdminStatus = async () => {
  try {
    const res = await request.get('/businessQuery/adminStatus')
    console.log("ip地址是：",localStorage.getItem("Ip"))
    if (res.code === '200') {
      admin.value.name = res.data.name
      admin.value.lastLogin = res.data.lastLogin
      admin.value.lastIp = res.data.lastIp
      admin.value.loginCount = res.data.loginCount
      admin.value.operationCount = res.data.operationCount
    } else {
      ElMessage.error(res.msg || '获取管理员状态失败')
    }
  } catch (error) {
    console.error('获取管理员状态失败:', error)
    ElMessage.error('获取管理员状态失败')
  }
}

// 操作方法
const showGuide = (type) => {
  guideTitle.value = type === 'dayInit' ? '日初始化操作指南'
      : type === 'settle' ? '日终结算操作指南'
          : '数据备份恢复指南'
  guideContent.value = guides[type]
  guideDialogVisible.value = true
}

const printGuide = () => {
  window.print()
}

const showDayInitDialog = () => {
  ElMessageBox.confirm(
      '您即将执行日初始化操作，此操作将推进工作日并开启系统营业状态。确认继续吗？',
      '操作确认',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
  ).then(() => {
    router.push({
      path:"/clearing"
    })
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const showSettleDialog = () => {
  ElMessageBox.confirm(
      '您即将执行日终结算操作，此操作将处理当日所有交易并关闭系统营业状态。确认继续吗？',
      '操作确认',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true
      }
  ).then(() => {
    router.push({
      path:"/clearing"
    })
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

onMounted(() => {
  // 获取系统状态
  fetchSystemStatus()
  // 获取管理员状态
  fetchAdminStatus()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.security-alert {
  margin-bottom: 20px;
}

.security-alert p {
  margin: 5px 0;
}

.security-alert ul {
  margin: 10px 0 0 20px;
}

.admin-info-card {
  margin-bottom: 20px;
}

.admin-info {
  display: flex;
  align-items: center;
}

.admin-avatar {
  position: relative;
  margin-right: 20px;
}

.admin-role {
  position: relative;
  margin-left: 5px;
}

.admin-details {
  flex: 1;
}

.admin-details h3 {
  margin: 0 0 5px;
  font-size: 18px;
}

.admin-details p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.security-status {
  width: 300px;
}

.section-title {
  margin: 20px 0 10px;
  font-size: 18px;
  color: #303133;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 8px;
}

.section-desc {
  margin: 0 0 15px;
  font-size: 14px;
  color: #909399;
}

.operation-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.operation-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-header h4 {
  margin: 0;
  display: flex;
  align-items: center;
}

.card-header h4 i {
  margin-right: 8px;
}

.operation-desc {
  margin: 0 0 15px;
  color: #606266;
  font-size: 14px;
}

.operation-warning {
  margin-bottom: 15px;
}

.operation-button {
  width: 100%;
  margin-top: auto;
}

.operation-guide {
  margin: 10px 0 0;
  text-align: center;
}

.audit-log {
  margin-bottom: 20px;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.confirm-form {
  margin-top: 20px;
}

.settle-summary {
  margin: 20px 0;
}

.settle-summary h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #606266;
}
</style>