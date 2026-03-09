<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">DeepAnimalVision</p>
          <h1>动物图像识别系统</h1>
          <p class="hero-text">
            上传图像，查看目标检测结果，并按用户追踪自己的识别历史。
          </p>
        </div>

        <div class="hero-image">
          <img src="../../assets/images/illustration.png" alt="Animal recognition" />
        </div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <div class="login-header">
            <h2>登录</h2>
            <p>进入你的识别工作台</p>
          </div>

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
      </section>
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
.login-page {
  min-height: 100vh;
  padding: clamp(16px, 4vw, 40px);
  background:
    radial-gradient(circle at top left, rgba(115, 169, 173, 0.24), transparent 35%),
    radial-gradient(circle at bottom right, rgba(230, 181, 115, 0.2), transparent 30%),
    linear-gradient(135deg, #f4f7fb 0%, #eef5ee 100%);
}

.login-shell {
  min-height: calc(100vh - clamp(32px, 8vw, 80px));
  display: grid;
  grid-template-columns: minmax(320px, 1.2fr) minmax(320px, 0.8fr);
  gap: clamp(16px, 3vw, 32px);
  align-items: stretch;
}

.hero-panel,
.login-panel {
  min-height: 0;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(24px, 4vw, 48px);
  border-radius: 28px;
  background: linear-gradient(160deg, #173d3f 0%, #295f62 48%, #6f9d8d 100%);
  color: #f8fafc;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(23, 61, 63, 0.18);
}

.hero-copy {
  max-width: 520px;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 13px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.7);
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(36px, 5vw, 64px);
  line-height: 1.02;
  font-weight: 800;
}

.hero-text {
  margin: 20px 0 0;
  max-width: 460px;
  font-size: clamp(15px, 1.5vw, 18px);
  line-height: 1.8;
  color: rgba(248, 250, 252, 0.86);
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  padding-top: 24px;
}

.hero-image img {
  width: min(100%, 540px);
  max-height: min(46vh, 520px);
  object-fit: contain;
  border-radius: 24px;
  filter: drop-shadow(0 20px 40px rgba(12, 29, 31, 0.24));
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: min(100%, 460px);
  padding: clamp(24px, 4vw, 38px);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(12px);
}

.login-header {
  margin-bottom: 28px;
  text-align: left;
}

.login-header h2 {
  margin: 0;
  font-size: clamp(28px, 2.4vw, 36px);
  color: #14232c;
}

.login-header p {
  margin: 8px 0 0;
  color: #5b6b75;
  font-size: 15px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #31424d;
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #d6dde4;
  border-radius: 14px;
  background: #f9fbfc;
  color: #12202a;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #2f7f70;
  box-shadow: 0 0 0 4px rgba(47, 127, 112, 0.12);
  background: #ffffff;
}

.error-message {
  margin: -6px 0 0;
  color: #c2410c;
  text-align: left;
  font-size: 14px;
}

.login-button {
  width: 100%;
  margin-top: 4px;
  padding: 14px 18px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #2c7a6c 0%, #3a9b85 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 24px rgba(58, 155, 133, 0.22);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    min-height: 320px;
  }

  .hero-image img {
    max-height: 280px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 12px;
  }

  .login-shell {
    min-height: calc(100vh - 24px);
    gap: 12px;
  }

  .hero-panel {
    padding: 22px 18px;
    border-radius: 22px;
  }

  .login-card {
    padding: 22px 18px;
    border-radius: 22px;
  }

  .hero-text {
    margin-top: 14px;
  }
}
</style>
