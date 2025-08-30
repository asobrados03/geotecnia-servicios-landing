# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React landing page for "Geotecnia y Servicios" (G&S), a geotechnical engineering company. The project is built with modern web technologies and configured with Lovable.dev for collaborative development.

## Technology Stack

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19 with React SWC plugin
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (comprehensive component library based on Radix UI)
- **Routing**: React Router DOM 6.30.1
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack React Query for server state
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Deployment**: Lovable platform integration

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

### Project Structure
```
src/
├── assets/           # Static assets (images, logos)
├── components/       # React components
│   └── ui/          # Reusable UI components (shadcn/ui)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configurations
├── pages/           # Page components
└── main.tsx         # Application entry point
```

### Key Architectural Patterns

**Component-Based Architecture**
- Uses functional components with hooks
- shadcn/ui provides a consistent design system
- Components follow the compound component pattern (e.g., Card, CardHeader, CardContent)

**Styling Strategy**
- Tailwind CSS for utility-first styling
- CSS custom properties for theme variables (brand colors, shadows)
- Component variants using `class-variance-authority`
- Responsive design with mobile-first approach

**State Management Approach**
- Local component state with `useState` and `useRef`
- React Query for server state and caching
- Form state managed by React Hook Form
- Toast notifications via custom toast system

**Type Safety**
- Strict TypeScript configuration with path mapping (`@/*` aliases)
- Zod for runtime schema validation
- Type-safe component props and event handlers

## Development Workflow

### Adding New Components
1. Use shadcn/ui CLI for consistent component structure:
   ```bash
   npx shadcn-ui@latest add [component-name]
   ```
2. Components are added to `src/components/ui/` with proper TypeScript types
3. Import using `@/components/ui/[component-name]` alias

### Styling Guidelines
- Use Tailwind utility classes for styling
- Custom properties are defined in CSS for theme consistency:
  - `--brand-*` for brand colors
  - `--shadow-*` for elevation effects
- Responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Form Handling Pattern
```typescript
const form = useForm<FormSchema>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});

const onSubmit = (values: FormSchema) => {
  // Handle form submission
  toast({
    title: "Success",
    description: "Form submitted successfully"
  });
};
```

## Build Configuration

### Vite Configuration
- Custom server config (host: "::", port: 8080)
- Path aliases configured for clean imports
- React SWC for fast compilation
- Lovable tagger plugin for development mode

### TypeScript Setup
- Project references for optimal build performance
- Path mapping for `@/*` imports to `src/*`
- Relaxed strict mode settings for development flexibility

### Tailwind Integration
- Custom theme extensions with CSS variables
- shadcn/ui component styling compatibility
- Animation utilities included via `tailwindcss-animate`

## Key Features Implementation

### Landing Page Structure
- **Hero Section**: Interactive background effects with mouse tracking
- **Services Grid**: Dynamic service cards with icons from Lucide React
- **Process Steps**: Multi-step workflow visualization
- **Contact Form**: Validated form with toast feedback

### Interactive Elements
- Smooth scrolling navigation
- Hover effects on service cards
- Mouse-tracking gradient effects in hero section
- Responsive navigation with mobile considerations

### Asset Management
- Images stored in `src/assets/`
- Dynamic favicon setting from project logo
- Optimized image loading in Vite

## Testing and Quality Assurance

### Linting Configuration
- ESLint with TypeScript support
- React hooks linting rules
- React refresh for development
- Unused variables checking disabled for development flexibility

## Deployment and Integration

### Lovable Platform
- Automatic deployment via Lovable.dev
- Git integration for version control
- Environment-specific builds supported
- Domain configuration available through platform

### Performance Considerations
- React SWC for fast compilation
- Code splitting via React Router
- Optimized asset bundling with Vite
- Lazy loading for better initial page load

## Common Development Tasks

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route in `src/App.tsx` above the catch-all route
3. Update navigation links if needed

### Customizing Theme
1. Modify CSS custom properties in `src/index.css`
2. Update Tailwind config in `tailwind.config.ts`
3. Use design tokens consistently across components

### Managing Dependencies
- UI components: Use shadcn/ui CLI for consistency
- Utilities: Add to `src/lib/utils.ts` using the `cn()` utility
- Icons: Import from `lucide-react` package

### Environment-Specific Builds
- Use `npm run build:dev` for development builds
- Production builds automatically optimize for performance
- Lovable integration handles deployment environments

## Important Notes

- The project uses Bun lockfile (`bun.lockb`) alongside npm lockfile
- Development server runs on port 8080 (configured in vite.config.ts)
- All components use the `@/` path alias for clean imports
- Toast notifications are global and managed through the custom hook system
- The codebase follows React 18 patterns with concurrent features support
