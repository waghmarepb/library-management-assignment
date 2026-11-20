# Library Management

## Problem Statement

You are asked to develop an application with an interface, either via Command Line (CLI) or browser based UI, to simulate the interaction of users with a small library system. The system allows users to borrow and return books, view their borrowed books, and manage their account.

The submission must include an executable `start.sh` at the root. Running it should launch the application without
additional setup. `start.sh` executes in an environment with the latest versions the langauge such as
Java (`java` in `PATH`, `JAVA_HOME` set), Node.js (`node` and `npm` in `PATH`), or Dart (SDK in `PATH`).
Internet access is enabled so dependencies can be downloaded (e.g., `./gradlew build`, `npm install`, `dart pub get`).

Each invocation must produce a clean start with no state carried over from previous runs — e.g., if users are created, the
process stopped, and `start.sh` is run again, no users should be registered.

## Functional Requirements

The system is expected to fulfil the below functional requirements:

* `login [name]` - Logs in as this user and creates the user if they do not already exist
* `add [book_name]` - Adds a new book to the library (can only be done by the user `admin`)
* `list` - Displays the list of books in the library
* `borrow [book_name]` - Borrows a book for the logged-in user. The book is marked as borrowed and will not appear in the library's available list
* `return [book_name]` - Returns a borrowed book to the library. The book becomes available again
* `waitlist [book_name]` - Adds current user to the wait list of the book which is currently borrowed
* `status` - Displays a list of books currently borrowed by the logged-in user and his wait lists (if any)
* `logout` - Logs out of the current user

## Example Session

Using CLI as an example, your application output should contain at least the following depending on the scenario and commands. But feel free 
to add extra output as you see fit.

```bash
$ login admin
Hello, admin!
You have access to library management.

$ list
No books are registered

$ add "The Great Gatsby"
Book "The Great Gatsby" has been added to the library.

$ add "1984"
Book "1984" has been added to the library.

$ logout
Goodbye, admin!

$ login Alice
Hello, Alice!
You don't have any books borrowed yet.

$ list
1. The Great Gatsby (available)
2. 1984 (available)

$ borrow "1984"
You borrowed "1984".

$ list
1. The Great Gatsby (available)
2. 1984 (borrowed)

$ status
Your borrowed books:
1. 1984

$ logout
Goodbye, Alice!

$ login Bob
Hello, Bob!
You don't have any books borrowed yet.

$ borrow "1985"
Sorry, "1985" is not registered.

$ borrow "1984"
Sorry, "1984" is currently not available.

$ waitlist "1985"
Sorry, "1985" is not registered.

$ waitlist "1984"
You are added to the wait list of "1984", your position is 1.

$ borrow "The Great Gatsby"
You borrowed "The Great Gatsby".

$ status
Your borrowed books:
1. The Great Gatsby
Your wait lists:
1. 1984 - position 1

$ logout
Goodbye, Bob!

$ login Carol
Hello, Carol!
You don't have any books borrowed yet.

$ waitlist "1984"
You are added to the wait list of "1984", your position is 2.
$ status
You don't have any books borrowed yet.
Your wait lists:
1. 1984 - position 2

$ logout
Goodbye, Carol!

$ login Alice
Hello, Alice!
Your borrowed books:
1. 1984

$ return "1984"
You returned "1984".

$ list
1. The Great Gatsby (borrowed)
2. 1984 (borrowed)

$ logout
Goodbye, Alice!

$ login Bob
You got the book "1984" from your waitlist
Your borrowed books:
1. The Great Gatsby
2. 1984

logout
Goodbye, Bob!

$ login Carol
Hello, Carol!
You don't have any books borrowed yet.
Your wait lists:
1. 1984 - position 1

$ list
1. The Great Gatsby (borrowed)
2. 1984 (borrowed)

$ return "The Great Gatsby"
Sorry, you didn't borrow "The Great Gatsby"
```

## Rules
- Application must run, and you must include an instruction manual for operation
- If there are special cases or ambiguity, you are expected to take your own decision on how it should be handled and explain your decision
- If there are any assumptions and/or deviations from the problem statement, you are expected to detail your reasoning
- Please submit the assignment as a Git archive
- Do not include any binary files and/or executables
- Do not push into any public code repository
- You are allowed to use any library, but you should not use any library that outright solves the problem
- You should implement at a level where they would be proud to have other engineers look and review the result
- All parts of the submission will be assessed include but no limited to:
   - Design choices
   - Implementation technique (including tests)
   - Exception handling and special case handling
- You are free to use AI for the assignment