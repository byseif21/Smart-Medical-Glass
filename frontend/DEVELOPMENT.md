# Development Guide

This document outlines the development setup, tools, and best practices for the Smart Glass AI frontend.

## Development Tools

### Code Quality Tools

- **ESLint**: JavaScript/TypeScript linter for code quality
- **Prettier**: Code formatter for consistent style
- **TypeScript**: Type checking (with JSX support)
- **Husky**: Git hooks for automated checks
- **lint-staged**: Run linters on staged files only

## Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality

```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Fix linting errors automatically
npm run format       # Format all code with Prettier
npm run format:check # Check if code is formatted
npm run type-check   # Run TypeScript type checking
```

## Pre-commit Hooks

Git hooks are automatically set up to run before each commit:

1. **lint-staged**: Runs on staged files only
   - ESLint with auto-fix
   - Prettier formatting
2. Files are automatically formatted and linted before commit
3. Commit is blocked if there are unfixable errors

## Code Style Guidelines

### Prettier Configuration

- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Quotes**: Single quotes for JS, double for JSX
- **Semicolons**: Always
- **Trailing Commas**: ES5 compatible
- **Line Endings**: LF (Unix style)

### ESLint Rules

- React 18+ (no need to import React)
- No prop-types (using TypeScript instead)
- Warn on unused variables (except those starting with `_`)
- Warn on `console.log` (use `console.warn` or `console.error`)
- Error on `var` usage (use `const` or `let`)

## TypeScript Support

The project supports TypeScript with JSX:

- `.jsx` and `.tsx` files are both supported
- Type checking is optional but recommended
- Run `npm run type-check` to check types without emitting files

## Best Practices

### Before Committing

1. Run `npm run lint:fix` to fix linting issues
2. Run `npm run format` to format code
3. Run `npm run type-check` to verify types
4. Test your changes locally

### During Development

- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused
- Use TypeScript types when possible
- Avoid `console.log` in production code

### File Organization

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API and external services
├── styles/         # Global styles and CSS
└── utils/          # Utility functions (if needed)
```

## Troubleshooting

### ESLint Errors

If you see ESLint errors:

1. Run `npm run lint:fix` to auto-fix
2. Check the error message for manual fixes
3. Add `// eslint-disable-next-line rule-name` for exceptions

### Prettier Conflicts

If Prettier and ESLint conflict:

1. Prettier rules take precedence
2. Run `npm run format` to apply Prettier
3. Then run `npm run lint:fix`

### Pre-commit Hook Issues

If the pre-commit hook fails:

1. Check the error message
2. Fix the issues manually
3. Stage the fixed files
4. Try committing again

To bypass hooks (not recommended):

```bash
git commit --no-verify
```

## Editor Setup

### VS Code (Recommended)

Install these extensions:

- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Other Editors

Configure your editor to:

1. Use Prettier for formatting
2. Run ESLint on save
3. Respect `.editorconfig` settings

## Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
