<template>
  <div class="login">
    <div style="width: 400px; height: 380px; margin: 150px auto; background-color:rgb(255,255,255); border-radius: 10px">
      <div style="width: 100%; height: 100px; font-size: 30px; line-height: 100px; text-align: center; color: #000">欢迎登录</div>
      <div style="margin-top: 15px; text-align: center; height: 320px;">
        <el-form :model="admin">
          <el-form-item>
            <el-input v-model="admin.name" prefix-icon="User" style="width: 80%;height: 50px;margin-left: 10%" placeholder="请输入用户名"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="admin.password" show-password prefix-icon="lock" style="width: 80%;height: 50px;margin-left: 10%" placeholder="请输入密码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button style="width: 80%;height: 50px; margin-top: 10px;margin-left: 10%" type="primary" @click="login(admin)">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import {getCurrentInstance, reactive} from "vue";
import router from "@/router/index.js";
import {ElMessage} from "element-plus";
import request from "@/utils/request.js";


const admin=reactive({name:"admin",password:"123456"})

const login = (admin) => {
  request.post("/user",admin).then(res => {
    if (res.code === '200') {
      ElMessage.success("登录成功")
      localStorage.setItem("user",JSON.stringify(res.data))
      router.push({path:"/"});
    } else {
      ElMessage.error("用户名或密码错误！")
    }
  })
}
</script>

<style scoped>

.login {
  height: 100vh;
  overflow: hidden;
  background-image: url("@/assets/img/img.png");
  background-size: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

</style>