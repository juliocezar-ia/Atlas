# Atlas

> A voice-first daily organizer that turns a rough thought into a usable timeline.

Atlas is a small, open-source web app for the moment before a task list: when your day is still a messy sentence in your head. Speak or type what you need to do, and Atlas separates timed events, recurring routines, and loose ends into a clear daily view.

It is deliberately not a chat assistant, calendar clone, or generic to-do list. Its one job is to make an unstructured daily dump actionable in seconds.

## Why Atlas

- **Fast capture:** one microphone button and one text field. No account or setup flow.
- **Purpose-built structure:** recognizes times, durations, recurring routines, and unscheduled tasks.
- **Private by default:** the agenda is stored only in browser `localStorage`.
- **Free to run:** static React app, no backend, API key, subscription, or Atlas-operated cloud service.
- **Explainable:** the organizer uses small local rules that are easy to inspect and test.

## What "AI" means here

Atlas uses the browser's speech-recognition capability when it is available; modern speech recognition is commonly AI-assisted by the browser or its provider. After transcription, Atlas uses an offline, deterministic organizer to create the timeline. It does **not** call an LLM, train on your notes, or claim to be a general AI assistant.

This design keeps the core flow free, auditable, and useful even with typed input.

## Privacy notes

Atlas never stores audio recordings and sends no agenda data to an Atlas server because there is no Atlas server. Speech-recognition privacy depends on the browser implementation: some browsers may use a provider service to transcribe audio. Check your browser's documentation and permission prompt before using the microphone. Typed notes and the resulting agenda stay in local browser storage until you clear site data or use **Clear day**.

## Optional OpenAI API integrations

The current Atlas release does not require or use an OpenAI API key. If a future contributor adds an opt-in server-side integration, follow the [API key safety guide](docs/openai-api-keys.md) before writing code. Never put a key in this React bundle, browser storage, a `.env` file committed to Git, screenshots, issues, or pull requests.

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Vite.

## Test and build

```bash
npm test
npm run build
```

## Architecture

| Area | Responsibility |
| --- | --- |
| `src/App.tsx` | Voice/text capture, browser storage, visual timeline, and user actions. |
| `src/lib/voicePlanner.ts` | Deterministic parsing and ordering of a daily note. |
| `src/lib/voicePlanner.test.ts` | Parser behavior for natural-language capture. |

## Roadmap

- More language and date expressions.
- An editable timeline and completed-item archive.
- Optional calendar export, while keeping the core app local-first.
- A clearly opt-in, bring-your-own-provider assistant for users who want richer parsing.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Atlas is released under the [MIT License](LICENSE).

---

## Publicação rápida (PT-BR)

1. Crie um repositório público chamado `atlas-voice-timeline`.
2. Envie os arquivos deste projeto e adicione uma descrição fiel: *"A voice-first, local-first daily organizer that turns a rough thought into a usable timeline."*
3. Para Vercel, Netlify ou Cloudflare Pages, use `npm run build` e publique a pasta `dist`.
4. Antes de divulgar, execute `npm test` e `npm run build`; o GitHub Actions também executa ambos a cada pull request.

O projeto não precisa de chave de API, conta de usuário nem backend. Para uma demonstração honesta, mostre: falar uma frase desorganizada → revisar a transcrição → receber uma linha do tempo → marcar um item como concluído.

