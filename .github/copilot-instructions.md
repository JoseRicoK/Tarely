# AI Coding Assistant Instructions for TareAI

## Project Overview
**TareAI** is a modern task management application with AI integration. It enables users to create workspaces, manage tasks with AI-generated subtasks, collaborate in real-time, and organize work via Kanban boards, calendars, and notes.

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI (GPT-5-mini for task generation)
- **Email**: Resend (confirmations & notifications)
- **Styling**: Tailwind CSS 4, Radix UI, framer-motion

## Architecture Patterns

### 1. Store Abstraction Layer
The codebase uses a **pluggable store pattern** to abstract data persistence:
- `src/lib/store.ts` - Main facade that selects backend via `USE_SUPABASE` flag
- `src/lib/supabase-store.ts` - Cloud backend (default)
- `src/lib/json-store.ts` - Local fallback (development/offline)
- **Key insight**: Database rows use `snake_case`, app uses `camelCase`. Mapping functions (`mapWorkspaceFromDB`, `mapTaskFromDB`) handle conversion.

### 2. Authentication & Authorization
- **Middleware** (`src/middleware.ts`): Protects routes pre-render via `createServerClient`
  - Public routes: `/login`, `/registro`, `/auth/*`, `/` (landing)
  - Protected routes: `/app/*`, `/workspace/*`, `/calendar/*`, `/dashboard/*`, `/notes/*`
  - Redirect logic: Authenticated users on `/login` → `/app`; Unauthenticated on protected routes → `/login`
- **RLS Policies**: Supabase enforces row-level security; all DB operations filtered by `auth.uid()`
- **Important**: Do NOT remove `auth.getUser()` call in middleware—it validates the session

### 3. Route Structure
- `src/app/(auth)/` - Public authentication routes (layout applies dark theme)
- `src/app/(app)/` - Protected application routes (Kanban, calendar, notes, dashboard, settings)
- `src/app/(marketing)/` - Public landing page, privacy policy, changelog
- `src/app/api/` - RESTful endpoints (grouped by domain: auth, tasks, workspaces, notes, sections, etc.)

### 4. AI Integration
**File**: `src/lib/ai.ts`
- Uses OpenAI's Structured Responses API with Zod schema validation
- **AI prompts** (`src/lib/prompts.ts`): Include workspace instructions + context
- **Example**: AI generates tasks with validation schema `AIResponseSchema` (min 1, max 20 tasks)
- **Recurrence**: Parsed from AI output into `RecurrenceRule` (daily/weekly/monthly/yearly)
- **Context**: Always pass workspace instructions + current Spain date (`getSpainDate()`) for timezone consistency

### 5. Database & Data Types
**Core types** (`src/lib/types.ts`):
- `Workspace` - Container for tasks, has `instructions` (for AI context), `icon`, `color`
- `Task` - Has `workspaceId`, `sectionId`, `importance` (1-10), `recurrence`, `dueDate`
- `Subtask` - Ordered, toggleable completion
- `WorkspaceSection` - System or custom sections (Backlog, In Progress, Done by default)
- `TaskAssignee` - Tracks who's assigned to a task

**Database Setup**: Run scripts in order (see `README.md`):
1. `schema.sql` - Base tables
2. `auth-schema.sql` - User/profile setup
3. Feature schemas (email, sections, subtasks, sharing, etc.)

### 6. Email System
- **Provider**: Resend (`src/lib/email.ts`)
- **Templates**: `src/lib/email-templates.ts` (generate HTML for confirmations, invitations, etc.)
- **Endpoint**: `POST /api/auth/send-confirmation-email`
- **Configuration**: See `CONFIGURACION_EMAIL.md` and `INSTALACION_EMAIL.md`

## Development Workflows

### Build & Run
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Run production build
npm run lint      # Run ESLint
```

### API Route Pattern
All API routes validate the authenticated user first:
```typescript
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Fetch data filtered by user via RLS...
  return NextResponse.json(data);
}
```

### Component Organization
- `src/components/ui/` - Radix UI wrapped components (button, dialog, select, etc.)
- `src/components/tasks/` - Task-specific UI (cards, forms, menus)
- `src/components/notes/` - Note editor (Tiptap integration)
- `src/components/workspace/` - Workspace selection & settings
- `src/components/auth/` - Login/signup forms

### State Management
- **Client state**: React hooks + `useState`, `useReducer`
- **Server state**: Direct Supabase queries in Server Components / API routes
- **Styling state**: CSS variables + Tailwind (theme stored in localStorage via `next-themes`)

## Common Patterns

### 1. Creating a New Task Type
```typescript
// types.ts
export interface Task {
  id: string;
  title: string;
  // Add new field...
}

// supabase-store.ts
function mapTaskFromDB(row: TaskRow): Task {
  // Add mapping for new field
}

// API route
export async function POST(request: NextRequest) {
  const { title, /* new field */ } = await request.json();
  // Validate, then insert...
}
```

### 2. Adding an API Endpoint
- Create `src/app/api/[resource]/route.ts` (or `[resource]/[id]/route.ts`)
- Always validate `auth.getUser()` first
- Return JSON with proper status codes (200, 201, 400, 401, 404, 500)
- Document with JSDoc comments

### 3. Protecting a Route
- Route under `(app)/` automatically protected by middleware
- For conditional access, check RLS policies in database
- Example: only workspace owner can delete it (enforced by trigger in `schema.sql`)

### 4. Adding Email Notifications
- Create template in `email-templates.ts` (returns HTML string)
- Call Resend API in route or server action
- Pass user email + context variables to template

## File Naming & Conventions

| Type | Location | Pattern |
|------|----------|---------|
| Page components | `src/app/(auth)/login/page.tsx` | PascalCase, export default |
| API routes | `src/app/api/tasks/route.ts` | Named exports (GET, POST, etc.) |
| Utilities | `src/lib/utils.ts` | camelCase functions |
| Types | `src/lib/types.ts` | PascalCase interfaces/types |
| Components | `src/components/tasks/TaskCard.tsx` | PascalCase, default export |
| Styles | Tailwind classes + `globals.css` | No separate CSS files |

## Important Gotchas & Tips

1. **Timezone handling**: Always use `getSpainDate()` for date generation (Spain TZ hardcoded)
2. **Database schema changes**: Create migration file in `scripts/`, don't modify `schema.sql` directly
3. **RLS policies**: Every table must have RLS enabled; test with different users
4. **Recurrence calculation**: Complex business logic in prompts—verify AI output matches `RecurrenceRule`
5. **Image optimization**: Use Next.js `<Image>` component with defined width/height
6. **Error handling**: Return meaningful error messages to client (check API docs for error codes)
7. **Drag & drop**: Uses `dnd-kit`; see `src/components/tasks/` for examples
8. **Email encoding**: Resend expects HTML; use `email-templates.ts` helpers

## Key Files to Review

- `src/middleware.ts` - Route protection & auth flow
- `src/lib/store.ts` - Data layer abstraction
- `src/lib/ai.ts` - AI prompts & validation
- `src/lib/types.ts` - Data contracts (understand Task, Workspace structure)
- `src/app/api/tasks/route.ts` - CRUD example
- `src/app/(app)/dashboard/page.tsx` - Main UI example
- `scripts/schema.sql` - Database schema & RLS policies

## Testing Tips

- **Supabase local setup**: Use `supabase start` for local PostgreSQL + Auth
- **AI responses**: Log `console.log()` in `/api/ai/*` endpoints to debug schema validation
- **Email preview**: Check Resend dashboard or use Mailtrap for testing
- **RLS debugging**: Query directly in Supabase SQL editor with different users
