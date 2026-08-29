# Security policy

## Supported version

Security fixes are made on the latest version on the default branch.

## Reporting a vulnerability

Please do not post suspected vulnerabilities in public issues. Use GitHub's private vulnerability reporting feature for this repository, or contact the maintainer through the email listed in the repository profile. Include reproduction steps, impact, and any suggested mitigation.

## Security boundaries

Atlas is a client-only static application. It has no authentication, server, analytics, API key, or Atlas-operated network endpoint. Browser `localStorage` is used for agenda data. Microphone access occurs only after a user interaction and is handled through the browser's speech-recognition API when available.

Browser speech-recognition providers can have their own privacy and network behavior. Atlas does not record or transmit audio itself. Do not add remote data collection, credentials, or unreviewed third-party scripts without a security review.

For any future OpenAI integration, follow [docs/openai-api-keys.md](docs/openai-api-keys.md). API keys must remain server-side and must never be exposed in the browser bundle or committed to this public repository. See OpenAI's [official API key safety guidance](https://help.openai.com/pt-br/articles/5112595).

