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
import request from "@/utils/request.js";

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
  isSuccess: null,
  currentPage: 1,
  pageSize: 10
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
const fetchOperations = () => {
  searchForm.currentPage = pagination.currentPage
  searchForm.pageSize = pagination.pageSize
  request.get("/businessQuery",{params:searchForm}).then(res=>{
    console.log("businessQuery:",res.data)
    if (res.code === '200') {
      operationList.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.msg||"查询失败")
    }
  })
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