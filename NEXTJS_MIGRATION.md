# JAMB Quest - Next.js Migration

## Overview
This is the Next.js migration branch for JAMB Quest. The project has been successfully converted from a Vite-based setup to Next.js 15.

## What Changed

### Configuration Files
- ✅ `next.config.ts` - Next.js configuration
- ✅ `tsconfig.json` - Updated for Next.js
- ✅ `package.json` - Updated with Next.js dependencies
- ✅ `postcss.config.mjs` - PostCSS configuration
- ✅ `.eslintrc.json` - ESLint configuration for Next.js
- ✅ `.prettierrc.json` - Prettier configuration

### App Structure
- ✅ `app/layout.tsx` - Root layout with providers
- ✅ `app/page.tsx` - Home page
- ✅ `app/globals.css` - Global styles with Tailwind
- ✅ `app/dashboard/page.tsx` - Dashboard page
- ✅ `app/api/trpc/[trpc]/route.ts` - tRPC API route handler

### Library Setup
- ✅ `lib/trpc.ts` - tRPC client configuration
- ✅ `lib/query-client.ts` - React Query configuration
- ✅ `components/providers.tsx` - Root providers (tRPC, React Query, Theme)

### Server/Database
- ✅ `server/api/trpc.ts` - tRPC context and router setup
- ✅ `server/api/root.ts` - Main tRPC router
- ✅ `server/db/index.ts` - Database connection
- ✅ `server/db/schema.ts` - Drizzle ORM schema

## Key Features
- 🚀 Next.js 15 with App Router
- 🎨 Tailwind CSS 4 with Vite plugin replaced by built-in support
- 📊 tRPC for type-safe API routes
- 🗄️ Drizzle ORM for database
- 🎯 React Query for state management
- 🌙 Dark mode support with next-themes
- 📱 PWA ready

## Next Steps
1. Install dependencies: `pnpm install`
2. Set up environment variables in `.env.local`
3. Migrate database: `pnpm db:push`
4. Start development: `pnpm dev`
5. Migrate client components from Vite structure
6. Set up API routes
7. Configure authentication

## Environment Variables Needed
```
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
NODE_ENV=development
```

## Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linter
- `pnpm format` - Format code with Prettier
- `pnpm check` - Type check
- `pnpm db:push` - Push database schema
