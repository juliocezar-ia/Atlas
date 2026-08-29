# Contributing to Atlas

Atlas is intentionally small, private by default, and explainable. Contributions that make voice-to-timeline capture clearer and more dependable are welcome.

## Before opening a pull request

1. Fork the repository and create a focused branch.
2. Run `npm install` and `npm test`.
3. Add or update a test for any change to the voice organizer.
4. Keep the product local-first: do not add analytics, tracking, sign-in, or a hosted dependency without first opening an issue to discuss it.

## Product principles

- A parser decision must be predictable and covered by a small test.
- The app must remain usable without an account, API key, or network connection after it loads.
- User data belongs in the browser, not on a server.
- Prefer fewer, clearer features over another generic task-manager surface or chat interface.

