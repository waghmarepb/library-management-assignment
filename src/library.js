const ADMIN_USERNAME = "admin";

export class LibrarySystem {
  constructor() {
    /** @type {Map<string, { borrowedBy: string | null }>} */
    this.books = new Map();
    /** @type {Map<string, string[]>} bookName -> queue of usernames */
    this.waitlists = new Map();
    /** @type {Map<string, string[]>} username -> messages shown on next login */
    this.loginNotifications = new Map();
    /** @type {Set<string>} */
    this.users = new Set();
    /** @type {Map<string, string[]>} username -> borrowed titles in order */
    this.userBorrowOrder = new Map();
  }

  login(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      return { ok: false, messages: ["Please provide a username."] };
    }

    const username = this._resolveUsername(trimmed);
    this.users.add(username);
    const messages = [`Hello, ${username}!`];

    if (username === ADMIN_USERNAME) {
      messages.push("You have access to library management.");
      return { ok: true, messages, user: username };
    }

    const notifications = this._takeNotifications(username);
    messages.push(...notifications);

    const borrowed = this._borrowedByUser(username);
    if (borrowed.length > 0) {
      messages.push("Your borrowed books:");
      borrowed.forEach((title, index) => {
        messages.push(`${index + 1}. ${title}`);
      });
      this._appendWaitlistLines(messages, username);
    } else if (notifications.length === 0) {
      messages.push("You don't have any books borrowed yet.");
    }

