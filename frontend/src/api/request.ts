import axios from 'axios'

const request = axios.create({
  baseURL: '/api',     // 关键：对应 Django 的 /api/
  timeout: 10000
})

/**
 * 请求拦截器
 */
request.interceptors.request.use(
  config => {
    // 如果后面有 token / 登录，这里统一加
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
request.interceptors.response.use(
  response => {
    // Django 默认 JsonResponse → response.data
    return response
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default request
