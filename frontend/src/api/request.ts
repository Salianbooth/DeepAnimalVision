import axios, { AxiosRequestConfig } from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // 指向 Django 后端
  timeout: 10000,
})

// 请求拦截器（可加 token 等）
request.interceptors.request.use(
  config => {
    // config.headers['Authorization'] = 'Bearer ...' // 如有需要
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default request
