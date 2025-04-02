<template>
  <div class="user-management-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input style="margin-left: 28px" v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="searchForm.accountNumber" placeholder="请输入账号" clearable />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select style="width: 200px" v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="个人" :value="1" />
            <el-option label="企业" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险承受">
          <el-select style="width: 200px" v-model="searchForm.riskTolerance" placeholder="请选择风险" clearable>
            <el-option label="低" :value="1" />
            <el-option label="中" :value="2" />
            <el-option label="高" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="投资目标">
          <el-select style="width: 200px" v-model="searchForm.target" placeholder="请选择目标" clearable>
            <el-option label="保值" :value="1" />
            <el-option label="增收" :value="2" />
            <el-option label="高收益" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select style="width: 200px" v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="冻结" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showCreateDialog">新增客户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table :data="userList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="accountNumber" label="账号" width="150" />
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            {{ row.type === 2 ? row.contactName : row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            {{ row.type === 1 ? '个人' : '企业' }}
          </template>
        </el-table-column>
        <el-table-column prop="certificateNumber" label="证件号码" width="180" />
        <el-table-column prop="riskTolerance" label="风险承受" width="100">
          <template #default="{ row }">
            <el-tag :type="riskTagType(row.riskTolerance)">
              {{ riskLabel(row.riskTolerance) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="投资目标" width="100">
          <template #default="{ row }">
            {{ targetLabel(row.target) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '冻结' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button size="small" type="primary" @click="editUser(row.id)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 开户对话框 -->
    <el-dialog
        v-model="createDialogVisible"
        :title="currentStep === 1 ? '填写基本信息' : '风险测评问卷'"
        width="50%"
        :before-close="handleCreateClose"
    >
      <!-- 第一步：基本信息 -->
      <el-form
          v-if="currentStep === 1"
          ref="basicFormRef"
          :model="basicForm"
          :rules="basicRules"
          label-width="120px"
      >
        <el-form-item label="客户类型" prop="type">
          <el-radio-group v-model="basicForm.type">
            <el-radio :label="1">个人</el-radio>
            <el-radio :label="2">企业</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="姓名" prop="name" v-if="basicForm.type === 1">
          <el-input v-model="basicForm.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactName" v-if="basicForm.type === 2">
          <el-input v-model="basicForm.contactName" />
        </el-form-item>
        <el-form-item label="证件类型" prop="certificateType">
          <el-select v-model="basicForm.certificateType">
            <el-option label="身份证" :value="1" />
            <el-option label="护照" :value="2" />
            <el-option label="营业执照" :value="3" v-if="basicForm.type === 2" />
          </el-select>
        </el-form-item>
        <el-form-item label="证件号码" prop="certificateNumber">
          <el-input v-model="basicForm.certificateNumber" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactNumber">
          <el-input v-model="basicForm.contactNumber" />
        </el-form-item>
        <el-form-item label="邮箱" prop="mail">
          <el-input v-model="basicForm.mail" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="basicForm.address" />
        </el-form-item>
      </el-form>

      <!-- 第二步：风险问卷 -->
      <el-form v-if="currentStep === 2" ref="surveyFormRef" :model="surveyForm" label-width="180px" label-position="left">
        <el-form-item label="1. 您的年龄">
          <el-radio-group v-model="surveyForm.age">
            <el-radio :label="1">30岁以下</el-radio>
            <el-radio :label="2">30-50岁</el-radio>
            <el-radio :label="3">50岁以上</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="2. 您的投资经验">
          <el-radio-group v-model="surveyForm.experience">
            <el-radio :label="1">无经验</el-radio>
            <el-radio :label="2">1-3年</el-radio>
            <el-radio :label="3">3年以上</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="3. 您的投资目标">
          <el-radio-group v-model="surveyForm.target">
            <el-radio :label="1">保值，不亏损</el-radio>
            <el-radio :label="2">适度增长，可接受小幅波动</el-radio>
            <el-radio :label="3">高收益，可接受较大波动</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="4. 您能承受的最大亏损">
          <el-radio-group v-model="surveyForm.lossTolerance">
            <el-radio :label="1">10%以内</el-radio>
            <el-radio :label="2">10%-30%</el-radio>
            <el-radio :label="3">30%以上</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="cancelCreate" v-if="currentStep === 1">取消</el-button>
        <el-button @click="prevStep" v-if="currentStep === 2">上一步</el-button>
        <el-button type="primary" @click="nextStep">
          {{ currentStep === 1 ? '下一步' : '提交问卷' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="客户详情" width="60%">
      <el-tabs v-if="currentUser">
        <el-tab-pane label="基本信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="账号">{{ currentUser.accountNumber }}</el-descriptions-item>
            <el-descriptions-item label="类型">
              {{ currentUser.type === 1 ? '个人' : '企业' }}
            </el-descriptions-item>
            <el-descriptions-item label="姓名" v-if="currentUser.type === 1">
              {{ currentUser.name }}
            </el-descriptions-item>
            <el-descriptions-item label="联系人" v-if="currentUser.type === 2">
              {{ currentUser.contactName }}
            </el-descriptions-item>
            <el-descriptions-item label="证件类型">
              {{ certificateTypeLabel(currentUser.certificateType) }}
            </el-descriptions-item>
            <el-descriptions-item label="证件号码">
              {{ currentUser.certificateNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ currentUser.contactNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ currentUser.mail }}
            </el-descriptions-item>
            <el-descriptions-item label="地址">
              {{ currentUser.address }}
            </el-descriptions-item>
            <el-descriptions-item label="风险承受">
              <el-tag :type="riskTagType(currentUser.riskTolerance)">
                {{ riskLabel(currentUser.riskTolerance) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="投资目标">
              {{ targetLabel(currentUser.target) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentUser.status === 1 ? 'success' : 'danger'">
                {{ currentUser.status === 1 ? '正常' : '冻结' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ currentUser.createTime }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="银行卡管理">
          <div style="margin-bottom: 20px;">
            <el-button type="primary" @click="showAddBankCard">新增银行卡</el-button>
          </div>
          <el-table :data="bankCards" border style="width: 100%">
            <el-table-column prop="bankName" label="银行名称" width="150" />
            <el-table-column prop="cardNumber" label="卡号" width="200" />
            <el-table-column prop="isDefault" label="默认卡" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isDefault" type="success">是</el-tag>
                <el-button v-else size="small" @click="setDefaultCard(row.id)">设为默认</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="deleteCard(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增银行卡对话框 -->
    <el-dialog v-model="bankCardDialogVisible" title="新增银行卡" width="40%">
      <el-form :model="bankCardForm" label-width="100px">
        <el-form-item label="银行名称" prop="bankName">
          <el-input v-model="bankCardForm.bankName" />
        </el-form-item>
        <el-form-item label="卡号" prop="cardNumber">
          <el-input v-model="bankCardForm.cardNumber" />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="bankCardForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bankCardDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitBankCard">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据
const mockUsers = [
  {
    id: 1,
    name: '张三',
    accountNumber: 'AC10001',
    certificateType: 1,
    certificateNumber: '310101199001011234',
    type: 1,
    contactName: '',
    contactNumber: '13800138000',
    mail: 'zhangsan@example.com',
    address: '上海市浦东新区',
    riskTolerance: 2,
    target: 2,
    status: 1,
    createTime: '2023-01-15 10:30:00'
  },
  {
    id: 2,
    name: '',
    accountNumber: 'AC20001',
    certificateType: 3,
    certificateNumber: '91310101MA1FPX1234',
    type: 2,
    contactName: '李四',
    contactNumber: '13900139000',
    mail: 'lisi@company.com',
    address: '北京市海淀区',
    riskTolerance: 3,
    target: 3,
    status: 1,
    createTime: '2023-02-20 14:15:00'
  }
]

const mockBankCards = [
  { id: 1, userId: 1, bankName: '中国工商银行', cardNumber: '6222021001123456789', isDefault: true },
  { id: 2, userId: 1, bankName: '中国建设银行', cardNumber: '6227001001234567890', isDefault: false }
]

// 查询表单
const searchForm = reactive({
  name: '',
  accountNumber: '',
  type: null,
  riskTolerance: null,
  target: null,
  status: null
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 用户列表
const userList = ref([])
const loading = ref(false)

// 开户流程
const createDialogVisible = ref(false)
const currentStep = ref(1)
const basicFormRef = ref(null)
const surveyFormRef = ref(null)

const basicForm = reactive({
  type: 1,
  name: '',
  contactName: '',
  certificateType: 1,
  certificateNumber: '',
  contactNumber: '',
  mail: '',
  address: ''
})

const basicRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  certificateType: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
  certificateNumber: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
  contactNumber: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

const surveyForm = reactive({
  age: null,
  experience: null,
  target: null,
  lossTolerance: null
})

// 用户详情
const detailDialogVisible = ref(false)
const currentUser = ref(null)
const bankCards = ref([])

// 银行卡管理
const bankCardDialogVisible = ref(false)
const bankCardForm = reactive({
  bankName: '',
  cardNumber: '',
  isDefault: false
})

// 辅助函数
const riskLabel = (level) => {
  return ['低', '中', '高'][level - 1] || '未知'
}

const riskTagType = (level) => {
  return ['success', 'warning', 'danger'][level - 1] || ''
}

const targetLabel = (target) => {
  return ['保值', '增收', '高收益'][target - 1] || '未知'
}

const certificateTypeLabel = (type) => {
  return ['身份证', '护照', '营业执照'][type - 1] || '未知'
}

// 查询用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟筛选
    let filtered = [...mockUsers]
    if (searchForm.name) {
      filtered = filtered.filter(item =>
          (item.type === 1 && item.name.includes(searchForm.name)) ||
          (item.type === 2 && item.contactName.includes(searchForm.name))
      )
    }
    if (searchForm.accountNumber) {
      filtered = filtered.filter(item => item.accountNumber.includes(searchForm.accountNumber))
    }
    if (searchForm.type) {
      filtered = filtered.filter(item => item.type === searchForm.type)
    }
    if (searchForm.riskTolerance) {
      filtered = filtered.filter(item => item.riskTolerance === searchForm.riskTolerance)
    }
    if (searchForm.target) {
      filtered = filtered.filter(item => item.target === searchForm.target)
    }
    if (searchForm.status !== null) {
      filtered = filtered.filter(item => item.status === searchForm.status)
    }

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    userList.value = filtered.slice(start, end)
    pagination.total = filtered.length
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 开户流程
const showCreateDialog = () => {
  currentStep.value = 1
  createDialogVisible.value = true
}

const nextStep = async () => {
  if (currentStep.value === 1) {
    try {
      await basicFormRef.value.validate()
      // 模拟创建用户API
      await new Promise(resolve => setTimeout(resolve, 500))
      ElMessage.success('客户创建成功，请填写风险问卷')
      currentStep.value = 2
    } catch (error) {
      console.error('表单验证失败', error)
    }
  } else {
    try {
      await surveyFormRef.value.validate()
      // 模拟提交问卷API
      await new Promise(resolve => setTimeout(resolve, 500))
      ElMessage.success('问卷提交成功，客户已激活')
      createDialogVisible.value = false
      fetchUsers()
    } catch (error) {
      console.error('问卷提交失败', error)
    }
  }
}

const prevStep = () => {
  currentStep.value = 1
}

const cancelCreate = () => {
  createDialogVisible.value = false
  initBasicForm()
}

const initBasicForm = () => {
  Object.assign(basicForm, {
    type: 1,
    name: '',
    contactName: '',
    certificateType: 1,
    certificateNumber: '',
    contactNumber: '',
    mail: '',
    address: ''
  })
}

const handleCreateClose = (done) => {
  ElMessageBox.confirm('确定要放弃当前填写的内容吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
    initBasicForm()
  }).catch(() => {})
}

// 用户详情
const viewDetail = async (id) => {
  try {
    // 模拟获取用户详情
    await new Promise(resolve => setTimeout(resolve, 300))
    currentUser.value = mockUsers.find(item => item.id === id)

    // 模拟获取银行卡
    await new Promise(resolve => setTimeout(resolve, 300))
    bankCards.value = mockBankCards.filter(item => item.userId === id)

    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取用户详情失败')
    console.error(error)
  }
}

const editUser = (id) => {
  // 实际项目中这里应该跳转到编辑页面
  ElMessage.info('编辑功能将在详情页面实现')
  viewDetail(id)
}

// 银行卡管理
const showAddBankCard = () => {
  bankCardForm.bankName = ''
  bankCardForm.cardNumber = ''
  bankCardForm.isDefault = false
  bankCardDialogVisible.value = true
}

const submitBankCard = async () => {
  try {
    // 模拟添加银行卡API
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('银行卡添加成功')
    bankCardDialogVisible.value = false
    viewDetail(currentUser.value.id) // 刷新银行卡列表
  } catch (error) {
    ElMessage.error('添加银行卡失败')
    console.error(error)
  }
}

const setDefaultCard = async (cardId) => {
  try {
    // 模拟设置默认卡API
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('默认卡设置成功')
    viewDetail(currentUser.value.id) // 刷新银行卡列表
  } catch (error) {
    ElMessage.error('设置默认卡失败')
    console.error(error)
  }
}

const deleteCard = async (cardId) => {
  try {
    await ElMessageBox.confirm('确定要删除该银行卡吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    // 模拟删除银行卡API
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('银行卡删除成功')
    viewDetail(currentUser.value.id) // 刷新银行卡列表
  } catch (error) {
    console.log('取消删除')
  }
}

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchUsers()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchUsers()
}

// 查询事件
const handleSearch = () => {
  pagination.currentPage = 1
  fetchUsers()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'type'||'riskTolerance'||'target'||'status' ? null : ''
  })
  handleSearch()
}

// 初始化
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>