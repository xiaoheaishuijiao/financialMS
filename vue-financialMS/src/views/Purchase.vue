<template>
  <div class="purchase-container">
    <el-card class="purchase-card">
      <el-steps :active="currentStep" finish-status="success" simple>
        <el-step title="选择客户" />
        <el-step title="选择产品" />
        <el-step title="确认订单" />
      </el-steps>

      <!-- 第一步：选择客户 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-form label-width="120px">
          <el-form-item label="客户账号">
            <el-autocomplete
                v-model="clientQuery"
                placeholder="请输入客户账号"
                clearable
                @select="handleClientSelect"
                :fetch-suggestions="handleClientQuery"
            >
              <template #default="{ item }">
                <div>{{ item.accountNumber }} - {{ item.name || item.contactName }}</div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <el-form-item label="委托方式" prop="entrustMode">
            <el-select v-model="orderForm.entrustMode" placeholder="请选择委托方式">
              <el-option
                  v-for="item in entrustModes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="selectedClient">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="客户姓名">{{ selectedClient.type === 1 ? selectedClient.name : selectedClient.contactName }}</el-descriptions-item>
              <el-descriptions-item label="客户类型">{{ selectedClient.type === 1 ? '个人' : '企业' }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="riskTagType(selectedClient.riskTolerance)">
                  {{ riskLabel(selectedClient.riskTolerance) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ selectedClient.contactNumber }}</el-descriptions-item>
            </el-descriptions>
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
                <div>{{ item.code }} - {{ item.name }}</div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <el-form-item v-if="selectedFund" label="基金信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item span="2" label="基金名称">{{ selectedFund.name }}</el-descriptions-item>
              <el-descriptions-item label="最新净值">{{ selectedFund.latestWorth }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="riskTagType(selectedFund.riskLevel)">
                  {{ riskLabel(selectedFund.riskLevel) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-form-item>

          <el-form-item label="购买金额" prop="amount">
            <el-input-number
                v-model="orderForm.amount"
                :min="1000"
                :step="1000"
                :precision="2"
                style="width: 200px"
                placeholder="请输入购买金额"
            />
            <span style="margin-left: 10px;">元</span>
          </el-form-item>

          <el-form-item label="付款方式">
            <el-radio-group v-model="paymentMethod">
              <el-radio :label="1">银行卡支付</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择银行卡" prop="cardNumber" v-if="paymentMethod === 1">
            <el-select v-model="orderForm.cardNumber" placeholder="请选择银行卡" @click="bankCardQuery">
              <el-option
                  v-for="card in bankCards"
                  :key="card.id"
                  :label="`${card.bankName} (${card.cardNumber})`"
                  :value="card.cardNumber"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 第三步：确认订单 -->
      <div v-if="currentStep === 3" class="step-content">
        <el-card>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="客户信息">
              {{ selectedClient.type === 1 ? selectedClient.name : selectedClient.contactName }} ({{ selectedClient.accountNumber }})
            </el-descriptions-item>
            <el-descriptions-item label="委托方式">
              {{ getEntrustModeLabel(orderForm.entrustMode) }}
            </el-descriptions-item>
            <el-descriptions-item label="基金信息">
              {{ selectedFund.name }} ({{ selectedFund.code }})
            </el-descriptions-item>
            <el-descriptions-item label="购买金额">
              {{ orderForm.amount }} 元
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              银行卡支付 ({{ orderForm.cardNumber }})
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
          {{ currentStep === 3 ? '提交申购' : '下一步' }}
        </el-button>
        <el-button @click="cancelPurchase" v-if="currentStep === 1">取消</el-button>
      </div>
    </el-card>

    <!-- 订单确认对话框 -->
    <el-dialog v-model="orderDialogVisible" title="申购成功" width="50%">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订单编号">{{ orderResult.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="基金名称">{{ selectedFund?.value.name||'--' }} ({{ selectedFund?.value.code||'--' }})</el-descriptions-item>
        <el-descriptions-item label="申购金额">{{ orderForm.amount }} 元</el-descriptions-item>
        <el-descriptions-item label="预计确认份额">{{ orderResult.estimatedShares }} 份</el-descriptions-item>
        <el-descriptions-item label="交易日期">{{ orderResult.tradeDate }}</el-descriptions-item>
        <el-descriptions-item label="预计确认日期">{{ orderResult.estimatedConfirmDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag type="warning">待确认</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="finishPurchase">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.js";

// 模拟数据
const mockClients = [
  {
    id: 1,
    name: '张三',
    accountNumber: 'AC10001',
    type: 1,
    contactName: '',
    contactNumber: '13800138000',
    riskTolerance: 2,
    bankCards: [
      { id: 1, bankName: '中国工商银行', cardNumber: '6222021001123456789' },
      { id: 2, bankName: '中国建设银行', cardNumber: '6227001001234567890' }
    ]
  },
  {
    id: 2,
    name: '',
    accountNumber: 'AC20001',
    type: 2,
    contactName: '李四',
    contactNumber: '13900139000',
    riskTolerance: 3,
    bankCards: [
      { id: 3, bankName: '中国银行', cardNumber: '4563510012345678901' }
    ]
  }
]

const mockFunds = [
  {
    id: 1,
    code: '000001',
    name: '稳健增长债券A',
    latestWorth: 1.2345,
    riskLevel: 1
  },
  {
    id: 2,
    code: '000002',
    name: '科技先锋股票',
    latestWorth: 2.5678,
    riskLevel: 3
  }
]

// 枚举值
const entrustModes = [
  { value: 1, label: '柜台委托' },
  { value: 2, label: '网上委托' },
  { value: 3, label: '电话委托' },
  { value: 4, label: '自动委托' },
  { value: 5, label: '第三方授权委托' }
]

const productTypes = [
  { value: 1, label: '货币型' },
  { value: 2, label: '股票型' },
  { value: 3, label: '混合型' },
  { value: 4, label: '债券型' },
  { value: 5, label: '指数型' }
]

// 步骤控制
const currentStep = ref(1)

// 客户选择
const clientQuery = ref('')
const clientQueryList = ref(null)
const selectedClient = ref(null)
const bankCards = ref([])

// 基金选择
const fundQuery = ref('')
const fundQueryList = ref('')
const selectedFund = ref(null)

// 订单表单
const orderForm = reactive({
  entrustMode: 1,
  amount: null,
  cardNumber: ''
})

const paymentMethod = ref(1)

// 订单结果
const orderDialogVisible = ref(false)
const orderResult = reactive({
  orderNumber: '',
  estimatedShares: 0,
  tradeDate: '',
  estimatedConfirmDate: ''
})

// 辅助函数
const riskLabel = (level) => {
  return ['低', '中', '高'][level - 1] || '未知'
}

const riskTagType = (level) => {
  return ['success', 'warning', 'danger'][level - 1] || ''
}

const getProductTypeLabel = (type) => {
  return productTypes.find(item => item.value === type)?.label || '未知'
}

const getEntrustModeLabel = (mode) => {
  return entrustModes.find(item => item.value === mode)?.label || '未知'
}

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

// 查询客户
const handleClientQuery = async (query, cb) => {
  request.get("/purchase/getClient",{params:clientQuery}).then(res => {
    if (res.code === '200') {
      clientQueryList.value = res.data
      console.log(clientQueryList)
      cb(clientQueryList.value)
    }else {
      ElMessage.error("查询客户信息失败")
    }
  })
}

// 选择客户
const handleClientSelect = (item) => {
  selectedClient.value = item
  console.log("selectedClient:",selectedClient.value.id)
  clientQuery.value = item.accountNumber
}

// 基金搜索
const searchFunds = (query, cb) => {
  // 模拟API请求
  setTimeout(() => {
    const results = query
        ? mockFunds.filter(item =>
            item.code.includes(query) ||
            item.name.includes(query)
        )
        : mockFunds.slice(0, 5)
    cb(results.map(item => ({ ...item, value: item.code })))
  }, 300)
}

const handleFundSelect = (item) => {
  console.log(item)
  selectedFund.value = item
}

// 查询银行卡
const bankCardQuery = () => {
  request.get("/purchase/bankCard",{params:{id:selectedClient.value.id}}).then(res => {
    console.log("selectedClient.value.id:",selectedClient.value.id)
    if (res.code === '200'){
      bankCards.value = res.data
    }else {
      ElMessage.error("查询银行卡失败")
    }
  })
}

// 步骤控制
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return !!selectedClient.value
    case 2: return !!selectedFund.value && !!orderForm.amount && !!orderForm.cardNumber
    case 3: return true
    default: return false
  }
})

const nextStep = () => {
  if (currentStep.value === 3) {
    submitOrder()
  } else {
    currentStep.value++
  }
}

const prevStep = () => {
  currentStep.value--
}

const cancelPurchase = () => {
  resetForm()
}

const resetForm = () => {
  currentStep.value = 1
  clientQuery.value = ''
  fundQuery.value = ''
  selectedClient.value = null
  selectedFund.value = null
  bankCards.value = []
  Object.assign(orderForm, {
    entrustMode: 1,
    amount: null,
    cardNumber: ''
  })
}

// 提交订单
const submitOrder = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 800))

    // 模拟返回数据
    console.log("selectedFund:",selectedFund)
    Object.assign(orderResult, {
      orderNumber: 'ORD' + Date.now().toString().slice(-8),
      estimatedShares: (orderForm.amount / selectedFund.value.latestWorth).toFixed(2),
      tradeDate: new Date().toLocaleDateString(),
      estimatedConfirmDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString()
    })

    orderDialogVisible.value = true
  } catch (error) {
    ElMessage.error('申购提交失败')
    console.error(error)
  }
}

const finishPurchase = () => {
  orderDialogVisible.value = false
  resetForm()
  ElMessage.success("购买成功")
}
</script>

<style scoped>
.purchase-container {
  padding: 20px;
}

.purchase-card {
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
</style>