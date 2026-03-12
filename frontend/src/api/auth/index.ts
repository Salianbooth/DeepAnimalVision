import request from '@/api/request'

export interface AuthPayload {
  username: string
  password: string
}

export const login = (payload: AuthPayload) => request.post('/login/', payload)

export const register = (payload: AuthPayload) => request.post('/register/', payload)
