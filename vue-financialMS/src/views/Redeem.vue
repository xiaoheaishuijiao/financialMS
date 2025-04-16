<template>
  <div class="redeem-container">
    <el-card class="redeem-card">
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="选择客户" />
        <el-step title="选择产品" />
        <el-step title="确认赎回" />
      </el-steps>

      <!-- 第一步：选择客户 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-form label-width="120px">
          <el-form-item label="客户账号">
            <el-autocomplete
                v-model="clientQuery"
                :fetch-suggestions="searchClients"
                placeholder="请输入客户账号"
                clearable
                @select="handleClientSelect"
            >
              <template #default="{ item }">
                <div>{{ item.accountNumber }} - {{ item.name || item.contactName }}</div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <el-form-item v-if="selectedClient">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="客户姓名">{{ selectedClient.type === 1 ? selectedClient.name : selectedClient.contactName }}</el-descriptions-item>
              <el-descriptions-item label="客户类型">{{ selectedClient.type === 1 ? '个人' : '企业' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ selectedClient.contactNumber }}</el-descriptions-item>
            </el-descriptions>
          </el-form-item>

          <el-form-item v-if="clientHoldings.length > 0" label="持有产品">
            <el-table :data="clientHoldings" border style="width: 100%">
              <el-table-column prop="fundCode" label="基金代码" width="120" />
              <el-table-column prop="fundName" label="基金名称" width="180" />
              <el-table-column prop="shareTotal" label="持有份额" width="120" />
              <el-table-column prop="cardNumber" label="购买银行卡" width="180" />
            </el-table>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第二步：选择产品 -->
      <div v-if="currentStep === 2" class="step-content">
        <el-form label-width="120px">
          <el-form-item label="基金代码">
            <el-autocomplete
                v-model="fundQuery"
                :fetch-suggestions="searchFunds"
                placeholder="请输入基金代码或名称"
                clearable
                @select="handleFundSelect"
            >
              <template #default="{ item }">
                <div>{{ item.fundCode }} - {{ item.fundName }} (持有: {{ item.shareTotal }}份)</div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <el-form-item v-if="selectedHolding" label="基金信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="基金名称">{{ selectedHolding.fundName }}</el-descriptions-item>
              <el-descriptions-item label="基金代码">{{ selectedHolding.fundCode }}</el-descriptions-item>
              <el-descriptions-item label="持有份额">{{ selectedHolding.shareTotal }}</el-descriptions-item>
              <el-descriptions-item label="购买银行卡">{{ selectedHolding.cardNumber }}</el-descriptions-item>
            </el-descriptions>
          </el-form-item>

          <el-form-item label="赎回份额" prop="shares">
            <el-input-number
                v-model="redeemForm.shares"
                :min="1"
                :max="selectedHolding ? selectedHolding.shareTotal : 1000000"
                :precision="0"
                placeholder="请输入赎回份额"
                style="width: 200px"
            />
            <span style="margin-left: 10px;">份 (最多可赎回 {{ selectedHolding ? selectedHolding.shareTotal : 1000000 }} 份)</span>
          </el-form-item>

          <el-form-item label="收款方式">
            <el-radio-group v-model="paymentMethod">
              <el-radio :label="1">原卡退回</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="收款银行卡" prop="cardNumber" v-if="paymentMethod === 1">
            <el-select v-model="redeemForm.cardNumber" placeholder="请选择银行卡" disabled>
              <el-option
                  :label="selectedHolding ? selectedHolding.cardNumber : ''"
                  :value="selectedHolding ? selectedHolding.cardNumber : ''"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第三步：确认赎回 -->
      <div v-if="currentStep === 3" class="step-content">
        <el-card>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="客户信息">
              {{ selectedClient.type === 1 ? selectedClient.name : selectedClient.contactName }} ({{ selectedClient.accountNumber }})
            </el-descriptions-item>
            <el-descriptions-item label="基金信息">
              {{ selectedHolding.fundName }} ({{ selectedHolding.fundCode }})
            </el-descriptions-item>
            <el-descriptions-item label="赎回份额">
              {{ redeemForm.shares }} 份
            </el-descriptions-item>
            <el-descriptions-item label="收款方式">
              原卡退回 ({{ redeemForm.cardNumber }})
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>

      <div class="step-actions">
        <el-button @click="prevStep" v-if="currentStep > 1">上一步</el-button>
        <el-button
            type="primary"
            @click="nextStep"
            :disabled="!canProceed"
        >
          {{ currentStep === 3 ? '提交赎回' : '下一步' }}
        </el-button>
        <el-button @click="cancelRedeem" v-if="currentStep === 1">取消</el-button>
      </div>
    </el-card>

    <!-- 赎回确认对话框 -->
    <el-dialog v-model="redeemDialogVisible" title="赎回成功" width="50%">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="赎回编号">{{ redeemResult.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="基金名称">{{ selectedHolding?.value.fundName||'--' }} ({{ selectedHolding?.value.fundCode||'--' }})</el-descriptions-item>
        <el-descriptions-item label="赎回份额">{{ redeemForm.shares }} 份</el-descriptions-item>
        <el-descriptions-item label="预计到账金额">{{ redeemResult.estimatedAmount }} 元</el-descriptions-item>
        <el-descriptions-item label="交易日期">{{ redeemResult.tradeDate }}</el-descriptions-item>
        <el-descriptions-item label="预计到账日期">{{ redeemResult.estimatedArrivalDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="warning">处理中</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="finishRedeem">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据
const mockClients = [
  {
    id: 1,
    name: '张三',
    accountNumber: 'AC10001',
    type: 1,
    contactName: '',
    contactNumber: '13800138000'
  },
  {
    id: 2,
    name: '',
    accountNumber: 'AC20001',
    type: 2,
    contactName: '李四',
    contactNumber: '13900139000'
  }
]

const mockHoldings = [
  {
    clientId: 1,
    fundId: 1,
    fundCode: '000001',
    fundName: '稳健增长债券A',
    shareTotal: 5000,
    cardNumber: '6222021001123456789'
  },
  {
    clientId: 1,
    fundId: 2,
    fundCode: '000002',
    fundName: '科技先锋股票',
    shareTotal: 3000,
    cardNumber: '6227001001234567890'
  },
  {
    clientId: 2,
    fundId: 1,
    fundCode: '000001',
    fundName: '稳健增长债券A',
    shareTotal: 10000,
    cardNumber: '4563510012345678901'
  }
]

const mockFunds = [
  {
    id: 1,
    code: '000001',
    name: '稳健增长债券A',
    latestWorth: 1.2345
  },
  {
    id: 2,
    code: '000002',
    name: '科技先锋股票',
    latestWorth: 2.5678
  }
]


// 步骤控制
const currentStep = ref(1)

// 客户选择
const clientQuery = ref('')
const selectedClient = ref(null)
const clientHoldings = ref([])

// 基金选择
const fundQuery = ref('')
const selectedHolding = ref(null)

// 赎回表单
const redeemForm = reactive({
  shares: null,
  cardNumber: ''
})

const paymentMethod = ref(1)

// 赎回结果
const redeemDialogVisible = ref(false)
const redeemResult = reactive({
  orderNumber: '',
  estimatedAmount: 0,
  tradeDate: '',
  estimatedArrivalDate: ''
})


// 客户搜索
const searchClients = (query, cb) => {
  // 模拟API请求
  setTimeout(() => {
    const results = query
        ? mockClients.filter(item =>
            item.accountNumber.includes(query) ||
            (item.name && item.name.includes(query)) ||
            (item.contactName && item.contactName.includes(query))
        )
        : mockClients.slice(0, 5)
    cb(results.map(item => ({ ...item, value: item.accountNumber })))
  }, 300)
}

const handleClientSelect = async (item) => {
  selectedClient.value = item
  // 模拟获取客户持仓
  await new Promise(resolve => setTimeout(resolve, 300))
  clientHoldings.value = mockHoldings.filter(h => h.clientId === item.id)
}

// 基金搜索
const searchFunds = (query, cb) => {
  // 模拟API请求
  setTimeout(() => {
    const results = query
        ? clientHoldings.value.filter(item =>
            item.fundCode.includes(query) ||
            item.fundName.includes(query)
        )
        : clientHoldings.value.slice(0, 5)
    cb(results.map(item => ({ ...item, value: item.fundCode })))
  }, 300)
}

const handleFundSelect = (item) => {
  selectedHolding.value = item
  redeemForm.cardNumber = item.cardNumber
}

// 步骤控制
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!selectedClient.value && clientHoldings.value.length > 0
    case 2: return !!selectedHolding.value && redeemForm.shares > 0
    case 3: return true
    default: return false
  }
})

const nextStep = () => {
  if (currentStep.value === 3) {
    submitRedeem()
  } else {
    currentStep.value = currentStep.value + 1
    console.log("currentStep:"+currentStep)
  }
}

const prevStep = () => {
  currentStep.value--
}

const cancelRedeem = () => {
  resetForm()
}

const resetForm = () => {
  currentStep.value = 1
  clientQuery.value = ''
  fundQuery.value = ''
  selectedClient.value = null
  selectedHolding.value = null
  clientHoldings.value = []
  Object.assign(redeemForm, {
    shares: null,
    cardNumber: ''
  })
}

// 提交赎回
const submitRedeem = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 800))

    // 计算预计金额（份额 * 最新净值）
    const fund = mockFunds.find(f => f.id === selectedHolding.value.fundId)
    const amount = (redeemForm.shares * fund.latestWorth).toFixed(2)

    // 模拟返回数据
    Object.assign(redeemResult, {
      orderNumber: 'RED' + Date.now().toString().slice(-8),
      estimatedAmount: amount,
      tradeDate: new Date().toLocaleDateString(),
      estimatedArrivalDate: new Date(Date.now() + 86400000 * 3).toLocaleDateString()
    })

    redeemDialogVisible.value = true
  } catch (error) {
    ElMessage.error('赎回提交失败')
    console.error(error)
  }
}

const finishRedeem = () => {
  redeemDialogVisible.value = false
  resetForm()
  ElMessage.success("操作成功")
}
</script>


<style scoped>
.redeem-container {
  padding: 20px;
}

.redeem-card {
  margin-bottom: 20px;
}

.step-content {
  margin: 30px 0;
  padding: 0 20px;
}

.step-actions {
  margin-top: 30px;
  text-align: center;
}

:deep(.el-step.is-simple .el-step__title) {
  font-size: 16px;
}
</style>,