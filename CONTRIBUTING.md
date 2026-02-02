# Private Meet - Contribution Guide

## How to Contribute

1. **Fork the Repository**
   - Fork the private-meet repository to your GitHub account.

2. **Clone the Repository**
   - Clone the forked repository to your local environment:

     ```
     git clone https://github.com/gabriel-logan/private-meet.git
     ```

  3. **Install dependencies**

    ```bash
    make install
    ```

  4. **Run locally**

    ```bash
    make run_server
    make run_web
    ```

5. **Commit and Push**
   - Commit your changes and push them to the forked repository:

     ```
     git add .
     git commit -m "feat: concise description of the changes"
     git push origin my-feature
     ```

4. **Open a Pull Request (PR)**
   - Go to the forked repository on GitHub and open a PR to the main branch of the project.

## Contribution Guidelines

Private Meet is split into:

- `server/` (Go)
- `web/` (React + TypeScript)

When possible, keep changes scoped to one area and include a short explanation in the PR.

- **feat**: adds a new feature to the project. For example:

  ```
  feat(web): add image send button gating
  ```

- **fix**: fixes an existing bug or issue. For example:

  ```
  fix(server): handle websocket disconnect cleanly
  ```

- **refactor**: restructures existing code without changing its functionality. For example:

  ```
  refactor(web): simplify webrtc peer lifecycle
  ```

- **docs**: updates the project's documentation. For example:

  ```
  docs: update README for current stack
  ```

- **style**: makes code style-related changes, such as formatting, indentation, etc. For example:

  ```
  style(web): run prettier
  ```

- **test**: adds or modifies tests in the project. For example:

  ```
  test(server): cover jwt validation
  ```

- **chore**: performs maintenance tasks or other activities not directly related to code. For example:

  ```
  chore: update project dependencies for compatibility with new versions
  ```

- **perf**: makes performance improvements in the code. For example:

  ```
  perf(web): reduce rerenders in chat list
  ```

- **revert**: reverts a previous change. For example:

  ```
  revert: revert changes in the controller due to implementation issues
  ```

- **ci**: makes modifications related to continuous integration (CI) and deployment. For example:

  ```
  ci: update build pipeline
  ```

---

- Follow the coding standards of the language you're contributing to (Go, TypeScript).
- Keep the code clean and readable.
- Add tests for new functionalities or bug fixes when practical.
- Properly document the changes made, including updates to README if necessary.
- Be respectful to other contributors and maintain a collaborative environment.

## Useful commands

- `make test` (server tests)
- `cd web && pnpm lint` / `cd web && pnpm lint:fix`
- `cd web && pnpm build`

## License

By contributing to private-meet, you agree that your contributions will be licensed under the AGPL-3.0 License. Make sure you're familiar with the terms of this license.
