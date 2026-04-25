const palette = [
  '#F43F5E',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
]

export const CLASS_COLOR_MAP = Array.from({ length: 80 }).reduce<Record<number, string>>(
  (map, _, index) => {
    map[index] = palette[index % palette.length] || '#8B5CF6'
    return map
  },
  {},
)
