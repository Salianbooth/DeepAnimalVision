<template>
  <div class="login-container">
    <div class="illustration">
      <img src="../../assets/images/illustration.png" alt="Illustration" style="border-radius: 50px;" />
    </div>

    <div class="login-box">
      <h2>动物图像识别系统登录</h2>

      <form @submit.prevent="handleLogin" class="form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            type="text"
            v-model="username"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            type="password"
            v-model="password"
            placeholder="请输入密码"
          />
        </div>

        <button type="submit" class="login-button">登录</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const username = ref("");
const password = ref("");

// 最简单的本地登录逻辑（写死）
const handleLogin = () => {
  if (username.value === "admin" && password.value === "123456") {
    alert("登录成功");
    router.push("/user"); // 跳转到 Home.vue
  } else {
    alert("用户名或密码错误");
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  max-width: 1300px;
  margin: 100px auto;
  padding: 20px;
  border-radius: 10px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.illustration {
  flex: 1;
  text-align: center;
}

.illustration img {
  max-width: 80%;
  height: auto;
}

.login-box {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 30px 20px;
  max-width: 400px;
  margin: auto;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