    return { ok: true, messages, user: username };
  }

  logout(name) {
    if (!name) {
      return { ok: false, messages: ["No user is logged in."] };
    }
    return { ok: true, messages: [`Goodbye, ${name}!`] };
  }

  addBook(actor, bookName) {
    const title = bookName.trim();
    if (actor !== ADMIN_USERNAME) {
      return { ok: false, messages: ['Only "admin" can add books to the library.'] };
    }
    if (!title) {
      return { ok: false, messages: ["Please provide a book name."] };
    }
    if (this.books.has(title)) {
      return { ok: false, messages: [`Book "${title}" is already registered.`] };
    }

    this.books.set(title, { borrowedBy: null });
    return {
      ok: true,
      messages: [`Book "${title}" has been added to the library.`],
    };
  }

  list() {
    if (this.books.size === 0) {
      return { ok: true, messages: ["No books are registered"], books: [] };
    }

    const titles = [...this.books.keys()];
    const messages = [];
    const books = titles.map((title, index) => {
      const borrowedBy = this.books.get(title).borrowedBy;
      const status = borrowedBy ? "borrowed" : "available";
      messages.push(`${index + 1}. ${title} (${status})`);
      return { title, status, borrowedBy };
    });

    return { ok: true, messages, books };
  }

  borrow(user, bookName) {
    user = this._resolveUsername(user);
    const title = bookName.trim();
    if (!this.books.has(title)) {
      return { ok: false, messages: [`Sorry, "${title}" is not registered.`] };
    }
    const book = this.books.get(title);
    if (book.borrowedBy !== null) {
      return {
        ok: false,
        messages: [`Sorry, "${title}" is currently not available.`],
      };
    }

    book.borrowedBy = user;
    this._recordBorrow(user, title);
    return { ok: true, messages: [`You borrowed "${title}".`] };
  }

  returnBook(user, bookName) {
    user = this._resolveUsername(user);
    const title = bookName.trim();
    if (!this.books.has(title)) {
      return { ok: false, messages: [`Sorry, "${title}" is not registered.`] };
    }
    const book = this.books.get(title);
    if (book.borrowedBy !== user) {
      return { ok: false, messages: [`Sorry, you didn't borrow "${title}"`] };
    }

    book.borrowedBy = null;
    this._removeBorrow(user, title);
    const messages = [`You returned "${title}".`];
    this._fulfillWaitlist(title, messages);
    return { ok: true, messages };
  }

  waitlist(user, bookName) {
    user = this._resolveUsername(user);
    const title = bookName.trim();
    if (!this.books.has(title)) {
      return { ok: false, messages: [`Sorry, "${title}" is not registered.`] };
    }
    const book = this.books.get(title);
    if (book.borrowedBy === null) {
      return {
        ok: false,
        messages: [`Sorry, "${title}" is available — borrow it instead of joining the wait list.`],
      };
    }
    if (book.borrowedBy === user) {
      return {
        ok: false,
        messages: [`You already borrowed "${title}".`],
      };
    }

    const queue = this.waitlists.get(title) ?? [];
    const existingIndex = queue.findIndex(
      (queuedUser) => queuedUser.toLowerCase() === user.toLowerCase(),
    );
    if (existingIndex >= 0) {
      const position = existingIndex + 1;
      return {
        ok: false,
        messages: [
          `You are already on the wait list for "${title}" (position ${position}).`,
        ],
      };
    }

    queue.push(user);
    this.waitlists.set(title, queue);
    const position = queue.length;
    return {
      ok: true,
      messages: [
        `You are added to the wait list of "${title}", your position is ${position}.`,
      ],
    };
  }

  status(user) {
    user = this._resolveUsername(user);
    const messages = [];
    const borrowed = this._borrowedByUser(user);

    if (borrowed.length === 0) {
      messages.push("You don't have any books borrowed yet.");
    } else {
      messages.push("Your borrowed books:");
      borrowed.forEach((title, index) => {
        messages.push(`${index + 1}. ${title}`);
      });
    }

    this._appendWaitlistLines(messages, user);
    const waitEntries = this._waitlistEntriesForUser(user);

    return { ok: true, messages, borrowed, waitlists: waitEntries };
  }

  _resolveUsername(name) {
    const trimmed = name.trim();
    if (!trimmed) {
      return trimmed;
    }
    for (const existing of this.users) {
      if (existing.toLowerCase() === trimmed.toLowerCase()) {
        return existing;
      }
    }
    return trimmed;
  }

  _borrowedByUser(user) {
    user = this._resolveUsername(user);
    return [...(this.userBorrowOrder.get(user) ?? [])];
  }

  _waitlistEntriesForUser(user) {
    user = this._resolveUsername(user);
    const entries = [];
    for (const [title, queue] of this.waitlists.entries()) {
      const index = queue.findIndex(
        (queuedUser) => queuedUser.toLowerCase() === user.toLowerCase(),
      );
      if (index >= 0) {
        entries.push({ title, position: index + 1 });
      }
    }
    return entries;
  }

  _appendWaitlistLines(messages, user) {
    const waitEntries = this._waitlistEntriesForUser(user);
    if (waitEntries.length === 0) {
      return;
    }
    messages.push("Your wait lists:");
    waitEntries.forEach(({ title, position }, index) => {
      messages.push(`${index + 1}. ${title} - position ${position}`);
    });
  }

  _recordBorrow(user, title) {
    const order = this.userBorrowOrder.get(user) ?? [];
    if (!order.includes(title)) {
      order.push(title);
    }
    this.userBorrowOrder.set(user, order);
  }

  _removeBorrow(user, title) {
    const order = this.userBorrowOrder.get(user) ?? [];
    this.userBorrowOrder.set(
      user,
      order.filter((t) => t !== title),
    );
  }

  _takeNotifications(user) {
    const pending = this.loginNotifications.get(user) ?? [];
    this.loginNotifications.delete(user);
    return pending;
  }

  _fulfillWaitlist(title, _returnMessages) {
    const queue = this.waitlists.get(title);
    if (!queue || queue.length === 0) {
      return;
    }

    const nextUser = queue.shift();
    if (queue.length === 0) {
      this.waitlists.delete(title);
    } else {
      this.waitlists.set(title, queue);
    }

    const book = this.books.get(title);
    book.borrowedBy = nextUser;
    this._recordBorrow(nextUser, title);

    const note = `You got the book "${title}" from your waitlist`;
    const notes = this.loginNotifications.get(nextUser) ?? [];
    notes.push(note);
    this.loginNotifications.set(nextUser, notes);
  }
}

export function parseCommandLine(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { command: "", args: [] };
  }

  const tokens = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === " " && !inQuotes) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) {
    tokens.push(current);
  }

  const [command = "", ...args] = tokens.map((t) => t.trim()).filter(Boolean);
  return { command: command.toLowerCase(), args };
}
