import { useEffect, useMemo, useState } from 'react'
import { organizeVoiceNote, type RoutineItem } from './lib/voicePlanner'

type Theme = 'dark' | 'light'
type View = 'today' | 'archive'
type SpeechWindow = Window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }
type StoredAgenda = { active: RoutineItem[]; archived: RoutineItem[] }

const DATA_KEY = 'atlas-voice-agenda:v1'
const THEME_KEY = 'atlas-theme:v1'
const MAX_NOTE_LENGTH = 10_000
const MAX_ITEMS = 200
const MAX_TEXT_LENGTH = 500
const MAX_SOURCE_LENGTH = 1_000
const MAX_DURATION = 24 * 60
const MAX_STORAGE_CHARS = 512_000
const example = 'team sync at 9 for one hour, gym at 6pm for 45 minutes, and send the client proposal'

function loadAgenda(): StoredAgenda {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw && raw.length > MAX_STORAGE_CHARS) return { active: [], archived: [] }
    const saved = JSON.parse(raw ?? '{"active":[],"archived":[]}') as StoredAgenda | RoutineItem[]
    if (Array.isArray(saved)) return { active: safeItems(saved), archived: [] }
    if (!saved || typeof saved !== 'object') return { active: [], archived: [] }
    return { active: safeItems(saved.active), archived: safeItems(saved.archived) }
  } catch { return { active: [], archived: [] } }
}

function safeItems(value: unknown): RoutineItem[] { return Array.isArray(value) ? value.filter(isRoutineItem).slice(0, MAX_ITEMS) : [] }

function isRoutineItem(value: unknown): value is RoutineItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<RoutineItem>
  const validTime = item.start === null || (typeof item.start === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.start))
  return typeof item.id === 'string' && item.id.length > 0 && item.id.length <= MAX_TEXT_LENGTH && typeof item.title === 'string' && item.title.trim().length > 0 && item.title.length <= MAX_TEXT_LENGTH && validTime && typeof item.duration === 'number' && Number.isInteger(item.duration) && item.duration > 0 && item.duration <= MAX_DURATION && (item.kind === 'event' || item.kind === 'task') && typeof item.recurring === 'boolean' && typeof item.source === 'string' && item.source.length <= MAX_SOURCE_LENGTH
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark')
  const [view, setView] = useState<View>('today')
  const [note, setNote] = useState('')
  const [agenda, setAgenda] = useState<StoredAgenda>(loadAgenda)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('Speak naturally. Atlas will shape the day.')
  const scheduled = useMemo(() => agenda.active.filter((item) => item.start), [agenda.active])
  const tasks = useMemo(() => agenda.active.filter((item) => !item.start), [agenda.active])

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme) }, [theme])
  useEffect(() => { try { const serialized = JSON.stringify(agenda); if (serialized.length <= MAX_STORAGE_CHARS) localStorage.setItem(DATA_KEY, serialized); else setStatus('Your local agenda is full. Complete or clear a few items.') } catch { setStatus('This browser could not save your agenda.') } }, [agenda])

  const organize = (value = note) => {
    if (!value.trim()) return
    if (value.length > MAX_NOTE_LENGTH) { setStatus('That note is too long. Split it into two captures.'); return }
    const next = safeItems(organizeVoiceNote(value))
    setAgenda((current) => ({ ...current, active: next }))
    setView('today')
    setStatus(`${next.length} items understood. Your day is clear.`)
  }

  const listen = () => {
    const Speech = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition
    if (!Speech) { setStatus('Voice is not available here. Type your thought below.'); return }
    const recognition = new Speech()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    let failed = false
    recognition.onstart = () => { setListening(true); setStatus('Listening. Say everything on your mind.') }
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let index = 0; index < event.results.length && transcript.length < MAX_NOTE_LENGTH; index += 1) {
        const part = String(event.results[index][0].transcript)
        transcript += part.slice(0, MAX_NOTE_LENGTH - transcript.length)
      }
      setNote(transcript)
    }
    recognition.onerror = () => { failed = true; setStatus('I could not hear you. Try again or type your thought.') }
    recognition.onend = () => { setListening(false); if (!failed) setStatus('Review the transcript, then shape your day.') }
    recognition.start()
  }

  const clear = () => {
    if (!agenda.active.length || window.confirm('Clear all active items? Completed items will stay in your archive.')) {
      setAgenda((current) => ({ ...current, active: [] }))
      setNote('')
      setStatus('A blank day is ready for your voice.')
    }
  }

  const complete = (id: string) => {
    setAgenda((current) => {
      const item = current.active.find((entry) => entry.id === id)
      return item ? { active: current.active.filter((entry) => entry.id !== id), archived: [item, ...current.archived].slice(0, MAX_ITEMS) } : current
    })
    setStatus('Completed and moved to your archive.')
  }

  return <main className="voice-app">
    <aside className="rail">
      <div className="logo">Atlas<span>·</span></div>
      <nav aria-label="Atlas sections">
        <button className={view === 'today' ? 'rail-link selected' : 'rail-link'} onClick={() => setView('today')}><i>◌</i>Today</button>
        <button className={view === 'archive' ? 'rail-link selected' : 'rail-link'} onClick={() => setView('archive')}><i>□</i>Archive</button>
      </nav>
      <div className="rail-foot"><span className="secure-dot"/>On this device</div>
    </aside>
    <section className="voice-workspace">
      <header className="voice-header">
        <span>{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span>
        <div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme"><span>{theme === 'dark' ? '☾' : '☀'}</span><small>{theme === 'dark' ? 'Dark' : 'Light'}</small></button>
          <button className="quiet-action" onClick={clear}>Clear day</button>
        </div>
      </header>
      {view === 'today' ? <div className="voice-main">
        <section className="capture">
          <p className="eyebrow">Voice-first daily planning</p>
          <h1>Your day, <em>without the noise.</em></h1>
          <p className="lede">Say it the way it arrives in your head. Atlas turns the mess into a calm, usable timeline.</p>
          <div className={listening ? 'voice-orb listening' : 'voice-orb'}>
            <button onClick={listen} aria-label="Start speaking"><span className="mic">⌁</span><strong>{listening ? 'Listening' : 'Speak'}</strong></button>
            <div className="sound"><i/><i/><i/><i/><i/></div>
          </div>
          <p className="voice-status" aria-live="polite">{status}</p>
          <div className="note-box">
            <label className="sr-only" htmlFor="daily-note">Describe your day</label>
            <textarea id="daily-note" value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => setNote(event.target.value)} placeholder="Or write down an unfiltered thought…" />
            <div><button className="example-button" onClick={() => { setNote(example); organize(example) }}>Try an example</button><button className="organize-button" onClick={() => organize()}>Shape my day <span>→</span></button></div>
          </div>
        </section>
        <Timeline items={agenda.active} scheduled={scheduled} tasks={tasks} onComplete={complete} />
      </div> : <Archive items={agenda.archived} />}
      <footer><span>No account. No Atlas cloud. No prompts.</span><span>Atlas never records audio; transcript privacy depends on your browser.</span></footer>
    </section>
  </main>
}

