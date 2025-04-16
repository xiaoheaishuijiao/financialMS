<template>
  <el-container class="layout-container">
    <!-- 顶部栏 -->
    <el-header class="header">
      <div class="header-left">
        <div class="logo">基金理财系统</div>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item v-if="$route.path !== '/'">
            {{ currentBreadcrumb }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="user-info">
        <el-dropdown>
          <span class="el-dropdown-link">
            <el-icon><User /></el-icon>
            管理员
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>


    <!-- 右侧内容区域 -->
    <el-container>
      <!-- 左侧导航栏 -->
      <el-aside width="200px">
        <el-menu
            :default-active="$route.path"
            class="el-menu-vertical-demo"
            @select="handleMenuSelect"
            router
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/product">
            <el-icon><Goods /></el-icon>
            <span>产品</span>
          </el-menu-item>
          <el-menu-item index="/purchase">
            <el-icon><ShoppingCart /></el-icon>
            <span>申购</span>
          </el-menu-item>
          <el-menu-item index="/redeem">
            <el-icon><Sell /></el-icon>
            <span>赎回</span>
          </el-menu-item>
          <el-menu-item index="/user-management">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/clearing">
            <el-icon><Money /></el-icon>
            <span>清算</span>
          </el-menu-item>
          <el-menu-item index="/business-query">
            <el-icon><Search /></el-icon>
            <span>业务查询</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import {computed, ref} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {
  HomeFilled,
  ShoppingCart,
  Sell,
  User,
  Money,
  Search, ShoppingCartFull, Goods,
} from '@element-plus/icons-vue';
import {ElMessage} from "element-plus";

const router = useRouter();
const route = useRoute();

// 动态计算面包屑显示内容
const currentBreadcrumb = computed(() => {
  const matchedRoute = route.matched.find((r) => r.path === route.path);
  return matchedRoute ? matchedRoute.meta.title || matchedRoute.name : '';
});

// 处理菜单选择
const handleMenuSelect = (index) => {
  console.log('Selected menu:', index);
};

// 退出登录
const logout = () => {
  ElMessage.success("退出成功")
  router.push('/login');
};
</script>


<style scoped>
.layout-container {
  height: 100vh;
}

/* 左侧区域（logo + 面包屑） */
.header-left {
  display: flex;
  align-items: center;
  gap: 30px; /* logo 和面包屑之间的间距 */
}

.logo {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 7px;
  margin-left: 10px;
  color: white;
}

/* 左侧导航栏样式 */
.el-aside {
  background-color: #304156; /* 侧边栏背景色 */
}

.el-menu {
  border-right: none;
  background-color: #304156; /* 菜单背景色 */
}

.el-menu-item {
  color: #bfcbd9; /* 默认文字颜色 */
  background-color: #304156; /* 默认背景色 */
}

.el-menu-item:hover {
  background-color: #263445; /* 鼠标悬浮时背景色 */
}

.el-menu-item.is-active {
  background-color: #708090	; /* 选中时背景色 */
  color: #fff; /* 选中时文字颜色 */
}

/* 顶部栏样式 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #384259; /* 顶部栏背景色 */
  border-bottom: 1px solid #263445; /* 顶部栏底部边框 */
  padding: 0 20px;
}

.el-breadcrumb {
  color: #bfcbd9; /* 面包屑文字颜色 */
}

.el-breadcrumb :deep(.el-breadcrumb__inner) {
  color: #bfcbd9; /* 面包屑内部文字颜色 */
}

.el-breadcrumb :deep(.el-breadcrumb__inner:hover) {
  color: #fff; /* 面包屑鼠标悬浮时文字颜色 */
}

/* 用户信息区域样式 */
.user-info {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #bfcbd9; /* 管理员文字颜色 */
}

.el-dropdown-link:hover {
  color: #fff; /* 鼠标悬浮时文字颜色 */
}

.el-dropdown-link .el-icon {
  margin-right: 5px;
}

/* 去掉下拉菜单的边框 */
.el-dropdown-menu {
  border: none;
  background-color: #fff; /* 下拉菜单背景色 */
}

.el-dropdown-menu__item {
  color: #bfcbd9; /* 下拉菜单文字颜色 */
}

.el-dropdown-menu__item:hover {
  background-color: #fff; /* 下拉菜单鼠标悬浮时背景色 */
  color: #fff; /* 下拉菜单鼠标悬浮时文字颜色 */
}

/* 主内容区域样式 */
.el-main {
  background-color: #f0f2f5; /* 主内容区域背景色 */
  padding: 20px;
}
</style>