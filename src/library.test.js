import assert from "node:assert/strict";
import test from "node:test";
import { LibrarySystem, parseCommandLine } from "./library.js";

test("example session from Library.md", () => {
  const lib = new LibrarySystem();

  assert.deepEqual(lib.login("admin").messages, [
    "Hello, admin!",
    "You have access to library management.",
  ]);
  assert.deepEqual(lib.list().messages, ["No books are registered"]);
  assert.deepEqual(lib.addBook("admin", "The Great Gatsby").messages, [
    'Book "The Great Gatsby" has been added to the library.',
  ]);
  assert.deepEqual(lib.addBook("admin", "1984").messages, [
    'Book "1984" has been added to the library.',
  ]);
  assert.deepEqual(lib.logout("admin").messages, ["Goodbye, admin!"]);

  assert.deepEqual(lib.login("Alice").messages, [
    "Hello, Alice!",
    "You don't have any books borrowed yet.",
  ]);
  assert.deepEqual(lib.list().messages, [
    "1. The Great Gatsby (available)",
    "2. 1984 (available)",
  ]);

  assert.deepEqual(lib.borrow("Alice", "1984").messages, [
    'You borrowed "1984".',
  ]);
  assert.deepEqual(lib.list().messages, [
    "1. The Great Gatsby (available)",
    "2. 1984 (borrowed)",
  ]);
  assert.deepEqual(lib.status("Alice").messages, [
    "Your borrowed books:",
    "1. 1984",
  ]);
  assert.deepEqual(lib.logout("Alice").messages, ["Goodbye, Alice!"]);

  assert.deepEqual(lib.login("Bob").messages, [
    "Hello, Bob!",
    "You don't have any books borrowed yet.",
  ]);
  assert.deepEqual(lib.borrow("Bob", "1985").messages, [
    'Sorry, "1985" is not registered.',
  ]);
  assert.deepEqual(lib.borrow("Bob", "1984").messages, [
    'Sorry, "1984" is currently not available.',
  ]);
  assert.deepEqual(lib.waitlist("Bob", "1985").messages, [
    'Sorry, "1985" is not registered.',
  ]);
  assert.deepEqual(lib.waitlist("Bob", "1984").messages, [
    'You are added to the wait list of "1984", your position is 1.',
  ]);
  assert.deepEqual(lib.borrow("Bob", "The Great Gatsby").messages, [
    'You borrowed "The Great Gatsby".',
  ]);
  assert.deepEqual(lib.status("Bob").messages, [
    "Your borrowed books:",
    "1. The Great Gatsby",
    "Your wait lists:",
    "1. 1984 - position 1",
  ]);
  assert.deepEqual(lib.logout("Bob").messages, ["Goodbye, Bob!"]);

  assert.deepEqual(lib.login("Carol").messages, [
    "Hello, Carol!",
    "You don't have any books borrowed yet.",
  ]);
  assert.deepEqual(lib.waitlist("Carol", "1984").messages, [
    'You are added to the wait list of "1984", your position is 2.',
  ]);
  assert.deepEqual(lib.status("Carol").messages, [
    "You don't have any books borrowed yet.",
    "Your wait lists:",
    "1. 1984 - position 2",
  ]);
  assert.deepEqual(lib.logout("Carol").messages, ["Goodbye, Carol!"]);

  assert.deepEqual(lib.login("Alice").messages, [
    "Hello, Alice!",
    "Your borrowed books:",
    "1. 1984",
  ]);
  assert.deepEqual(lib.returnBook("Alice", "1984").messages, [
    'You returned "1984".',
  ]);
  assert.deepEqual(lib.list().messages, [
    "1. The Great Gatsby (borrowed)",
    "2. 1984 (borrowed)",
  ]);
  assert.deepEqual(lib.logout("Alice").messages, ["Goodbye, Alice!"]);

  assert.deepEqual(lib.login("Bob").messages, [
    "Hello, Bob!",
    'You got the book "1984" from your waitlist',
    "Your borrowed books:",
    "1. The Great Gatsby",
    "2. 1984",
  ]);
  assert.deepEqual(lib.logout("Bob").messages, ["Goodbye, Bob!"]);

  assert.deepEqual(lib.login("Carol").messages, [
    "Hello, Carol!",
    "You don't have any books borrowed yet.",
  ]);
  assert.deepEqual(lib.status("Carol").messages, [
    "You don't have any books borrowed yet.",
    "Your wait lists:",
    "1. 1984 - position 1",
  ]);
  assert.deepEqual(lib.list().messages, [
    "1. The Great Gatsby (borrowed)",
    "2. 1984 (borrowed)",
  ]);
  assert.deepEqual(lib.returnBook("Carol", "The Great Gatsby").messages, [
    `Sorry, you didn't borrow "The Great Gatsby"`,
  ]);
});

test("parseCommandLine handles quoted book titles", () => {
  assert.deepEqual(parseCommandLine('borrow "The Great Gatsby"'), {
    command: "borrow",
    args: ["The Great Gatsby"],
  });
});

test("status includes waitlists after login with different username casing", () => {
  const lib = new LibrarySystem();
  lib.addBook("admin", "The Great Gatsby");
  lib.addBook("admin", "1984");
  lib.borrow("Alice", "1984");
  lib.login("Bob");
  lib.waitlist("Bob", "1984");
  lib.borrow("Bob", "The Great Gatsby");
  lib.login("bob");

  assert.deepEqual(lib.status("bob").messages, [
    "Your borrowed books:",
    "1. The Great Gatsby",
    "Your wait lists:",
    "1. 1984 - position 1",
  ]);
});

test("non-admin cannot add books", () => {
  const lib = new LibrarySystem();
  const result = lib.addBook("Alice", "Dune");
  assert.equal(result.ok, false);
});
