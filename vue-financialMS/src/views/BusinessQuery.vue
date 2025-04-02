<template>
  <div class="clearing-container">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作员账号">
          <el-input
              v-model="searchForm.operatorUsername"
              placeholder="请输入操作员账号"
              clearable
          />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input
              v-model="searchForm.clientName"
              placeholder="请输入客户名称"
              clearable
          />
        </el-form-item>
        <el-form-item label="操作日期">
          <el-date-picker
              v-model="searchForm.operateDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              clearable
          />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select
              v-model="searchForm.type"
              placeholder="请选择业务类型"
              clearable
              style="width: 200px"
          >
            <el-option
                v-for="item in operationTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作结果">
          <el-select
              v-model="searchForm.isSuccess"
              placeholder="请选择操作结果"
              clearable
              style="width: 200px"
          >
            <el-option label="成功" :value="true" />
            <el-option label="失败" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="operationList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="业务类型" width="120">
          <template #default="{ row }">
            {{ getOperationTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorUsername" label="操作员" width="150" />
        <el-table-column prop="clientName" label="客户名称" width="150" />
        <el-table-column prop="isSuccess" label="操作结果" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSuccess ? 'success' : 'danger'">
              {{ row.isSuccess ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column prop="service" label="调用服务" width="150" />
        <el-table-column label="请求参数" min-width="200">
          <template #default="{ row }">
            <el-popover
                placement="top-start"
                title="请求参数"
                :width="400"
                trigger="hover"
                :content="row.params"
            >
              <template #reference>
                <el-button type="text">{{ truncateParams(row.params) }}</el-button>
              </template>
            </el-popover>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据
const mockOperations = [
  {
    id: 1,
    type: 1,
    isSuccess: true,
    operatorId: 1,
    operatorUsername: 'admin',
    clientName: '张三',
    operateTime: '2023-06-15 10:30:25',
    service: 'fundPurchaseService',
    params: JSON.stringify({ fundCode: '000001', amount: 10000, shareType: 1 })
  },
  {
    id: 2,
    type: 2,
    isSuccess: true,
    operatorId: 1,
    operatorUsername: 'admin',
    clientName: '李四',
    operateTime: '2023-06-15 11:15:30',
    service: 'fundRedeemService',
    params: JSON.stringify({ fundCode: '000002', shares: 500, shareType: 2 })
  },
  {
    id: 3,
    type: 3,
    isSuccess: true,
    operatorId: 2,
    operatorUsername: 'operator1',
    clientName: '王五',
    operateTime: '2023-06-16 09:20:15',
    service: 'clientCreateService',
    params: JSON.stringify({ name: '王五', type: 1, certificateType: 1 })
  },
  {
    id: 4,
    type: 4,
    isSuccess: false,
    operatorId: 2,
    operatorUsername: 'operator1',
    clientName: '赵六',
    operateTime: '2023-06-16 14:45:50',
    service: 'riskEvaluationService',
    params: JSON.stringify({ age: 35, experience: 2, target: 2 })
  }
]

const mockOperators = [
  { id: 1, username: 'admin' },
  { id: 2, username: 'operator1' }
]

// 业务类型枚举
const operationTypes = [
  { value: 1, label: '申购' },
  { value: 2, label: '赎回' },
  { value: 3, label: '开户' },
  { value: 4, label: '风险评测' },
  { value: 5, label: '修改客户信息' },
  { value: 6, label: '新增产品' },
  { value: 7, label: '修改产品信息' },
  { value: 8, label: '清算' }
]

// 查询表单
const searchForm = reactive({
  operatorUsername: '',
  clientName: '',
  operateDate: '',
  type: null,
  isSuccess: null
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 操作列表
const operationList = ref([])
const loading = ref(false)

// 辅助函数
const getOperationTypeLabel = (type) => {
  return operationTypes.find(item => item.value === type)?.label || '未知'
}

const truncateParams = (params) => {
  if (!params) return '无'
  try {
    const parsed = JSON.parse(params)
    const str = JSON.stringify(parsed)
    return str.length > 30 ? str.substring(0, 30) + '...' : str
  } catch {
    return params.length > 30 ? params.substring(0, 30) + '...' : params
  }
}

// 查询操作记录
const fetchOperations = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟筛选
    let filtered = [...mockOperations]
    if (searchForm.operatorUsername) {
      filtered = filtered.filter(item =>
          item.operatorUsername.includes(searchForm.operatorUsername))
    }
    if (searchForm.clientName) {
      filtered = filtered.filter(item =>
          item.clientName.includes(searchForm.clientName))
    }
    if (searchForm.operateDate) {
      filtered = filtered.filter(item =>
          item.operateTime.startsWith(searchForm.operateDate))
    }
    if (searchForm.type) {
      filtered = filtered.filter(item => item.type === searchForm.type)
    }
    if (searchForm.isSuccess !== null) {
      filtered = filtered.filter(item => item.isSuccess === searchForm.isSuccess)
    }

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    operationList.value = filtered.slice(start, end)
    pagination.total = filtered.length
  } catch (error) {
    ElMessage.error('获取操作记录失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 分页事件
const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchOperations()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchOperations()
}

// 查询事件
const handleSearch = () => {
  pagination.currentPage = 1
  fetchOperations()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'isSuccess' ? null : ''
  })
  handleSearch()
}

// 初始化
onMounted(() => {
  fetchOperations()
})
</script>

<style scoped>
.clearing-container {
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