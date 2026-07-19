# Contributing to Gopal Cake Shop ERP

Welcome! This document defines the engineering standards for developing UI components and backend services in this repository. By following these rules, we ensure the ERP remains maintainable, accessible, and high-performing.

## 1. How to Create Components
- **Dependency Order**: Always use existing primitives (Atoms) before building custom components.
- **Component Lifecycle**: New components should only be created when existing components cannot satisfy the business requirement. Existing components should be extended before introducing duplicates.
- **Single Responsibility**: One component = one responsibility. Avoid "God Components" that combine unrelated behaviors.
- **No Hardcoded Tokens**: Never use raw hex colors. Use CSS variables defined in `globals.css` (e.g. `bg-primary`, `text-destructive`).
- **No Default Exports**: Use named exports for reusable components. Avoid default exports except where required by the framework (e.g., Next.js pages, layouts, route handlers).
- **Immutability**: Never mutate props. Always derive new values.

## 2. Folder Conventions
- A component gets its own folder **only if** it has more than one supporting file (types, tests, stories, hooks). Otherwise, it exists as a single file (e.g., `Badge.tsx`).
- **File Naming**: 
  - Components: `PascalCase` (e.g. `Button.tsx`)
  - Hooks: `camelCase` (e.g. `useOrder.ts`)
  - Utilities: `camelCase` (e.g. `formatCurrency.ts`)
  - Constants: `UPPER_SNAKE_CASE` (e.g. `ORDER_STATUS_CONFIG`)

## 3. Testing Requirements
Every reusable component must include:
- [ ] Render test
- [ ] Accessibility test
- [ ] Keyboard interaction test
- [ ] Disabled state test
- [ ] Loading state test (if applicable)
- [ ] Theme test (Dark Mode / Light Mode)

## 4. Commit Message Format
We follow standard conventional commits to generate automated changelogs:
- `feat:` New feature
- `fix:` Bug fix
- `ui:` Design system or UI component update
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `docs:` Documentation changes

## 5. Pull Request Checklist
Before requesting a review, verify:
- [ ] **Strict TypeScript**: No `any`, no `@ts-ignore`.
- [ ] **Linting**: No `eslint-disable` unless explicitly justified.
- [ ] It renders correctly in **Light Theme**, **Dark Theme**, and **Mobile**.
- [ ] Forms use `react-hook-form` + `zod` for validation.
- [ ] **Performance**: If a heavy dependency is introduced, it must be justified in the PR.
- [ ] `ErrorBoundary` is wrapped around critical data sections.
- [ ] Component is documented in `/design-system` showcase.
