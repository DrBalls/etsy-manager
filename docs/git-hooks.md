# Git Hooks

This project uses Husky to manage Git hooks for code quality and consistency.

## Pre-commit Hook

Runs `lint-staged` which:

- Runs ESLint with auto-fix on TypeScript files (`*.ts`, `*.tsx`)
- Runs Prettier on all supported files

## Commit-msg Hook

Validates commit messages using `commitlint` with conventional commit format:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes
- `revert`: Revert a previous commit

Example: `feat: Add user authentication`

## Post-merge Hook

Automatically runs `pnpm install` when:

- `pnpm-lock.yaml` changes
- Any `package.json` file changes

## Setup

Hooks are automatically installed when you run `pnpm install`.

To manually install hooks: `pnpm run prepare`
