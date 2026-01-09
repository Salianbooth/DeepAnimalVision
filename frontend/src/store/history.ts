import { defineStore } from 'pinia'

export interface Detection {
  class_id: number
  class_name: string
  confidence: number
  bbox: number[]
}

export interface HistoryItem {
  id: string
  imageUrl: string
  time: string
  detections: Detection[]
}

const STORAGE_KEY = 'detect_history'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    historyList: [] as HistoryItem[],
    current: null as HistoryItem | null
  }),

  actions: {
    load() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        this.historyList = JSON.parse(raw)
      }
    },

    save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.historyList))
    },

    add(item: HistoryItem) {
      this.historyList.unshift(item)
      this.current = item
      this.save()
    },

    select(item: HistoryItem) {
      this.current = item
    }
  }
})
