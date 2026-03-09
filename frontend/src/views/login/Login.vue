<template>
  <div class="login-container">
    <div class="illustration">
      <img src="../../assets/images/illustration.png" alt="Illustration" />
    </div>

    <div class="login-box">
      <h2>动物图像识别系统登录</h2>

      <form class="form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            placeholder="请输入用户名"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import request from '@/api/request'

const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = '用户名和密码不能为空'
    return
  }

  loading.value = true

  try {
    const response = await request.post('/login/', {
      username: username.value,
      password: password.value,
    })

    const user = response.data?.user
    if (!user) {
      errorMessage.value = '登录响应无效'
      return
    }

    localStorage.setItem('user', JSON.stringify(user))
    router.push(user.role === 'admin' ? '/admin' : '/user')
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
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
  border-radius: 50px;
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

.error-message {
  margin: 0 0 12px;
  color: #d14343;
  text-align: left;
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

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
