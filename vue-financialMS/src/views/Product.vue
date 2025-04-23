<template>
  <div class="product-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="产品代码">
          <el-input style="width: 200px;" v-model="searchForm.code" placeholder="请输入产品代码" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input style="width: 200px;" v-model="searchForm.name" placeholder="请输入产品名称" clearable />
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
        <el-table-column prop="latestWorth" label="最新净值" width="120" />
        <el-table-column prop="totalAssets" label="总资产(亿元)" width="150" />
        <el-table-column prop="inceptionDate" label="成立日期" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="showProductDetail(row.id)">查看</el-button>
            <el-button size="small" type="primary" @click="editProduct(row.id)">编辑</el-button>
            <el-popconfirm title="确认删除这条记录吗?" @confirm="delProduct(row.id)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
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
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
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
              <el-descriptions-item label="最新净值">{{ currentProduct.latestWorth }}</el-descriptions-item>
              <el-descriptions-item label="总资产(亿元)">{{ currentProduct.totalAssets }}</el-descriptions-item>
              <el-descriptions-item label="成立日期">{{ currentProduct.inceptionDate }}</el-descriptions-item>
              <el-descriptions-item label="产品描述">{{ currentProduct.description }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="净值走势" name="netValue" lazy>
            <div style="margin-bottom: 20px;">
              <el-radio-group v-model="netValueRange" @change="fetchNetValueData">
                <el-radio-button label="1">近一周</el-radio-button>
                <el-radio-button label="2">近一月</el-radio-button>
                <el-radio-button label="3">近三月</el-radio-button>
              </el-radio-group>
            </div>
            <div style="height: 400px; width: 100%;">
              <el-empty v-if="netValueData.length === 0" description="暂无净值数据" />
              <div
                  v-else
                  ref="chartContainer"
                  style="width: 100%; height: 100%; min-height: 400px;"
              ></div>
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
import {ref, reactive, onMounted, nextTick, watch} from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import request from "@/utils/request.js";
import axios from "axios";

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

// 查询表单
const searchForm = reactive({
  code: '',
  name: '',
  type: null,
  riskLevel: null,
  status: null,
  shareType: null,
  company: '',
  currentPage: 1,
  pageSize: 10
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

// 净值走势相关数据
const netValueRange = ref('2')
// 默认显示"基本信息"标签页
const activeTab = ref('basic')
// 净值查询表单
const netWorthSearch = reactive({
  id: 1,
  timeType: 2
})

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
  latestWorth: [{ required: true, message: '请输入最新净值', trigger: 'blur' }],
  totalAssets: [{ required: true, message: '请输入总资产', trigger: 'blur' }],
  inceptionDate: [{ required: true, message: '请选择成立日期', trigger: 'change' }]
}

// 分页查询产品列表
const fetchProducts = ()=> {
  searchForm.pageSize = pagination.pageSize
  searchForm.currentPage = pagination.currentPage
  request.get("/product/page",{params:searchForm}).then((res) => {
    if (res.code === '200') {
      productList.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.msg||"查询失败")
    }
  })
}

// 查询产品详情
const fetchProductDetail = (id) => {
  try {
    currentProduct.value = productList.value.find(item => item.id === id)
  }
  catch (error) {
    ElMessage.error('获取产品详情失败')
    console.error(error)
  }
}

const showProductDetail = async (id) => {
  try {
    fetchProductDetail(id);
    detailDialogVisible.value = true;
    activeTab.value = 'basic';
    netValueRange.value = '2';

    // 等待对话框完全打开
    await nextTick();

    // 加载数据并渲染图表
    await fetchNetValueData();

    // 确保切换到净值走势tab时图表能正确显示
    watch(activeTab, (newTab) => {
      if (newTab === 'netValue') {
        nextTick(() => {
          if (chartInstance) {
            chartInstance.resize();
          } else {
            renderChart();
          }
        });
      }
    });
  } catch (err) {
    console.error("打开详情失败:", err);
  }
}

// 修改后的 renderChart 方法
// 渲染图表
const renderChart = () => {
  // 确保数据和容器都存在
  if (!chartContainer.value || !netValueData.value || netValueData.value.length === 0) {
    return;
  }

  nextTick(() => {
    try {
      // 销毁旧实例
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }

      // 初始化新实例
      chartInstance = echarts.init(chartContainer.value);

      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>净值: {c}'
        },
        xAxis: {
          type: 'category',
          data: netValueData.value.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}'
          }
        },
        series: [{
          data: netValueData.value.map(item => item.value),
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          }
        }],
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        }
      }

      chartInstance.setOption(option);

      // 添加响应式调整
      const resizeHandler = () => chartInstance.resize();
      window.addEventListener('resize', resizeHandler);

      // 立即执行一次resize确保正确显示
      setTimeout(resizeHandler, 50);
    } catch (err) {
      console.error("图表渲染失败:", err);
    }
  });
};

// 获取净值数据
const fetchNetValueData = async () => {
  if (!currentProduct.value) return;

  try {
    const res = await request.get("/product/netWorth", {
      params: {
        id: currentProduct.value.id,
        timeType: netValueRange.value
      }
    });

    if (res.code === '200') {
      netValueData.value = res.data;
      await nextTick();
      renderChart();
    } else {
      ElMessage.error(res.msg || "获取净值失败");
    }
  } catch (err) {
    console.error("净值数据请求失败:", err);
    ElMessage.error("获取净值数据失败");
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

const showAddDialog = () => {
  isEdit.value = false
  Object.keys(productForm).forEach(key => {
    productForm[key] = key === 'status' ? 1 : (['latestWorth', 'totalAssets'].includes(key) ? null : '')
  })
  editDialogVisible.value = true
}

const editProduct = async (id) => {
  isEdit.value = true
  const product = productList.value.find(item => item.id === id)
  Object.assign(productForm,{
    code: product.id,
    name: product.name,
    type: product.type,
    company: product.company,
    inceptionDate: product.inceptionDate,
    latestWorth: product.latestWorth,
    totalAssets: product.totalAssets,
    riskLevel: product.riskLevel,
    status: product.status,
    description: product.description
  })
  editDialogVisible.value = true
}

const delProduct = (id) => {
  console.log("我被点击了")
  console.log("/product/"+id)
  request.delete("/product/"+id).then((res) => {
    console.log("delProductRes:",res)
    if (res.code === "200") {
      ElMessage.success("删除成功")
    }else {
      ElMessage.error(res.msg||"删除失败")
    }
    handleSearch()
  })
}

// 新增产品
const submitProduct = () => {
  request.post("/product",productForm).then((res) => {
    if (res.code === '200') {
      ElMessage.success("操作成功")
      editDialogVisible.value = false;
    }
    else {
      ElMessage.error(res.msg||"提交失败")
    }
    //刷新
    fetchProducts()
  })
}

// 生命周期
onMounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
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