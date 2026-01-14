import request from './request'

/**
 * 获取历史记录列表
 * GET /api/records/
 */
export function getRecords() {
  return request.get('/records/')
}

/**
 * 获取某一条记录详情
 * GET /api/records/{id}/
 */
export function getRecordDetail(id: number) {
  return request.get(`/records/${id}/`)
}

/**
 * 删除单条记录
 * DELETE /api/records/{id}/delete/
 */
export function deleteRecord(id: number) {
  return request.delete(`/records/${id}/delete/`)
}

/**
 * 清空所有记录
 * DELETE /api/records/clear/
 */
export function clearRecords() {
  return request.delete('/records/clear/')
}
