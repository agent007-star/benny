# Contributing to Benny

Thank you for your interest in contributing to Benny!

## Development Setup

```bash
git clone <repo>
cd benny
npm install
npm run build
npm link
```

## Available Commands

```bash
npm run build      # Compile TypeScript
npm run typecheck  # Type check without build
npm run lint       # Lint source code
npm run dev        # Run with tsx (no compile)
npm test           # Run tests
```

## Code Style

- TypeScript strict mode
- 2-space indentation
- Use ES modules (`import/export`)
- No semicolons at end of statements

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and run `npm run typecheck && npm run lint`
4. Commit with clear messages
5. Push and open a PR

## Bug Reports

Please include:
- Benny version (`benny --version`)
- Node.js version
- Steps to reproduce
- Expected vs actual behavior

## Feature Requests

Open an issue with:
- Use case description
- Why it matters for Chinese developers
- Any relevant API/model considerations
