# Contributing to Passwordless Authentication Library

Thank you for your interest in contributing to the Passwordless Authentication Library! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project adheres to a Code of Conduct that promotes a welcoming and inclusive environment. By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm or yarn
- Git

### Cloning the Repository

```bash
# Clone the repository
git clone https://github.com/SNO7E-G/passwordless-auth.git
cd passwordless-auth

# Install dependencies
npm install
```

### Running Development Environment

```bash
# Build the library
npm run build

# Watch for changes
npm run dev

# Run tests
npm test
```

## Development Environment

This project uses TypeScript for all source code. The development environment includes:

- **TypeScript**: For static typing
- **Jest**: For testing
- **ESLint**: For code linting
- **Prettier**: For code formatting

### Directory Structure

```
passwordless-auth/
├── src/                     # Source code
│   ├── config/              # Configuration utilities
│   ├── integrations/        # Framework integrations (Express, React, etc.)
│   ├── interfaces/          # TypeScript interfaces and types
│   ├── services/            # Core services
│   ├── tests/               # Tests
│   ├── utils/               # Utility functions
│   ├── index.ts             # Main entry point
│   └── lib.ts               # Public API exports
├── dist/                    # Compiled JavaScript (build output)
├── docs/                    # Documentation
├── demo.js                  # Demo application
├── .gitignore               # Git ignore file
├── LICENSE                  # License file
├── package.json             # Package configuration
├── README.md                # Project readme
├── tsconfig.json            # TypeScript configuration
└── typedoc.json            # TypeDoc configuration
```

## Coding Standards

### TypeScript Style Guide

- Follow the [TypeScript style guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- Use proper typing for all function parameters and return values
- Avoid using `any` type when possible
- Use interfaces over types for object definitions

### Code Formatting

We use Prettier for code formatting. To format your code:

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check
```

### Linting

We use ESLint for linting. To lint your code:

```bash
# Lint all files
npm run lint

# Fix automatically fixable issues
npm run lint:fix
```

## Pull Request Process

1. **Create a branch**: Create a new branch for your feature or bugfix
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Implement your changes**: Make your changes following the coding standards

3. **Add tests**: Ensure your code is properly tested

4. **Update documentation**: Update any relevant documentation

5. **Commit your changes**: Use clear and descriptive commit messages
   ```bash
   git commit -m "Add feature: my new feature"
   ```

6. **Push your branch**: Push your branch to GitHub
   ```bash
   git push origin feature/my-new-feature
   ```

7. **Create a Pull Request**: Create a PR against the `main` branch

8. **Code review**: Wait for code review and address any comments

9. **Merge**: Once approved, your PR will be merged into the main branch

### Pull Request Template

When creating a PR, please include:

1. A clear description of what the PR does
2. Any relevant issue numbers (e.g., "Fixes #123")
3. A list of changes made
4. Screenshots (if relevant)
5. Testing instructions

## Testing

All code contributions should include tests. We use Jest for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in the `src/tests` directory
- Name test files with `.test.ts` suffix
- Organize tests by service or component
- Use descriptive test names that explain the expected behavior

Example test:

```typescript
import { authService } from '../services/authService';

describe('Auth Service', () => {
  describe('sendMagicLink', () => {
    it('should send a magic link to a valid email', async () => {
      // Arrange
      const email = 'test@example.com';
      
      // Act
      const result = await authService.sendMagicLink(email);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Magic link sent');
    });
    
    it('should return an error for an invalid email', async () => {
      // Arrange
      const email = 'invalid-email';
      
      // Act
      const result = await authService.sendMagicLink(email);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid email');
    });
  });
});
```

## Documentation

Good documentation is essential. When making changes:

1. Update or add JSDocs for all public functions, classes, and interfaces
2. Update relevant markdown documentation in the `docs` directory
3. Update the README.md if needed

### JSDocs Style

```typescript
/**
 * Sends a magic link to the user's email
 * 
 * @param email - The user's email address
 * @param options - Optional configuration for the magic link
 * @returns A promise that resolves to the result of the operation
 * @throws {Error} If the email is invalid or the email service is not configured
 * 
 * @example
 * ```ts
 * const result = await authService.sendMagicLink('user@example.com');
 * ```
 */
async function sendMagicLink(email: string, options?: MagicLinkOptions): Promise<AuthResponse> {
  // Implementation
}
```

## Issue Reporting

### Bug Reports

When reporting a bug, please include:

1. A clear and descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment details (OS, browser, library version)

### Feature Requests

When requesting a feature, please include:

1. A clear and descriptive title
2. A detailed description of the proposed feature
3. Why this feature would be useful
4. Any alternatives you've considered
5. Example use cases

---

Thank you for contributing to the Passwordless Authentication Library! Your help is greatly appreciated.

Copyright © 2024 Mahmoud Ashraf (SNO7E) 