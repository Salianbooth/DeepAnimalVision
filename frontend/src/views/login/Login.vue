<template>
  <div class="login-page">
    <div class="bg-layer"></div>

    <!-- 左侧文字区 -->
    <div class="hero-text">
      <h1 class="hero-title">动物图像识别与分类系统</h1>
      <div class="hero-divider"></div>
      <p class="hero-sub">智能识别动物图像 &nbsp;探索自然多样之美</p>
    </div>

    <div class="login-card">
      <div class="card-header">
        <div class="icon-wrap">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="24" cy="18" r="9" fill="white" opacity="0.9"/>
            <ellipse cx="24" cy="38" rx="13" ry="8" fill="white" opacity="0.9"/>
            <circle cx="19" cy="15" r="2" fill="#2d7a6a"/>
            <circle cx="29" cy="15" r="2" fill="#2d7a6a"/>
            <path d="M20 21 Q24 24 28 21" stroke="#2d7a6a" stroke-width="1.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
        <h2 class="title-zh">用户登录</h2>
        <p class="title-en">USER LOGIN</p>
      </div>

      <form class="form" @submit.prevent="handleLogin">
        <div class="input-wrap">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username"
          />
        </div>

        <div class="input-wrap">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </span>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
          />
        </div>

        <p v-if="successMessage" class="msg msg--success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="msg msg--error">{{ errorMessage }}</p>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="card-footer">
        还没有账号？
        <RouterLink to="/register">去注册</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { login } from '@/api/auth'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = '用户名和密码不能为空'
    return
  }

  loading.value = true

  try {
    const response = await login({
      username: username.value,
      password: password.value,
    })

    const user = response.data?.user
    if (!user) {
      errorMessage.value = '登录响应无效'
      return
    }

    localStorage.setItem('user', JSON.stringify(user))
    router.push(user.role === 'admin' ? '/admin' : '/user/recognition')
  } catch (error: any) {
    errorMessage.value =
      error?.response?.data?.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.registered === '1' && typeof route.query.username === 'string') {
    username.value = route.query.username
    successMessage.value = '注册成功，请输入密码登录'
  }
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(40px, 7vw, 110px);
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background-image: url('../../assets/images/Login.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

/* ── 左侧文字区：轻毛玻璃底，整体上移 ── */
.hero-text {
  position: relative;
  z-index: 1;
  flex: 1;
  max-width: 480px;
  margin-right: 48px;
  margin-bottom: 80px;
  padding: 28px 32px 28px clamp(60px, 12vw, 180px);
}

.hero-title {
  margin: 0;
  font-size: clamp(38px, 5.2vw, 62px);
  font-weight: 900;
  line-height: 1.18;
  color: #163829;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 12px rgba(255,255,255,0.55);
}

.hero-divider {
  width: 52px;
  height: 4px;
  background: #3a8055;
  border-radius: 2px;
  margin: 22px 0 16px;
}

.hero-sub {
  margin: 0;
  font-size: clamp(14px, 1.4vw, 16px);
  color: #2e5040;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 8px rgba(255,255,255,0.5);
}

/* ── Card：更大，更靠右 ── */
.login-card {
  position: relative;
  z-index: 1;
  width: min(460px, 92vw);
  flex-shrink: 0;
  padding: 52px 44px 40px;
  border-radius: 24px;
  background: rgba(248, 251, 248, 0.88);
  box-shadow:
    0 8px 32px rgba(15, 30, 28, 0.12),
    0 32px 80px rgba(15, 30, 28, 0.16);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* ── Header ── */
.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
}

.icon-wrap {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  background: linear-gradient(145deg, #2d7a6a, #45b89a);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 22px rgba(45, 122, 106, 0.35);
  margin-bottom: 14px;
}

.icon-wrap svg {
  width: 38px;
  height: 38px;
}

.title-zh {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #14232c;
  letter-spacing: 0.04em;
}

.title-en {
  margin: 5px 0 0;
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 0.22em;
  color: #9baab3;
  text-transform: uppercase;
}

/* ── Form ── */
.form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input-wrap {
  position: relative;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #a8b8c2;
  pointer-events: none;
}

.input-icon svg {
  width: 18px;
  height: 18px;
}

.input-wrap input {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 16px 13px 42px;
  border: 1.5px solid #dce5ea;
  border-radius: 14px;
  background: #f5f8fa;
  color: #12202a;
  font-size: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

.input-wrap input::placeholder {
  color: #b4c2cb;
}

.input-wrap input:focus {
  outline: none;
  border-color: #2d7a6a;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(45, 122, 106, 0.11);
}

/* ── Messages ── */
.msg {
  margin: -4px 0 0;
  font-size: 13px;
  text-align: left;
}

.msg--success { color: #15803d; }
.msg--error   { color: #c2410c; }

/* ── Button ── */
.login-btn {
  width: 100%;
  margin-top: 6px;
  padding: 15px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #2c7a6c 0%, #3aab8e 100%);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(45, 122, 106, 0.28);
  transition:
    transform 0.18s,
    box-shadow 0.18s,
    opacity 0.18s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(45, 122, 106, 0.34);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ── Footer ── */
.card-footer {
  margin: 20px 0 0;
  font-size: 13px;
  color: #7a8e98;
}

.card-footer a {
  color: #2c7a6c;
  font-weight: 700;
  text-decoration: none;
}

.card-footer a:hover {
  text-decoration: underline;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .login-page {
    justify-content: center;
    padding: 16px;
  }

  .hero-text {
    display: none;
  }

  .login-card {
    width: 100%;
    padding: 36px 24px 28px;
  }
}
</style>
