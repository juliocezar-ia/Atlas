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
const example = 'reunião com a Júlia às 9 por uma hora, depois academia às 18 por 45 minutos e preciso enviar a proposta'

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

function safeItems(value: unknown): RoutineItem[] { return Array.isArray(value) ? value.slice(0, MAX_ITEMS).filter(isRoutineItem) : [] }

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
  const [status, setStatus] = useState('Fale naturalmente. O Atlas organiza sua agenda.')
  const scheduled = useMemo(() => agenda.active.filter((item) => item.start), [agenda.active])
  const tasks = useMemo(() => agenda.active.filter((item) => !item.start), [agenda.active])

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem(THEME_KEY, theme) }, [theme])
  useEffect(() => { try { const serialized = JSON.stringify(agenda); if (serialized.length <= MAX_STORAGE_CHARS) localStorage.setItem(DATA_KEY, serialized); else setStatus('A agenda atingiu o limite local. Conclua ou limpe alguns itens.') } catch { setStatus('Não foi possível salvar a agenda neste navegador.') } }, [agenda])

  const organize = (value = note) => {
    if (!value.trim()) return
    if (value.length > MAX_NOTE_LENGTH) { setStatus('Sua anotação é longa demais. Divida-a em duas capturas.'); return }
    const next = organizeVoiceNote(value).slice(0, MAX_ITEMS)
    setAgenda((current) => ({ ...current, active: next }))
    setView('today')
    setStatus(`${next.length} itens entendidos. Sua agenda ficou clara.`)
  }

  const listen = () => {
    const Speech = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition
    if (!Speech) { setStatus('Voz não está disponível neste navegador. Digite sua ideia abaixo.'); return }
    const recognition = new Speech()
    recognition.lang = 'pt-BR'
    recognition.interimResults = true
    let failed = false
    recognition.onstart = () => { setListening(true); setStatus('Ouvindo. Diga tudo que está na sua cabeça.') }
    recognition.onresult = (event: any) => setNote(Array.from(event.results).map((result: any) => result[0].transcript).join('').slice(0, MAX_NOTE_LENGTH))
    recognition.onerror = () => { failed = true; setStatus('Não foi possível ouvir você. Tente de novo ou digite sua ideia.') }
    recognition.onend = () => { setListening(false); if (!failed) setStatus('Revise a transcrição e organize seu dia.') }
    recognition.start()
  }

  const clear = () => {
    if (!agenda.active.length || window.confirm('Limpar todos os itens ativos da agenda? Os concluídos continuarão no arquivo.')) {
      setAgenda((current) => ({ ...current, active: [] }))
      setNote('')
      setStatus('Um dia em branco está pronto para sua voz.')
    }
  }

  const complete = (id: string) => {
    setAgenda((current) => {
      const item = current.active.find((entry) => entry.id === id)
      return item ? { active: current.active.filter((entry) => entry.id !== id), archived: [item, ...current.archived].slice(0, MAX_ITEMS) } : current
    })
    setStatus('Concluído e guardado no arquivo.')
  }

  return <main className="voice-app">
    <aside className="rail">
      <div className="logo">Atlas<span>·</span></div>
      <nav aria-label="Seções do Atlas">
        <button className={view === 'today' ? 'rail-link selected' : 'rail-link'} onClick={() => setView('today')}><i>◌</i>Hoje</button>
        <button className={view === 'archive' ? 'rail-link selected' : 'rail-link'} onClick={() => setView('archive')}><i>□</i>Arquivo</button>
      </nav>
      <div className="rail-foot"><span className="secure-dot"/>Neste dispositivo</div>
    </aside>
    <section className="voice-workspace">
      <header className="voice-header">
        <span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</span>
        <div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema"><span>{theme === 'dark' ? '☾' : '☀'}</span><small>{theme === 'dark' ? 'Escuro' : 'Claro'}</small></button>
          <button className="quiet-action" onClick={clear}>Limpar dia</button>
        </div>
      </header>
      {view === 'today' ? <div className="voice-main">
        <section className="capture">
          <p className="eyebrow">Organizador diário por voz</p>
          <h1>Seu dia, <em>sem burocracia.</em></h1>
          <p className="lede">Fale como você se lembra. O Atlas separa eventos, rotinas e pendências em uma linha do tempo prática.</p>
          <div className={listening ? 'voice-orb listening' : 'voice-orb'}>
            <button onClick={listen} aria-label="Começar a falar"><span className="mic">⌁</span><strong>{listening ? 'Ouvindo' : 'Falar'}</strong></button>
            <div className="sound"><i/><i/><i/><i/><i/></div>
          </div>
          <p className="voice-status" aria-live="polite">{status}</p>
          <div className="note-box">
            <label className="sr-only" htmlFor="daily-note">Conte como está seu dia</label>
            <textarea id="daily-note" value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => setNote(event.target.value)} placeholder="Ou escreva uma ideia ainda desorganizada…" />
            <div><button className="example-button" onClick={() => { setNote(example); organize(example) }}>Ver exemplo</button><button className="organize-button" onClick={() => organize()}>Organizar meu dia <span>→</span></button></div>
          </div>
        </section>
        <Timeline items={agenda.active} scheduled={scheduled} tasks={tasks} onComplete={complete} />
      </div> : <Archive items={agenda.archived} />}
      <footer><span>Sem conta. Sem nuvem Atlas. Sem prompts.</span><span>O Atlas não grava áudio; a privacidade da transcrição depende do navegador.</span></footer>
    </section>
  </main>
}

