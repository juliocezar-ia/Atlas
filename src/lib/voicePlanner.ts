export type RoutineItem = {
  id: string
  title: string
  start: string | null
  duration: number
  kind: 'event' | 'task'
  recurring: boolean
  source: string
}

const MAX_NOTE_LENGTH = 10_000
const MAX_ITEMS = 200
const MAX_SOURCE_LENGTH = 1_000

const titleCase = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
const cleanTitle = (value: string) => titleCase(value
  .replace(/^(amanhã|hoje|depois|então|e|eu|preciso|tenho que|vou|toda segunda)\s+/i, '')
  .replace(/^às?\s+\d{1,2}(?::\d{2})?\s+/i, '')
  .replace(/^(faço|fazer)\s+/i, '')
  .replace(/\s+às?\s+\d{1,2}(?::\d{2})?.*$/i, '')
  .replace(/\s+por\s+\w+.*$/i, '')
  )

function durationFrom(text: string) {
  const hours = text.match(/por\s+(\d+)\s*hora/i)
  const minutes = text.match(/por\s+(\d+)\s*minuto/i)
  if (hours) return Number(hours[1]) * 60
  if (minutes) return Number(minutes[1])
  return 60
}

function timeFrom(text: string) {
  const match = text.match(/às?\s+(\d{1,2})(?::(\d{2}))?/i)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2] ?? '00'}`
}

export function organizeVoiceNote(note: string): RoutineItem[] {
  const normalized = note.slice(0, MAX_NOTE_LENGTH).replace(/[.!?]/g, ',').replace(/\s+(?:e|depois|então)\s+/gi, ',')
  const parts = normalized.split(',').map((part) => part.trim().slice(0, MAX_SOURCE_LENGTH)).filter(Boolean).slice(0, MAX_ITEMS)
  const items: RoutineItem[] = []

  parts.forEach((part, index) => {
    const lower = part.toLowerCase()
    const recurring = /toda\s+(segunda|terça|quarta|quinta|sexta|sábado|domingo)/i.test(part)
    const start = timeFrom(part)
    const title = cleanTitle(part)
    if (!title) return
    const isTask = /^(preciso|tenho que)/i.test(part)
    items.push({
      id: `${index}-${title.toLowerCase().replace(/[^a-zà-ú0-9]+/gi, '-')}`,
      title,
      start: isTask && !start ? null : start,
      duration: durationFrom(part),
      kind: start ? 'event' : 'task',
      recurring,
      source: part,
    })
  })

  return items.sort((a, b) => (a.start ?? '99:99').localeCompare(b.start ?? '99:99'))
}

