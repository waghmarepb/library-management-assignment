import { useCallback, useEffect, useRef, useState } from 'react'
import { executeCommand } from './commands'
import { LibrarySystem } from './library'
import './App.css'

const QUICK_COMMANDS = [
  'login admin',
  'list',
  'status',
  'logout',
]

function App() {
  const libraryRef = useRef(null)
  if (!libraryRef.current) {
    libraryRef.current = new LibrarySystem()
  }

  const [lines, setLines] = useState([
    'Library Management System',
    'Type a command and press Enter. Example: login Alice',
    'Commands: login, add, list, borrow, return, waitlist, status, logout',
    '',
  ])
  const [input, setInput] = useState('')
  const [user, setUser] = useState(null)
  const [borrowed, setBorrowed] = useState([])
  const [waitlists, setWaitlists] = useState([])
  const [busy, setBusy] = useState(false)
  const outputRef = useRef(null)

  const syncAccount = useCallback((username) => {
    if (!username) {
      setBorrowed([])
      setWaitlists([])
      return
    }
    const account = libraryRef.current.status(username)
    setBorrowed(account.borrowed)
    setWaitlists(account.waitlists)
  }, [])

  const appendOutput = useCallback((commandLine, messages) => {
    setLines((prev) => [...prev, `$ ${commandLine}`, ...messages, ''])
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  const submitCommand = (commandText) => {
    const trimmed = commandText.trim()
    if (!trimmed || busy) {
      return
    }

    setBusy(true)
    setInput('')
    const result = executeCommand(libraryRef.current, user, trimmed)
    appendOutput(trimmed, result.messages ?? [])
    setUser(result.user ?? null)
    syncAccount(result.user ?? null)
    setBusy(false)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    submitCommand(input)
  }

  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>Library Management</h1>
          <p className="subtitle">Browser interface for the library commands in Library.md</p>
        </div>
        <div className="session">
          {user ? (
            <div className="session-details">
              <span>Signed in as <strong>{user}</strong></span>
              {borrowed.length > 0 && (
                <span>Borrowed: {borrowed.join(', ')}</span>
              )}
              {waitlists.length > 0 && (
                <span>
                  Wait lists:{' '}
                  {waitlists
                    .map((entry) => `${entry.title} (#${entry.position})`)
                    .join(', ')}
                </span>
              )}
            </div>
          ) : (
            <span>Not signed in — use <code>login [name]</code></span>
          )}
        </div>
      </header>

      <section className="quick-bar">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            className="quick-btn"
            disabled={busy}
            onClick={() => submitCommand(cmd)}
          >
            {cmd}
          </button>
        ))}
      </section>

      <pre ref={outputRef} className="terminal" aria-live="polite">
        {lines.join('\n')}
      </pre>

      <form className="command-form" onSubmit={onSubmit}>
        <label htmlFor="command" className="sr-only">Command</label>
        <span className="prompt" aria-hidden="true">$</span>
        <input
          id="command"
          className="command-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder='login Alice or borrow "1984"'
          disabled={busy}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Run
        </button>
      </form>
    </div>
  )
}

export default App
