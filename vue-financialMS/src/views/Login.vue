<template>
  <div>
    <h1>管理员登录</h1>
    <form @submit.prevent="login">
      <input type="text" placeholder="用户名" v-model="username" />
      <input type="password" placeholder="密码" v-model="password" />
      <button type="submit">登录</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
    };
  },
  methods: {
    login() {
      // 模拟登录逻辑
      if (this.username === 'admin' && this.password === 'admin') {
        this.$router.push('/');
      } else {
        alert('用户名或密码错误');
      }
    },
  },
};
</script>