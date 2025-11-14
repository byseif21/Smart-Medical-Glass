# Quick Start Guide

## First Time Setup

```bash
# Install dependencies
npm install

# Verify setup
npm run lint
npm run type-check
```

## Daily Development

```bash
# Start development server
npm run dev

# Before committing (optional - runs automatically)
npm run lint:fix
npm run format
```

## Pre-commit Hook

The pre-commit hook runs automatically when you commit:

- ✅ Fixes ESLint errors
- ✅ Formats code with Prettier
- ✅ Blocks commit if unfixable errors exist

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check for errors
npm run lint:fix     # Fix errors
npm run format       # Format all code
npm run type-check   # Check TypeScript types
```

## Editor Setup (VS Code)

1. Install extensions:
   - ESLint
   - Prettier - Code formatter
   - Tailwind CSS IntelliSense

2. Reload VS Code

3. Code will auto-format on save!

## That's It!

The setup handles code quality automatically. Just write code and commit - the tools will keep everything clean and consistent.

For more details, see [DEVELOPMENT.md](./DEVELOPMENT.md)
