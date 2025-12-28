# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a peer feedback platform for students and professors at HTWG Konstanz. The core workflow:

1. **Create Feedback**: Registered users can create feedback for other registered users
2. **AI Screening**: Feedback is automatically screened for offensive, discriminatory, or inappropriate content
3. **Constructive Rewriting**: AI reformulates critical but impolite feedback into more constructive language while preserving the core message
4. **Preview Changes**: Users can review AI modifications and choose to approve or discard the rewritten version
5. **Feedback Delivery**: Reviewed feedback is presented to the recipient privately
6. **Privacy Control**: Recipients decide whether to keep feedback private or publish it publicly
7. **Social Engagement**: Published feedback can receive likes/thumbs up from other users to show agreement

The platform facilitates constructive peer feedback in educational settings while giving recipients control over their feedback visibility.

### User Groups

- **Student**: University students giving/receiving peer feedback
- **Professor**: Faculty members
- **HTWG Employee**: University staff members
- **Lecturer (Lehrbeauftragte)**: External lecturers

### Design Language

- **Aesthetic**: Minimalistic, black and white color scheme
- **UI Framework**: Shadcn UI components (New York style)
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run Next.js linter
```

## Architecture

This is a Next.js 15 application using the App Router with React 19 and Supabase as the backend.

### Project Structure

- `app/` - Next.js App Router pages and layouts
  - `layout.js` - Root layout with Geist font configuration
  - `page.js` - Homepage (server component fetching todos from Supabase)
- `utils/supabase/` - Supabase client utilities
  - `client.ts` - Browser client for client components
  - `server.ts` - Server client for server components with cookie handling
- `components/ui/` - Shadcn UI components
- `lib/utils.js` - Utility functions (cn for className merging)

### Key Technical Details

**Next.js Configuration:**
- App Router (Next.js 15)
- Path aliases configured via `jsconfig.json`: `@/*` maps to root directory
- Uses Geist and Geist Mono fonts from Google Fonts

**Supabase Integration:**
- Two separate client implementations for client/server components
- Server client handles cookie-based authentication with Next.js cookies API
- Client: `utils/supabase/client.ts` - uses `createBrowserClient`
- Server: `utils/supabase/server.ts` - uses `createServerClient` with cookie handlers

**Environment Variables Required:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Shadcn UI:**
- Style: "new-york"
- Uses TypeScript for components
- Icon library: Lucide
- Components stored in `@/components/ui`
- Tailwind config uses CSS variables with neutral base color
- Design language: Minimalistic black and white aesthetic
- Add new components: `npx shadcn@latest add <component-name>`

**Styling:**
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Global styles in `app/globals.css`
- `cn()` utility function combines clsx and tailwind-merge for className handling

### Component Patterns

**Server Components (default):**
```typescript
import { createClient } from "@/utils/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("table").select();
  // ...
}
```

**Client Components:**
```typescript
"use client"
import { createClient } from "@/utils/supabase/client";

export default function ClientComponent() {
  const supabase = createClient();
  // ...
}
```

### Core Features (from GitHub Issues)

**Authentication & User Management** (Issue #30):
- Registration and login
- Logout functionality
- Password reset
- Profile management (profile picture, password editing)

**Feedback Management** (Issue #24):
- Create feedback with text input and person reference
- Post feedback publicly (requires recipient approval)
- View feedback postings in chronological feed
- Private viewing area for received feedback
- Separate views for own feedback vs. received feedback

**AI & Moderation** (Issue #45):
- Automatic content screening for offensive/discriminatory language (Issue #46)
- Constructive reformulation of critical feedback (Issue #47)
- Preview comparison view showing original vs. AI-modified version (Issue #48)
- Approval/rejection workflow for AI changes

**Interaction & Notifications** (Issue #37):
- Notification system
- Search functionality for feedback
- Filter by faculty (Fakultäten)

**Privacy & Administration** (Issue #43):
- Data export functionality
- Data deletion/hiding options
- User administration

### Important Conventions

1. **Supabase Clients**: Always use the appropriate client based on component type (client vs server)
2. **Shadcn Components**: Use pre-defined Shadcn components without modification unless necessary for coherent design
3. **Path Aliases**: Use `@/` prefix for imports (e.g., `@/components/ui/button`)
4. **Server Components**: Default to server components; only use client components when needed for interactivity
5. **AI Integration**: All feedback must go through AI screening and optional reformulation before delivery
6. **Code Cleanup**: Actively cleanup declined or changed code during sessions. When changes are rejected, deprecated, or no longer used, immediately remove the dead code to maintain a clean codebase. Do not leave commented-out code or unused implementations lingering in the project.

## GitHub Repository

- **Repository**: Code-with-heart/code-with-heart (MonoRepo)
- **App Location**: `/code-with-heart-app` subdirectory
- **Issue Tracking**: Active development tracked via GitHub issues with user stories
- **Wiki**: Limited content; check Miro and shared Google Docs for additional documentation
