<template>
  <div class="product-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="产品代码">
          <el-input v-model="searchForm.code" placeholder="请输入产品代码" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.name" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="产品类型">
          <el-select style="width: 200px;" v-model="searchForm.type" placeholder="请选择产品类型" clearable>
            <el-option
                v-for="item in productTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select style="width: 200px;" v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
            <el-option
                v-for="item in riskLevels"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select style="width: 200px;margin-left: 28px" v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="可交易" :value="1" />
            <el-option label="停止交易" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="份额类别">
          <el-select style="width: 200px;" v-model="searchForm.shareType" placeholder="请选择份额类别" clearable>
            <el-option
                v-for="item in shareTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="公司">
          <el-input style="margin-left: 28px" v-model="searchForm.company" placeholder="请输入公司名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="showAddDialog">新增产品</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品列表 -->
    <el-card class="table-card">
      <el-table :data="productList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="code" label="产品代码" width="120" />
        <el-table-column prop="name" label="产品名称" width="180" />
        <el-table-column prop="type" label="产品类型" width="120">
          <template #default="{ row }">
            {{ getProductTypeLabel(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="company" label="所属公司" width="150" />
        <el-table-column prop="riskLevel" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelTagType(row.riskLevel)">
              {{ getRiskLevelLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '可交易' : '停止交易' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="shareType" label="份额类别" width="100">
          <template #default="{ row }">
            {{ getShareTypeLabel(row.shareType) }}
          </template>
        </el-table-column>
        <el-table-column prop="latestWorth" label="最新净值" width="120" />
        <el-table-column prop="totalAssets" label="总资产(亿元)" width="150" />
        <el-table-column prop="inceptionDate" label="成立日期" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editProduct(row.id)">编辑</el-button>
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

    <!-- 产品详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="产品详情" width="80%">
      <div v-if="currentProduct">
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="产品代码">{{ currentProduct.code }}</el-descriptions-item>
              <el-descriptions-item label="产品名称">{{ currentProduct.name }}</el-descriptions-item>
              <el-descriptions-item label="产品类型">{{ getProductTypeLabel(currentProduct.type) }}</el-descriptions-item>
              <el-descriptions-item label="所属公司">{{ currentProduct.company }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="getRiskLevelTagType(currentProduct.riskLevel)">
                  {{ getRiskLevelLabel(currentProduct.riskLevel) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="currentProduct.status ? 'success' : 'danger'">
                  {{ currentProduct.status ? '可交易' : '停止交易' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="份额类别">{{ getShareTypeLabel(currentProduct.shareType) }}</el-descriptions-item>
              <el-descriptions-item label="最新净值">{{ currentProduct.latestWorth }}</el-descriptions-item>
              <el-descriptions-item label="总资产(亿元)">{{ currentProduct.totalAssets }}</el-descriptions-item>
              <el-descriptions-item label="成立日期">{{ currentProduct.inceptionDate }}</el-descriptions-item>
              <el-descriptions-item label="产品描述">{{ currentProduct.description }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="净值走势">
            <div style="height: 500px; width: 100%; display: flex; justify-content: center; align-items: center;">
              <el-empty description="暂无净值数据" v-if="!netValueData.length" />
              <div v-else ref="chartContainer" style="width: 900px; height: 500px;"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑产品对话框 -->
    <el-dialog
        v-model="editDialogVisible"
        :title="isEdit ? '编辑产品' : '新增产品'"
        width="50%"
    >
      <el-form
          ref="productFormRef"
          :model="productForm"
          :rules="productRules"
          label-width="120px"
      >
        <el-form-item label="产品代码" prop="code">
          <el-input v-model="productForm.code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="productForm.name" />
        </el-form-item>
        <el-form-item label="产品类型" prop="type">
          <el-select v-model="productForm.type" placeholder="请选择产品类型">
            <el-option
                v-for="item in productTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司" prop="company">
          <el-input v-model="productForm.company" />
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="productForm.riskLevel" placeholder="请选择风险等级">
            <el-option
                v-for="item in riskLevels"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="productForm.status">
            <el-radio :label="1">可交易</el-radio>
            <el-radio :label="0">停止交易</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="份额类别" prop="shareType">
          <el-select v-model="productForm.shareType" placeholder="请选择份额类别">
            <el-option
                v-for="item in shareTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="最新净值" prop="latestWorth">
          <el-input-number
              v-model="productForm.latestWorth"
              :min="0"
              :precision="4"
              :step="0.0001"
          />
        </el-form-item>
        <el-form-item label="总资产(亿元)" prop="totalAssets">
          <el-input-number
              v-model="productForm.totalAssets"
              :min="0"
              :precision="2"
              :step="0.01"
          />
        </el-form-item>
        <el-form-item label="成立日期" prop="inceptionDate">
          <el-date-picker
              v-model="productForm.inceptionDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="产品描述" prop="description">
          <el-input
              v-model="productForm.description"
              type="textarea"
              :rows="3"
              maxlength="255"
              show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProduct">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 模拟数据
const mockProducts = [
  {
    id: 1,
    code: '000001',
    name: '稳健增长债券A',
    type: 1,
    company: '华夏基金',
    inceptionDate: '2020-01-15',
    latestWorth: 1.2345,
    totalAssets: 125.67,
    riskLevel: 1,
    status: 1,
    shareType: 1,
    description: '主要投资于高等级信用债，追求稳健收益'
  },
  {
    id: 2,
    code: '000002',
    name: '科技先锋股票',
    type: 2,
    company: '易方达基金',
    inceptionDate: '2019-05-20',
    latestWorth: 2.5678,
    totalAssets: 89.32,
    riskLevel: 3,
    status: 1,
    shareType: 2,
    description: '重点投资科技创新领域龙头企业'
  },
  {
    id: 3,
    code: '000003',
    name: '平衡配置混合',
    type: 3,
    company: '南方基金',
    inceptionDate: '2018-11-10',
    latestWorth: 1.8765,
    totalAssets: 156.89,
    riskLevel: 2,
    status: 0,
    shareType: 3,
    description: '股债平衡配置，追求长期稳健增值'
  }
]

const mockNetValue = [
  { date: '2023-01-01', value: 1.12 },
  { date: '2023-01-02', value: 1.13 },
  { date: '2023-01-03', value: 1.15 },
  { date: '2023-01-04', value: 1.14 },
  { date: '2023-01-05', value: 1.16 },
  { date: '2023-01-06', value: 1.18 },
  { date: '2023-01-07', value: 1.17 }
]

// 枚举值
const productTypes = [
  { value: 1, label: '货币型' },
  { value: 2, label: '股票型' },
  { value: 3, label: '混合型' },
  { value: 4, label: '债券型' },
  { value: 5, label: '指数型' }
]

const riskLevels = [
  { value: 1, label: '低风险' },
  { value: 2, label: '中风险' },
  { value: 3, label: '高风险' }
]

const shareTypes = [
  { value: 1, label: 'A类' },
  { value: 2, label: 'B类' },
  { value: 3, label: 'C类' },
  { value: 4, label: 'D类' },
  { value: 5, label: 'E类' }
]

// 获取枚举标签的辅助函数
const getProductTypeLabel = (type) => {
  return productTypes.find(item => item.value === type)?.label || '未知'
}

const getRiskLevelLabel = (level) => {
  return riskLevels.find(item => item.value === level)?.label || '未知'
}

const getRiskLevelTagType = (level) => {
  const types = { 1: 'success', 2: 'warning', 3: 'danger' }
  return types[level] || ''
}

const getShareTypeLabel = (type) => {
  return shareTypes.find(item => item.value === type)?.label || '未知'
}

// 查询表单
const searchForm = reactive({
  code: '',
  name: '',
  type: null,
  riskLevel: null,
  status: null,
  shareType: null,
  company: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 产品列表
const productList = ref([])
const loading = ref(false)

// 详情对话框
const detailDialogVisible = ref(false)
const currentProduct = ref(null)
const netValueData = ref([])
const chartContainer = ref(null)
let chartInstance = null

// 新增/编辑对话框
const editDialogVisible = ref(false)
const isEdit = ref(false)
const productFormRef = ref(null)
const productForm = reactive({
  code: '',
  name: '',
  type: null,
  company: '',
  inceptionDate: '',
  latestWorth: null,
  totalAssets: null,
  riskLevel: null,
  status: 1,
  shareType: null,
  description: ''
})

// 表单验证规则
const productRules = {
  code: [{ required: true, message: '请输入产品代码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  company: [{ required: true, message: '请输入所属公司', trigger: 'blur' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  shareType: [{ required: true, message: '请选择份额类别', trigger: 'change' }],
  latestWorth: [{ required: true, message: '请输入最新净值', trigger: 'blur' }],
  totalAssets: [{ required: true, message: '请输入总资产', trigger: 'blur' }],
  inceptionDate: [{ required: true, message: '请选择成立日期', trigger: 'change' }]
}

// 初始化图表
const initChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartContainer.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>{a}: {c}'
    },
    xAxis: {
      type: 'category',
      data: netValueData.value.map(item => item.date)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '单位净值',
        type: 'line',
        data: netValueData.value.map(item => item.value),
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

// 查询产品列表
const fetchProducts = async () => {
  loading.value = true
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟筛选
    let filtered = [...mockProducts]
    if (searchForm.code) {
      filtered = filtered.filter(item => item.code.includes(searchForm.code))
    }
    if (searchForm.name) {
      filtered = filtered.filter(item => item.name.includes(searchForm.name))
    }
    if (searchForm.type) {
      filtered = filtered.filter(item => item.type === searchForm.type)
    }
    if (searchForm.riskLevel) {
      filtered = filtered.filter(item => item.riskLevel === searchForm.riskLevel)
    }
    if (searchForm.status !== null) {
      filtered = filtered.filter(item => item.status === searchForm.status)
    }
    if (searchForm.shareType) {
      filtered = filtered.filter(item => item.shareType === searchForm.shareType)
    }
    if (searchForm.company) {
      filtered = filtered.filter(item => item.company.includes(searchForm.company))
    }

    // 模拟分页
    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    productList.value = filtered.slice(start, end)
    pagination.total = filtered.length
  } catch (error) {
    ElMessage.error('获取产品列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 查询产品详情
const fetchProductDetail = async (id) => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 300))
    currentProduct.value = mockProducts.find(item => item.id === id)

    // 模拟获取净值数据
    await new Promise(resolve => setTimeout(resolve, 300))
    netValueData.value = [...mockNetValue]

    if (netValueData.value.length) {
      await nextTick()
      initChart()
    }
  } catch (error) {
    ElMessage.error('获取产品详情失败')
    console.error(error)
  }
}

// 新增/更新产品
const saveProduct = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success(isEdit.value ? '产品更新成功' : '产品添加成功')
    editDialogVisible.value = false
    fetchProducts()
  } catch (error) {
    ElMessage.error(isEdit.value ? '产品更新失败' : '产品添加失败')
    console.error(error)
  }
}

// 事件处理
const handleSearch = () => {
  pagination.currentPage = 1
  fetchProducts()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = key === 'status' ? null : ''
  })
  handleSearch()
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchProducts()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  fetchProducts()
}

const viewDetail = (id) => {
  detailDialogVisible.value = true
  fetchProductDetail(id)
}

const showAddDialog = () => {
  isEdit.value = false
  Object.keys(productForm).forEach(key => {
    productForm[key] = key === 'status' ? 1 : (['latestWorth', 'totalAssets'].includes(key) ? null : '')
  })
  editDialogVisible.value = true
}

const editProduct = (id) => {
  isEdit.value = true
  const product = productList.value.find(item => item.id === id)
  if (product) {
    Object.keys(productForm).forEach(key => {
      productForm[key] = product[key]
    })
    editDialogVisible.value = true
  }
}

const submitProduct = async () => {
  try {
    await productFormRef.value.validate()
    await saveProduct()
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 生命周期
onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.product-container {
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