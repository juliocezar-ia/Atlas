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
const MAX_TITLE_LENGTH = 500

const titleCase = (value: string) => value.trim().replace(/\s+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()).slice(0, MAX_TITLE_LENGTH)
const cleanTitle = (value: string) => titleCase(value
  .replace(/^(amanhã|hoje|depois|então|e|eu|preciso|tenho que|vou|toda segunda|tomorrow|today|then|and|i need to|need to|i have to|every monday)\s+/i, '')
  .replace(/^(?:às?|at)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s+/i, '')
  .replace(/^(faço|fazer|do|schedule|book)\s+/i, '')
  .replace(/\s+(?:às?|at)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?.*$/i, '')
  .replace(/\s+por\s+\w+.*$/i, '')
  )

function durationFrom(text: string) {
  const hours = text.match(/(?:por|for)\s+(\d+)\s*(?:hora|hour)/i)
  const minutes = text.match(/(?:por|for)\s+(\d+)\s*(?:minuto|minute)/i)
  if (hours) return Number(hours[1]) * 60
  if (minutes) return Number(minutes[1])
  return 60
}

function timeFrom(text: string) {
  const match = text.match(/(?:às?|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!match) return null
  let hour = Number(match[1])
  if (match[3]?.toLowerCase() === 'pm' && hour < 12) hour += 12
  if (match[3]?.toLowerCase() === 'am' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${match[2] ?? '00'}`
}

export function organizeVoiceNote(note: string): RoutineItem[] {
  const normalized = note.slice(0, MAX_NOTE_LENGTH).replace(/[.!?]/g, ',').replace(/\s+(?:e|depois|então|and|then)\s+/gi, ',')
  const parts = normalized.split(',').map((part) => part.trim().slice(0, MAX_SOURCE_LENGTH)).filter(Boolean).slice(0, MAX_ITEMS)
  const items: RoutineItem[] = []

  parts.forEach((part, index) => {
    const lower = part.toLowerCase()
    const recurring = /(?:toda\s+(segunda|terça|quarta|quinta|sexta|sábado|domingo)|every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i.test(part)
    const start = timeFrom(part)
    const title = cleanTitle(part)
    if (!title) return
    const isTask = /^(preciso|tenho que|i need to|need to|i have to)/i.test(part)
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

