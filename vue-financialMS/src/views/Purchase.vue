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
        <el-descriptions-item label="基金名称">{{ selectedFund?.name||'--' }} ({{ selectedFund?.code||'--' }})</el-descriptions-item>
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

// 枚举值
const entrustModes = [
  { value: 1, label: '柜台委托' },
  { value: 2, label: '网上委托' },
  { value: 3, label: '电话委托' },
  { value: 4, label: '自动委托' },
  { value: 5, label: '第三方授权委托' }
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
  cardNumber: '',
  cardId: null,
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
const orderResultForm = reactive({
  clientId: '',
  fundId: '',
  amount: null,
  cardId: '',
  entrustMode: 1,
})

// 辅助函数
const riskLabel = (level) => {
  return ['低', '中', '高'][level - 1] || '未知'
}

const riskTagType = (level) => {
  return ['success', 'warning', 'danger'][level - 1] || ''
}

const getEntrustModeLabel = (mode) => {
  return entrustModes.find(item => item.value === mode)?.label || '未知'
}

// 查询客户
const handleClientQuery = async (query, cb) => {
  request.get("/client/code",{params:clientQuery}).then(res => {
    console.log("查询客户的res值",res)
    if (res.code === '200') {
      clientQueryList.value = res.data
      console.log(clientQueryList)
      cb(clientQueryList.value)
    }else {
      ElMessage.error(res.msg||"未查询到客户信息")
    }
  })
}

// 选择客户
const handleClientSelect = (item) => {
  selectedClient.value = item
  console.log("selectedClient:",selectedClient.value.id)
  clientQuery.value = item.accountNumber
}

// 查询产品
const searchFunds = (query, cb) => {
  request.get("/product/code",{params:fundQuery}).then(res => {
    if (res.code === '200') {
      fundQueryList.value = res.data
      cb(fundQueryList.value)
    }else {
      ElMessage.error(res.msg||"未查询到基金信息")
    }
  })
}

// 选择基金
const handleFundSelect = (item) => {
  selectedFund.value = item
  console.log("selectedClient:",selectedFund.value.id)
  fundQuery.value = item.code
}

// 查询银行卡
const bankCardQuery = () => {
  request.get("/bankCard/list",{params:{clientId:selectedClient.value.id}}).then(res => {
    console.log("selectedClient.value.id:",selectedClient.value.id)
    if (res.code === '200'){
      bankCards.value = res.data
    }else {
      ElMessage.error(res.msg||"查询银行卡失败")
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
const submitOrder =  () => {
  // 处理提交信息
  console.log("根据银行卡号找到的银行卡：",bankCards.value.find(card => card.cardNumber === orderForm.cardNumber))
  Object.assign(orderResultForm,{
    clientId: selectedClient.value.id,
    fundId: selectedFund.value.id,
    amount: orderForm.amount,
    cardId: bankCards.value.find(card => card.cardNumber === orderForm.cardNumber).id,
    entrustMode: orderForm.entrustMode,
  })
  console.log("orderResultForm:",orderResultForm)
  request.post("/order/purchase",orderResultForm).then(res => {
    if(res.code === '200'){
      console.log("orderCardId",orderResultForm.cardId)
      Object.assign(orderResult, {
        orderNumber: 'ORD' + Date.now().toString().slice(-8),
        estimatedShares: (orderForm.amount / selectedFund.value.latestWorth).toFixed(2),
        tradeDate: new Date().toLocaleDateString(),
        estimatedConfirmDate: new Date(Date.now() + 86400000 * 2).toLocaleDateString()
      })
      orderDialogVisible.value = true
    }else {
      ElMessage.error(res.msg||"提交订单失败")
    }
  })
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