function Timeline({ items, scheduled, tasks, onComplete }: { items: RoutineItem[]; scheduled: RoutineItem[]; tasks: RoutineItem[]; onComplete: (id: string) => void }) {
  return <section className="day-view"><div className="section-top"><div><p className="eyebrow">Sua linha do tempo</p><h2>{items.length ? 'Seu dia, agora claro.' : 'Seu dia está esperando.'}</h2></div>{items.length > 0 && <span className="count">{items.length} capturados</span>}</div>{items.length === 0 ? <div className="empty"><span>◌</span><strong>Comece com uma ideia desorganizada.</strong><p>“Tenho uma reunião às 9, academia às 18 e preciso enviar a proposta.”</p></div> : <div className="timeline"><div className="timeline-label">Com horário</div>{scheduled.map((item) => <AgendaRow item={item} key={item.id} onComplete={onComplete}/>)}{tasks.length > 0 && <><div className="timeline-label tasks-label">Pendências</div>{tasks.map((item) => <AgendaRow item={item} key={item.id} onComplete={onComplete}/>)}</>}</div>}</section>
}

function Archive({ items }: { items: RoutineItem[] }) {
  return <section className="archive-view"><div className="section-top"><div><p className="eyebrow">Itens concluídos</p><h2>O que já saiu da cabeça.</h2></div><span className="count">{items.length} no arquivo</span></div>{items.length ? <div className="timeline">{items.map((item) => <article className="agenda-row" key={item.id}><div className="time">✓</div><span className="timeline-dot"/><div className="agenda-copy"><strong>{item.title}</strong><small>Concluído</small></div></article>)}</div> : <div className="empty"><span>□</span><strong>Nada concluído ainda.</strong><p>Ao marcar um item como feito, ele aparecerá aqui.</p></div>}</section>
}

function AgendaRow({ item, onComplete }: { item: RoutineItem; onComplete: (id: string) => void }) {
  return <article className={item.kind === 'task' ? 'agenda-row task' : 'agenda-row'}><div className="time">{item.start ?? '—'}</div><span className="timeline-dot"/><div className="agenda-copy"><strong>{item.title}</strong><small>{item.recurring ? 'Rotina recorrente' : item.kind === 'task' ? 'Sem horário' : `${item.duration} min reservados`}</small></div><button className="row-action" onClick={() => onComplete(item.id)} aria-label={`Marcar ${item.title} como concluído`}>✓</button></article>
}

