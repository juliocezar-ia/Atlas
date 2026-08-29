# Optional OpenAI API key guidance

Atlas is a static client-only app and currently needs no OpenAI API key. This page exists for contributors considering a future, explicitly opt-in integration.

## Non-negotiable rules

1. Never put `OPENAI_API_KEY` in React/Vite client code, `VITE_*` variables, browser storage, or any file shipped to `dist`.
2. Never commit a real key to GitHub, including in examples, tests, screenshots, issues, or pull requests. The repository is public.
3. Keep the key on a server-side function or trusted backend and route requests through that boundary. A browser-visible key is not secret.
4. Store the secret in the deployment provider's encrypted environment variables or a dedicated secret manager. Keep `.env` files ignored and commit only a placeholder with no value.
5. Use separate, least-privileged keys for environments or team members. Do not share keys between people.
6. Set spend limits, monitor usage, rotate keys periodically, and revoke a key immediately if exposure is suspected.
7. Document what data leaves the device, obtain clear user consent, and make the integration optional. Do not silently upload voice transcripts or agenda data.

## Safe configuration pattern

The secret belongs only in the server environment:

```text
OPENAI_API_KEY=<set-this-in-your-secret-manager>
```

Server-side code may read `process.env.OPENAI_API_KEY`; client-side code must never receive or render its value. Do not add this variable to Vite's `VITE_` namespace, because those variables are exposed to the browser bundle.

## If a key leaks

Stop using it, revoke or rotate it immediately in the OpenAI API key dashboard, inspect account usage, remove the secret from repository history where appropriate, and report suspicious activity through official OpenAI support channels. Removing a key from the latest commit alone does not make an exposed key safe.

These recommendations follow OpenAI's [official API key safety guidance](https://help.openai.com/pt-br/articles/5112595).

