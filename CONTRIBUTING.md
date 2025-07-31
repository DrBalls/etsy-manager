# Contributing to Etsy Store Manager

Thank you for your interest in contributing to Etsy Store Manager! We welcome contributions from the community and are grateful for any help you can provide.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Push your changes to your fork
6. Create a pull request

## Development Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up the database:
```bash
pnpm db:migrate
pnpm db:seed
```

3. Start the development server:
```bash
pnpm dev:web
```

## Code Style

We use ESLint and Prettier to maintain consistent code style. Before submitting a pull request, please run:

```bash
pnpm lint:fix
pnpm format
```

## Testing

Please ensure all tests pass before submitting a pull request:

```bash
pnpm test
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Please use the following format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Pull Request Process

1. Ensure your code adheres to the existing style
2. Update the README.md with details of changes if applicable
3. Update any relevant documentation
4. Add tests for new functionality
5. Ensure all tests pass
6. Request review from maintainers

## Reporting Issues

Please use the GitHub issue tracker to report bugs or request features. When reporting bugs, please include:

1. Description of the issue
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment details (OS, browser, Node version, etc.)

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## Questions?

Feel free to open an issue or reach out to the maintainers if you have any questions.

Thank you for contributing!