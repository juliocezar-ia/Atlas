import { describe, expect, it } from 'vitest'
import { organizeVoiceNote } from './voicePlanner'

describe('organizeVoiceNote', () => {
  it('turns a spoken day dump into ordered agenda items', () => {
    const items = organizeVoiceNote('amanhã às 9 reunião com a Júlia por uma hora, depois academia às 18 por 45 minutos e preciso enviar a proposta')

    expect(items).toHaveLength(3)
    expect(items[0]).toMatchObject({ title: 'Reunião com a Júlia', start: '09:00', duration: 60, kind: 'event' })
    expect(items[1]).toMatchObject({ title: 'Academia', start: '18:00', duration: 45, kind: 'event' })
    expect(items[2]).toMatchObject({ title: 'Enviar a proposta', kind: 'task' })
  })

  it('recognizes recurring routines and preserves unplanned tasks', () => {
    const items = organizeVoiceNote('toda segunda faço inglês às 7 e preciso comprar café')

    expect(items[0]).toMatchObject({ title: 'Inglês', start: '07:00', recurring: true })
    expect(items[1]).toMatchObject({ title: 'Comprar café', kind: 'task' })
  })

  it('keeps the user’s words when a sentence has no time signal', () => {
    const items = organizeVoiceNote('preciso revisar o portfólio antes de sexta')

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ title: 'Revisar o portfólio antes de sexta', kind: 'task', start: null })
  })

  it('bounds oversized captures before they become agenda state', () => {
    const note = Array.from({ length: 300 }, (_, index) => `tarefa ${index}`).join(', ')
    const items = organizeVoiceNote(note)
    expect(items).toHaveLength(200)
    expect(items.every((item) => item.source.length <= 1000)).toBe(true)
  })
})

