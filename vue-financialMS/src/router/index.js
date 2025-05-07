import { createRouter, createWebHistory } from 'vue-router';
import Layout from '@/components/Layout.vue';
import Home from '@/views/Home.vue';
import Purchase from '@/views/Purchase.vue';
import Redeem from '@/views/Redeem.vue';
import UserManagement from '@/views/UserManagement.vue';
import Clearing from '@/views/Clearing.vue';
import BusinessQuery from '@/views/BusinessQuery.vue';
import Login from '@/views/Login.vue';
import Product from "@/views/Product.vue";
import {ElMessage} from "element-plus";

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      { path: '/', component: Home, meta: { title: '首页' } },
      { path: '/product', component: Product , meta: { title: '产品' } },
      { path: '/purchase', component: Purchase, meta: { title: '申购' } },
      { path: '/redeem', component: Redeem, meta: { title: '赎回' } },
      { path: '/user-management', component: UserManagement, meta: { title: '用户管理' } },
      { path: '/clearing', component: Clearing, meta: { title: '清算' } },
      { path: '/business-query', component: BusinessQuery, meta: { title: '业务查询' } },
    ],
  },
  { path: '/login', component: Login },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to ,from, next) => {
  if (to.path ==='/login') {
    next();
  }
  const user = localStorage.getItem("user");
  if (!user && to.path !== '/login' ){
    ElMessage.warning("未登录或登录状态过期")
    return next("/login");
  }
  next();
})

export default router;