function Timeline({ items, scheduled, tasks, onComplete }: { items: RoutineItem[]; scheduled: RoutineItem[]; tasks: RoutineItem[]; onComplete: (id: string) => void }) {
  return <section className="day-view"><div className="section-top"><div><p className="eyebrow">Your timeline</p><h2>{items.length ? 'The day, made clear.' : 'Your day is waiting.'}</h2></div>{items.length > 0 && <span className="count">{items.length} captured</span>}</div>{items.length === 0 ? <div className="empty"><span>◌</span><strong>Start with an unfiltered thought.</strong><p>“Team sync at 9, gym at 6pm, and send the client proposal.”</p></div> : <div className="timeline"><div className="timeline-label">Scheduled</div>{scheduled.map((item) => <AgendaRow item={item} key={item.id} onComplete={onComplete}/>)}{tasks.length > 0 && <><div className="timeline-label tasks-label">Loose ends</div>{tasks.map((item) => <AgendaRow item={item} key={item.id} onComplete={onComplete}/>)}</>}</div>}</section>
}

function Archive({ items }: { items: RoutineItem[] }) {
  return <section className="archive-view"><div className="section-top"><div><p className="eyebrow">Completed items</p><h2>What left your head.</h2></div><span className="count">{items.length} archived</span></div>{items.length ? <div className="timeline">{items.map((item) => <article className="agenda-row" key={item.id}><div className="time">✓</div><span className="timeline-dot"/><div className="agenda-copy"><strong>{item.title}</strong><small>Completed</small></div></article>)}</div> : <div className="empty"><span>□</span><strong>Nothing completed yet.</strong><p>Mark an item done and it will appear here.</p></div>}</section>
}

function AgendaRow({ item, onComplete }: { item: RoutineItem; onComplete: (id: string) => void }) {
  return <article className={item.kind === 'task' ? 'agenda-row task' : 'agenda-row'}><div className="time">{item.start ?? '—'}</div><span className="timeline-dot"/><div className="agenda-copy"><strong>{item.title}</strong><small>{item.recurring ? 'Recurring routine' : item.kind === 'task' ? 'No time assigned' : `${item.duration} min reserved`}</small></div><button className="row-action" onClick={() => onComplete(item.id)} aria-label={`Mark ${item.title} as complete`}>✓</button></article>
}

