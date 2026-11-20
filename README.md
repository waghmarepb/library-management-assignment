# Library Management

Browser-based implementation of [Library.md](./Library.md): borrow/return books, admin catalog management, and wait lists. All logic runs in the **React app** (in-memory state; fresh on each page load or app restart).

## Start the app

```bash
npm install   # first time only
npm run dev
```

Open **http://127.0.0.1:5173**.

## Project layout

| Path | Role |
|------|------|
| `src/library.js` | Domain logic (`LibrarySystem`) |
| `src/commands.js` | CLI-style command parsing |
| `src/App.jsx` | React UI |
| `src/library.test.js` | Tests |

## Tests

```bash
npm test
```

## Email submission (Gmail blocks ZIP with `.js`)

See [HOW-TO-SUBMIT.txt](./HOW-TO-SUBMIT.txt). Quick command:

```bash
npm run bundle:email
```

Attach **`library-submission-bundle.json`**, or zip the **`email-attach/`** folder (scripts inside are renamed to `*.txt`).