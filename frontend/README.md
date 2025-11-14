# Frontend - Smart Glass AI

## Overview

The frontend component is a React-based web application that provides an intuitive interface for face registration and recognition testing. Users can upload face images, enter personal information, and test the face recognition system through a clean, responsive UI.

## Contents

This folder contains:

- **src/**: Source code for the React application
  - **components/**: Reusable UI components (RegistrationForm, RecognitionTest, UserInfoDisplay)
  - **services/**: API integration layer for backend communication
  - **utils/**: Helper functions and utilities
  - **types/**: TypeScript type definitions
- **public/**: Static assets (images, icons)
- **package.json**: Node.js dependencies and scripts
- **.env.example**: Environment variables template

## Technology Stack

- **React 18+** or **Next.js 14+**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Axios**: HTTP client for API requests
- **React Router** (if using Vite): Client-side routing
- **CSS Modules** or **Tailwind CSS**: Styling
- **Vite** or **Next.js**: Build tool and development server

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js) or yarn package manager
- Backend API running on http://localhost:8000

## Setup Instructions

### Option 1: Using Vite + React

#### 1. Create React Application

```bash
# Navigate to frontend folder
cd frontend

# Create Vite + React app
npm create vite@latest . -- --template react-ts

# Or with yarn
yarn create vite . --template react-ts
```

#### 2. Install Dependencies

```bash
npm install axios react-router-dom

# Or with yarn
yarn add axios react-router-dom
```

#### 3. Configure Environment Variables

Create a `.env` file in the frontend folder:

```bash
cp .env.example .env
```

Edit the `.env` file:

```
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=5242880
```

#### 4. Start Development Server

```bash
npm run dev

# Or with yarn
yarn dev
```

The application will be available at `http://localhost:5173`

### Option 2: Using Next.js

#### 1. Create Next.js Application

```bash
# Navigate to frontend folder
cd frontend

# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app

# Or with yarn
yarn create next-app . --typescript --tailwind --app
```

#### 2. Install Dependencies

```bash
npm install axios

# Or with yarn
yarn add axios
```

#### 3. Configure Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
```

#### 4. Start Development Server

```bash
npm run dev

# Or with yarn
yarn dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── RegistrationForm.tsx    # User registration form
│   │   ├── RecognitionTest.tsx     # Face recognition interface
│   │   └── UserInfoDisplay.tsx     # Display recognized user info
│   ├── services/
│   │   └── api.ts                  # API client and endpoints
│   ├── utils/
│   │   └── validators.ts           # Input validation helpers
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── App.tsx                     # Main application component
│   └── main.tsx                    # Application entry point
├── public/
│   └── assets/                     # Static images and icons
├── package.json                    # Dependencies and scripts
├── .env.example                    # Environment variables template
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration (if using Vite)
└── README.md                       # This file
```

## Available Scripts

### Development

```bash
# Start development server with hot reload
npm run dev
```

### Build

```bash
# Create production build
npm run build
```

### Preview

```bash
# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run TypeScript type checking
npm run type-check
```

## Development Tools

This project includes professional development tools for code quality:

- **ESLint**: Catches errors and enforces best practices
- **Prettier**: Ensures consistent code formatting
- **TypeScript**: Provides type safety (with JSX support)
- **Husky**: Runs pre-commit hooks automatically
- **lint-staged**: Lints and formats only changed files

### Pre-commit Hooks

Code is automatically linted and formatted before each commit. The commit will be blocked if there are unfixable errors.

For detailed information, see:

- [QUICK_START.md](./QUICK_START.md) - Quick reference guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Comprehensive development guide

## Features

### 1. User Registration

- Upload face image with preview
- Enter personal information (name, email, phone)
- Form validation with error messages
- Success/error feedback after submission

### 2. Face Recognition

- Upload image for recognition
- Display loading state during processing
- Show recognized user information with confidence score
- Handle "not recognized" scenarios gracefully

### 3. Responsive Design

- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

## API Integration

The frontend communicates with the backend through the following endpoints:

### Register User

```typescript
POST /api/register
Content-Type: multipart/form-data

Request:
- image: File
- name: string
- email: string
- phone: string (optional)

Response:
{
  success: boolean;
  user_id?: string;
  message?: string;
  error?: string;
}
```

### Recognize Face

```typescript
POST /api/recognize
Content-Type: multipart/form-data

Request:
- image: File

Response:
{
  recognized: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    registered_at: string;
  };
  confidence?: number;
  message?: string;
}
```

## Component Documentation

### RegistrationForm Component

Handles user registration with face image upload.

**Props:**

```typescript
interface RegistrationFormProps {
  onSubmit: (data: RegistrationData) => Promise<void>;
}
```

**Features:**

- Image upload with preview
- Form validation
- Error handling
- Success feedback

### RecognitionTest Component

Provides interface for testing face recognition.

**Props:**

```typescript
interface RecognitionTestProps {
  onRecognize: (image: File) => Promise<RecognitionResult>;
}
```

**Features:**

- Image upload
- Loading state
- Result display
- Error handling

### UserInfoDisplay Component

Displays recognized user information.

**Props:**

```typescript
interface UserInfoDisplayProps {
  user: UserData;
  confidence: number;
}
```

**Features:**

- Formatted user data display
- Confidence score visualization
- Responsive card layout

## Styling

### Using CSS Modules

```typescript
import styles from './Component.module.css';

<div className={styles.container}>
  {/* Component content */}
</div>
```

### Using Tailwind CSS

```typescript
<div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
  {/* Component content */}
</div>
```

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use functional components with hooks
- Implement proper error boundaries
- Add loading states for async operations

### File Naming

- Components: PascalCase (e.g., `RegistrationForm.tsx`)
- Utilities: camelCase (e.g., `validators.ts`)
- Types: PascalCase (e.g., `UserData.ts`)

### State Management

- Use React hooks (useState, useEffect) for local state
- Consider Context API for global state if needed
- Keep state close to where it's used

## Testing

### Running Tests

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  it('renders form fields', () => {
    render(<RegistrationForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### CORS Errors

- Ensure backend CORS is configured to allow frontend origin
- Check that API_URL in .env is correct
- Verify backend server is running

### Image Upload Issues

- Check file size (max 5MB)
- Verify file format (JPEG or PNG only)
- Ensure proper Content-Type header

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist` or `rm -rf .next`
- Check for TypeScript errors: `npm run type-check`

### Environment Variables Not Loading

- Ensure .env file exists and has correct format
- Restart development server after changing .env
- Use correct prefix (VITE* for Vite, NEXT_PUBLIC* for Next.js)

## Performance Optimization

- Lazy load components with React.lazy()
- Optimize images (compress, use appropriate formats)
- Implement code splitting
- Use React.memo for expensive components
- Debounce form inputs

## Deployment

### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify (Recommended for Vite)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables in Production

Set the following environment variables in your deployment platform:

- `VITE_API_URL` or `NEXT_PUBLIC_API_URL`: Production backend URL
- `VITE_MAX_FILE_SIZE` or `NEXT_PUBLIC_MAX_FILE_SIZE`: Maximum file size

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML elements
- ARIA labels for form inputs
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast

## Additional Resources

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Axios Documentation](https://axios-http.com/docs/intro)
