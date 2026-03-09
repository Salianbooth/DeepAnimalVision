import axios from 'axios'

export const API_ORIGIN = `http://${window.location.hostname}:8000`

const request = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 10000,
  withCredentials: true,
})

request.interceptors.request.use(
  config => config,
  error => Promise.reject(error),
)

request.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  },
)

export default request
