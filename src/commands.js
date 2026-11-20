import { parseCommandLine } from './library.js'

/**
 * @param {import('./library.js').LibrarySystem} library
 * @param {string | null} currentUser
 * @param {string} rawInput
 * @returns {{ ok: boolean, messages: string[], user: string | null }}
 */
export function executeCommand(library, currentUser, rawInput) {
  const { command, args } = parseCommandLine(rawInput)
  if (!command) {
    return { ok: false, messages: ['Enter a command.'], user: currentUser }
  }

  let user = currentUser

  switch (command) {
    case 'login': {
      if (!args[0]) {
        return { ok: false, messages: ['Usage: login [name]'], user: null }
      }
      const result = library.login(args[0])
      return {
        ok: result.ok,
        messages: result.messages,
        user: result.ok ? result.user : null,
      }
    }
    case 'logout': {
      if (!user) {
        return {
          ok: false,
          messages: ['No user is logged in.'],
          user: null,
        }
      }
      const result = library.logout(user)
      return { ok: result.ok, messages: result.messages, user: null }
    }
    case 'add': {
      if (!user) {
        return { ok: false, messages: ['Please log in first.'], user }
      }
      if (!args[0]) {
        return { ok: false, messages: ['Usage: add [book_name]'], user }
      }
      const result = library.addBook(user, args[0])
      return { ok: result.ok, messages: result.messages, user }
    }
    case 'list': {
      const result = library.list()
      return { ok: result.ok, messages: result.messages, user }
    }
    case 'borrow': {
      if (!user) {
        return { ok: false, messages: ['Please log in first.'], user }
      }
      if (!args[0]) {
        return { ok: false, messages: ['Usage: borrow [book_name]'], user }
      }
      const result = library.borrow(user, args[0])
      return { ok: result.ok, messages: result.messages, user }
    }
    case 'return': {
      if (!user) {
        return { ok: false, messages: ['Please log in first.'], user }
      }
      if (!args[0]) {
        return { ok: false, messages: ['Usage: return [book_name]'], user }
      }
      const result = library.returnBook(user, args[0])
      return { ok: result.ok, messages: result.messages, user }
    }
    case 'waitlist': {
      if (!user) {
        return { ok: false, messages: ['Please log in first.'], user }
      }
      if (!args[0]) {
        return { ok: false, messages: ['Usage: waitlist [book_name]'], user }
      }
      const result = library.waitlist(user, args[0])
      return { ok: result.ok, messages: result.messages, user }
    }
    case 'status': {
      if (!user) {
        return { ok: false, messages: ['Please log in first.'], user }
      }
      const result = library.status(user)
      return {
        ok: result.ok,
        messages: result.messages,
        user,
        borrowed: result.borrowed,
        waitlists: result.waitlists,
      }
    }
    default:
      return {
        ok: false,
        messages: [
          `Unknown command "${command}". Try login, add, list, borrow, return, waitlist, status, logout.`,
        ],
        user,
      }
  }
}
