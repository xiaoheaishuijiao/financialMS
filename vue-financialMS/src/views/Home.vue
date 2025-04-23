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
        <li>日初始化、结算等关键操作需<strong>双人复核</strong></li>
        <li>操作前请确认业务数据已<strong>完整备份</strong></li>
      </ul>
    </el-alert>

    <!-- 管理员信息及登录记录 -->
    <el-card class="admin-info-card">
      <div class="admin-info">
        <div class="admin-avatar">
          <el-avatar :size="60" :src="admin.avatar" />
          <el-tag type="warning" class="admin-role">{{ admin.role }}</el-tag>
        </div>
        <div class="admin-details">
          <h3>{{ admin.name }} <small>({{ admin.dept }})</small></h3>
          <p>上次登录: {{ admin.lastLogin }} <el-tag size="small">{{ admin.lastIp }}</el-tag></p>
          <p>登录次数: {{ admin.loginCount }} | 操作记录: {{ admin.operationCount }}</p>
        </div>
        <div class="security-status">
          <el-alert
              :title="securityStatus.title"
              :type="securityStatus.type"
              :closable="false"
              show-icon>
            {{ securityStatus.message }}
          </el-alert>
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
            <el-tag v-if="systemStatus.isOperating" type="danger">已营业</el-tag>
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
              :disabled="systemStatus.isOperating"
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
            <el-tag v-if="systemStatus.isOperating" type="success">可结算</el-tag>
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
              :disabled="!systemStatus.isOperating"
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

        <!-- 数据备份操作 -->
        <el-card shadow="hover" class="operation-card">
          <div class="card-header">
            <h4><i class="el-icon-copy-document"></i> 数据备份</h4>
            <el-tag :type="backupStatus.type">{{ backupStatus.text }}</el-tag>
          </div>
          <p class="operation-desc">执行关键操作前请确保已完成数据备份</p>

          <div class="operation-warning">
            <el-alert
                title="最后备份信息"
                :type="backupStatus.type"
                :closable="false"
                show-icon>
              <p>{{ backupStatus.lastTime }}</p>
              <p>{{ backupStatus.lastOperator }}</p>
            </el-alert>
          </div>

          <el-button
              type="warning"
              @click="showBackupDialog"
              class="operation-button">
            <i class="el-icon-upload2"></i> 立即备份数据
          </el-button>

          <p class="operation-guide">
            <el-link type="primary" :underline="false" @click="showGuide('backup')">
              <i class="el-icon-document"></i> 备份恢复指南
            </el-link>
          </p>
        </el-card>
      </div>
    </div>

    <!-- 操作审计记录 -->
    <el-card class="audit-log">
      <template #header>
        <div class="audit-header">
          <h3><i class="el-icon-notebook-2"></i> 操作审计日志</h3>
          <div>
            <el-date-picker
                v-model="auditDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                @change="fetchAuditLogs" />
            <el-button type="primary" size="small" @click="exportAuditLogs" style="margin-left: 10px;">
              <i class="el-icon-download"></i> 导出日志
            </el-button>
          </div>
        </div>
      </template>

      <el-table
          :data="auditLogs"
          style="width: 100%"
          border
          v-loading="auditLoading">
        <el-table-column prop="time" label="操作时间" width="180" sortable />
        <el-table-column prop="operator" label="操作员" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="operation" label="操作类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getOperationType(row.operation)">{{ row.operation }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column label="详情" width="80">
          <template #default="{ row }">
            <el-button size="small" @click="showAuditDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="auditPage.current"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="auditPage.size"
            layout="total, sizes, prev, pager, next, jumper"
            :total="auditPage.total" />
      </div>
    </el-card>

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

    <!-- 日初始化确认对话框 -->
    <el-dialog
        title="确认执行日初始化"
        v-model="dayInitDialogVisible"
        width="50%">
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
        <el-form-item label="复核人选择" required>
          <el-select
              v-model="dayInitForm.reviewer"
              placeholder="请选择复核人员"
              style="width: 100%">
            <el-option
                v-for="user in reviewers"
                :key="user.id"
                :label="user.name + ' (' + user.position + ')'"
                :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input
              v-model="dayInitForm.remark"
              type="textarea"
              placeholder="请简要说明执行原因或注意事项"
              :rows="3" />
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
        width="50%">
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

      <el-form :model="settleForm" label-width="120px" class="confirm-form">
        <el-form-item label="操作员密码" required>
          <el-input
              v-model="settleForm.password"
              type="password"
              placeholder="请输入您的登录密码确认操作"
              show-password />
        </el-form-item>
        <el-form-item label="复核人选择" required>
          <el-select
              v-model="settleForm.reviewer"
              placeholder="请选择复核人员"
              style="width: 100%">
            <el-option
                v-for="user in reviewers"
                :key="user.id"
                :label="user.name + ' (' + user.position + ')'"
                :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作备注">
          <el-input
              v-model="settleForm.remark"
              type="textarea"
              placeholder="请简要说明执行原因或注意事项"
              :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="settleDialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            @click="confirmSettle"
            :loading="settleLoading">
          确认执行日终结算
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 管理员信息
const admin = ref({
  name: '张安全',
  dept: '清算部',
  role: '系统管理员',
  avatar: '',
  lastLogin: '2023-06-15 08:30:45',
  lastIp: '192.168.1.100',
  loginCount: 128,
  operationCount: 356
})

// 安全状态
const securityStatus = computed(() => {
  return {
    title: '安全状态: 正常',
    type: 'success',
    message: '所有安全策略已启用，最后安全检查: 今天 09:00'
  }
})

// 系统状态
const systemStatus = ref({
  workDay: '2023-06-15',
  isOperating: false,
  nextWorkDay: '2023-06-16'
})

// 备份状态
const backupStatus = ref({
  lastTime: '2023-06-14 17:30:22',
  lastOperator: '张安全 (清算部)',
  type: 'success',
  text: '今日已备份'
})

// 复核人员列表
const reviewers = ref([
  { id: 1, name: '李复核', position: '清算主管' },
  { id: 2, name: '王监督', position: '风控专员' },
  { id: 3, name: '赵审计', position: '审计员' }
])

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
              <li>填写操作备注</li>
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
             <li>选择复核人员（需不同岗位）</li>
             <li>输入操作密码确认</li>
             <li>填写操作备注</li>
             <li>点击确认执行</li>
           </ol>
           <p><strong>结算内容：</strong></p>
           <ul>
             <li>计算所有基金当日净值</li>
             <li>处理申购/赎回交易</li>
             <li>执行资金划转</li>
             <li>生成结算报告</li>
           </ul>`,
  backup: `<h3>数据备份与恢复指南</h3>
           <p><strong>备份策略：</strong></p>
           <ul>
             <li>每日营业前自动全量备份</li>
             <li>关键操作前手动触发备份</li>
             <li>备份文件加密存储</li>
           </ul>
           <p><strong>备份步骤：</strong></p>
           <ol>
             <li>进入备份管理页面</li>
             <li>选择备份类型（全量/增量）</li>
             <li>指定备份存储位置</li>
             <li>输入操作密码确认</li>
             <li>等待备份完成</li>
             <li>验证备份文件完整性</li>
           </ol>
           <p><strong>恢复步骤：</strong></p>
           <ol>
             <li>进入恢复管理页面</li>
             <li>选择备份文件</li>
             <li>输入操作密码确认</li>
             <li>确认恢复时间点</li>
             <li>执行恢复操作</li>
             <li>验证数据完整性</li>
           </ol>`
}

// 审计日志相关
const auditLogs = ref([
  {
    time: '2023-06-15 09:15:22',
    operator: '张安全',
    module: '系统管理',
    operation: '登录系统',
    description: '用户登录系统',
    ip: '192.168.1.100'
  },
  {
    time: '2023-06-15 09:20:35',
    operator: '张安全',
    module: '清算管理',
    operation: '数据备份',
    description: '执行全量数据备份',
    ip: '192.168.1.100'
  },
  {
    time: '2023-06-14 17:30:15',
    operator: '张安全',
    module: '清算管理',
    operation: '日终结算',
    description: '执行日终结算操作',
    ip: '192.168.1.100'
  },
  {
    time: '2023-06-14 09:05:42',
    operator: '李复核',
    module: '清算管理',
    operation: '日初始化',
    description: '执行日初始化操作',
    ip: '192.168.1.101'
  }
])
const auditLoading = ref(false)
const auditDateRange = ref([])
const auditPage = ref({
  current: 1,
  size: 10,
  total: 4
})

// 日初始化相关
const dayInitDialogVisible = ref(false)
const dayInitForm = ref({
  password: '',
  reviewer: '',
  remark: ''
})
const dayInitLoading = ref(false)

// 结算相关
const settleDialogVisible = ref(false)
const settleForm = ref({
  password: '',
  reviewer: '',
  remark: ''
})
const settleLoading = ref(false)
const settleStats = ref({
  subscription: 156,
  redemption: 89,
  funds: 23,
  amount: '5,678,923.45'
})

// 计算下一个工作日
const nextWorkDay = computed(() => {
  const date = new Date(systemStatus.value.workDay)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

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
    dayInitDialogVisible.value = true
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const confirmDayInit = () => {
  dayInitLoading.value = true
  // 模拟API调用
  setTimeout(() => {
    dayInitLoading.value = false
    dayInitDialogVisible.value = false
    systemStatus.value.isOperating = true
    systemStatus.value.workDay = nextWorkDay.value
    ElMessage.success('日初始化成功')
    addAuditLog('清算管理', '日初始化', `执行日初始化，新工作日: ${nextWorkDay.value}`)
  }, 1500)
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
    settleDialogVisible.value = true
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const confirmSettle = () => {
  settleLoading.value = true
  // 模拟API调用
  setTimeout(() => {
    settleLoading.value = false
    settleDialogVisible.value = false
    systemStatus.value.isOperating = false
    ElMessage.success('日终结算成功')
    addAuditLog('清算管理', '日终结算', `执行日终结算，处理交易: ${settleStats.value.subscription}笔申购/${settleStats.value.redemption}笔赎回`)
  }, 2000)
}

const showBackupDialog = () => {
  ElMessageBox.prompt('请输入备份备注信息', '数据备份', {
    confirmButtonText: '开始备份',
    cancelButtonText: '取消',
    inputPlaceholder: '例如：日初始化前备份',
    inputValidator: (value) => {
      if (!value || value.length < 5) {
        return '备注信息至少需要5个字符'
      }
      return true
    }
  }).then(({ value }) => {
    backupData(value)
  }).catch(() => {
    ElMessage.info('已取消备份')
  })
}

const backupData = (remark) => {
  ElMessage.info('开始数据备份...')
  // 模拟备份过程
  setTimeout(() => {
    backupStatus.value = {
      lastTime: new Date().toLocaleString(),
      lastOperator: `${admin.value.name} (${admin.value.dept})`,
      type: 'success',
      text: '备份成功'
    }
    ElMessage.success('数据备份成功')
    addAuditLog('系统管理', '数据备份', `执行数据备份，备注: ${remark}`)
  }, 3000)
}

const addAuditLog = (module, operation, description) => {
  auditLogs.value.unshift({
    time: new Date().toLocaleString(),
    operator: admin.value.name,
    module: module,
    operation: operation,
    description: description,
    ip: admin.value.lastIp
  })
  auditPage.value.total += 1
}

const getOperationType = (operation) => {
  const criticalOps = ['日初始化', '日终结算', '数据备份', '数据恢复']
  const warningOps = ['权限变更', '系统配置']

  if (criticalOps.includes(operation)) return 'danger'
  if (warningOps.includes(operation)) return 'warning'
  return ''
}

const fetchAuditLogs = () => {
  auditLoading.value = true
  // 模拟API调用
  setTimeout(() => {
    auditLoading.value = false
  }, 500)
}

const exportAuditLogs = () => {
  ElMessage.success('审计日志导出任务已开始，请稍后查看下载')
}

const handleSizeChange = (val) => {
  auditPage.value.size = val
  fetchAuditLogs()
}

const handleCurrentChange = (val) => {
  auditPage.value.current = val
  fetchAuditLogs()
}

const showAuditDetail = (row) => {
  ElMessageBox.alert(`<strong>操作详情：</strong><br><br>
                     <strong>操作员：</strong>${row.operator}<br>
                     <strong>操作时间：</strong>${row.time}<br>
                     <strong>操作模块：</strong>${row.module}<br>
                     <strong>操作类型：</strong>${row.operation}<br>
                     <strong>操作描述：</strong>${row.description}<br>
                     <strong>IP地址：</strong>${row.ip}`, '操作详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '关闭'
  })
}

onMounted(() => {
  // 初始化数据
  fetchAuditLogs()
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
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
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
  grid-template-columns: repeat(3, 1fr);
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