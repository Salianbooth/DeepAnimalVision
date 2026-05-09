import { defineStore } from 'pinia'
import {
  getRecords,
  getRecordDetail,
  deleteRecord,
  clearRecords,
  getRecordStats,
} from '@/api/records'
import { mapDetections, mapLabelStats } from '@/utils/classMapper'

/**
 * 单个检测结果
 * 与后端 record_detail 返回结构保持一致
 */
export interface Detection {
  class_id: number
  label: string
  confidence: number
  bbox: number[]
}

/**
 * 历史记录项
 */
export interface HistoryItem {
  id: number
  image: string
  time: string
  count?: number        // 列表接口返回的
}

export interface RecordDetail extends HistoryItem {
  image_width: number
  image_height: number
  detections: Detection[]
}

export interface LabelStat {
  label: string
  count: number
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    historyList: [] as HistoryItem[],
    current: null as RecordDetail | null,
    loading: false,
    globalLabelStats: [] as LabelStat[],
  }),

  actions: {
    /**
     * 从后端加载历史记录列表
     * GET /api/records/
     */
    async fetchHistoryList() {
      this.loading = true
      try {
        const res = await getRecords()
        // 双重兜底：API 层已经返回 records 数组，但再保险一下
        this.historyList = Array.isArray(res.data.records) ? res.data.records : []
      } catch (e) {
        console.error('fetchHistoryList failed', e)
        this.historyList = []
      } finally {
        this.loading = false
      }
    }

    ,

    /**
     * 获取某条记录详情，并设为当前记录
     * GET /api/records/{id}/
     */
    async fetchRecordDetail(id: number) {
      const res = await getRecordDetail(id)
      const detail: RecordDetail = {
        ...res.data,
        detections: mapDetections(res.data.detections ?? []),
      }
      this.current = detail
      return detail
    },

    /**
     * 删除单条记录
     */
    async removeRecord(id: number) {
      await deleteRecord(id)

      // 本地同步删除
      this.historyList = this.historyList.filter(r => r.id !== id)

      if (this.current?.id === id) {
        this.current = null
      }
    },

    /**
     * 清空所有记录
     */
    async clearAll() {
      await clearRecords()
      this.historyList = []
      this.current = null
      this.globalLabelStats = []
    },

    /**
     * 获取当前用户跨所有记录的标签聚合统计
     */
    async fetchStats() {
      this.globalLabelStats = mapLabelStats(await getRecordStats())
    },

    /**
     * 仅用于切换当前记录（不请求接口）
     */
    // select(item: HistoryItem) {
    //   this.current = item
    // }
  }
})
