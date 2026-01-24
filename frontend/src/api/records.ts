import request from './request'

/**
 * 获取历史记录列表
 */
export const getRecords = async () => {
  try {
    const res = await request.get('/records/')
    return {
      data: {
        records: Array.isArray(res.data.records) ? res.data.records : []
      }
    }
  } catch (err) {
    console.error('API getRecords failed', err)
    return { data: { records: [] } }
  }
}

/**
 * 获取某条记录详情
 */
export async function getRecordDetail(id: number) {
  try {
    const res = await request.get(`/records/${id}/`)
    return res
  } catch (err) {
    console.error(`API getRecordDetail(${id}) failed`, err)
    throw err
  }
}

/**
 * 删除单条记录
 */
export async function deleteRecord(id: number) {
  try {
    const res = await request.delete(`/records/${id}/delete/`)
    return res
  } catch (err) {
    console.error(`API deleteRecord(${id}) failed`, err)
    throw err
  }
}

/**
 * 清空所有记录
 */
export async function clearRecords() {
  try {
    const res = await request.delete('/records/clear/')
    return res
  } catch (err) {
    console.error('API clearRecords failed', err)
    throw err
  }
}
