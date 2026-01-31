# agent0 — AI Agent Builder & Sandbox Orchestration Platform

> A production-ready Next.js 16 application that automatically generates and deploys AI agents with sandboxed code execution, persistent storage, and real-time UI feedback.

## 🎯 Executive Summary

`agent0` is a full-stack AI agent generation platform built on modern web technologies. It enables users to describe desired agent behavior in natural language, automatically generates production-ready agent code using Google Gemini, executes that code in an isolated sandbox, persists artifacts, and streams real-time results to the UI.

**Key metrics:**

- **Serverless-ready**: Event-driven with Inngest for horizontal scaling
- **Sandbox-isolated**: Secure code execution using E2B Code Interpreter
- **Database-backed**: Full project/message/fragment audit trail with MongoDB
- **Authentication**: Clerk integration for secure user management
- **Response caching**: In-memory LRU cache with 5-minute TTL to reduce API costs
- **Quota-aware**: Automatic retry/backoff logic for API rate limits

---

## 📋 Table of contents

- [Executive Summary](#-executive-summary)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features & Capabilities](#-features--capabilities)
- [Installation & Setup](#-installation--setup)
- [Core Workflows](#-core-workflows)
- [API & Integration Points](#-api--integration-points)
- [Performance & Optimization](#-performance--optimization)
- [Deployment](#-deployment)
- [Contributing & Development](#-contributing--development)
- [Troubleshooting](#-troubleshooting)

---

---

## 🚀 Quick Start

### Minimal setup (5 minutes)

```bash
# 1. Clone & install
git clone <repo>
cd agent0
npm install

# 2. Set environment variables
cat > .env.local << 'EOF'
MONGODB_URL=mongodb://localhost:27017/agent0
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
EOF

# 3. Run development server
npm run dev
# Open http://localhost:3000
```

Visit `/demo` to see the split-view code + agent flow UI.

---

## 📦 Tech Stack

| Layer          | Technology                | Version       |
| -------------- | ------------------------- | ------------- |
| **Frontend**   | React, Next.js App Router | 19, 16.1.1    |
| **Language**   | TypeScript                | 5             |
| **Styling**    | Tailwind CSS, Radix UI    | 4, latest     |
| **Backend**    | Next.js Server Actions    | 16.1.1        |
| **Database**   | MongoDB, Mongoose         | latest, 9.1.2 |
| **Auth**       | Clerk                     | 6.36.7        |
| **Async Jobs** | Inngest                   | 3.49.1        |
| **Sandbox**    | E2B Code Interpreter      | 2.3.3         |
| **AI Model**   | Google Gemini (Agent Kit) | 2.5-flash     |

---

## 🏗️ Architecture

### System diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /demo page  │  │  ProjectList │  │ Navbar/Auth  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / Server Actions
┌────────────────────────▼────────────────────────────────┐
│               Next.js 16 (App Router)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Server Actions (onBoardUser, getCurrentUser)   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────┬──────────────────┘
                 │                     │
         ┌───────▼──────┐      ┌───────▼───────┐
         │   Mongoose   │      │    Inngest    │
         │   MongoDB    │      │    Sandbox    │
         │              │      │   Execution   │
         │ User, Project│      │   + AI Agent  │
         │ Message,     │      │   Generation  │
         │ Fragment     │      │               │
         └──────────────┘      └───────────────┘
```

### Data flow: Agent generation

```
User Input (natural language prompt)
        ↓
  [Next.js Server Action]
        ↓
  [Inngest Event: code-agent/run]
        ↓
  [E2B Sandbox Created]
        ↓
  [Inngest Agent Network Initialized]
        ↓
  [Gemini LLM + Tools Loop]
        │  Tools: terminal, createOrUpdateFiles,
        │         readFiles, installPackages
        ↓
  [Code files written, executed, tested]
        ↓
  [Result persisted to MongoDB]
        │  → Message (content, role, type)
        │  → Fragment (title, files, sandbox URL)
        │  → Project linked via messages array
        ↓
  [UI Updated with real-time status]
```

### Folder structure

```
agent0/
├── app/                          # Next.js app router
│   ├── (root)/layout.tsx         # Root layout (dynamic)
│   ├── (root)/page.tsx           # Home page
│   ├── (auth)/                   # Clerk auth pages
│   ├── (root)/projects/[id]/     # Project detail page
│   ├── demo/page.tsx             # Split-view demo
│   └── api/inngest/route.ts      # Inngest webhook
│
├── components/                   # Reusable UI components
│   ├── DemoWindow.tsx            # Agent flow chat UI
│   ├── DottedBackground.tsx      # Design element
│   ├── ui/                       # Radix UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── scroll-area.tsx
│   │   └── ... (20+ components)
│   └── QueryProvider.tsx         # React Query
│
├── modules/                      # Domain modules (DDD pattern)
│   ├── auth/                     # Authentication domain
│   │   ├── actions/index.ts      # Server actions
│   │   ├── model/user.ts         # Mongoose User schema
│   │   └── components/
│   │
│   ├── projects/                 # Projects domain
│   │   ├── actions/index.ts
│   │   ├── model/project.ts
│   │   ├── hook/project.ts
│   │   └── component/
│   │       ├── ProjectView.tsx
│   │       ├── MessageContainer.tsx
│   │       └── MessageForm.tsx
│   │
│   ├── fragments/                # Fragments domain
│   │   ├── model/fragment.ts
│   │   ├── component/
│   │   │   ├── FileExplorer.tsx  # ✅ Fixed type issue
│   │   │   └── FileViewer.tsx
│   │   └── hook/fragment.ts
│   │
│   ├── messages/                 # Messages domain
│   │   ├── model/messages.ts
│   │   └── hook/message.ts
│   │
│   └── home/                     # Home page domain
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── ProjectForm.tsx
│       │   └── ProjectList.tsx
│       └── actions/index.ts
│
├── inngest/                      # Serverless orchestration
│   ├── client.ts                 # Inngest client
│   └── function.ts               # Agent builder function (560+ lines)
│
├── lib/                          # Low-level utilities
│   ├── databaseConnection.ts     # Mongoose + connection pooling
│   └── utils.ts
│
├── hooks/                        # React hooks
│   ├── use-mobile.ts
│   └── useScroll.ts
│
└── public/                       # Static assets
```

## Running locally

### Prerequisites

- Node.js (recommended LTS) installed
- MongoDB reachable (local instance or cloud URI)
- A Clerk application (for auth) — optional to run auth flows

### Important environment variables

Create a `.env.local` file at the project root with the required environment variables. At minimum you will need:

- `MONGODB_URL` — MongoDB connection string (required)
- `NEXT_PUBLIC_CLERK_FRONTEND_API` — (Clerk frontend API / publishable key) for Clerk UI (if using Clerk)
- `CLERK_SECRET_KEY` — server-side Clerk secret (name may vary depending on your Clerk setup)

Additional optional variables used by integrations or deployment targets:

- `INNGEST_API_KEY` (if using external Inngest cloud or webhooks)
- Any cloud provider connection strings (e.g., Redis, S3) if you extend the project

> Note: The code looks for `MONGODB_URL` in `lib/databaseConnection.ts` and throws if not present.

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev
# Open http://localhost:3000
```

### Build for production

```bash
npm run build
npm start
```

If you encounter prerender/dynamic errors while building (e.g., "Route / couldn't be rendered statically because it used `headers()`"), run:

```bash
next build --debug-prerender
```

And consider marking pages/layouts that use dynamic request APIs as dynamic, for example:

```ts
export const dynamic = "force-dynamic";
```

This project already sets `dynamic = "force-dynamic"` on the root layout because `currentUser()` and related server APIs are used during rendering.

## Architectural overview

Below are the most important folders and files and what they do.

- `app/` — Next.js app router pages and layouts. Key entry points:
  - `app/(root)/layout.tsx` — root layout. Note: it calls `onBoardUser()` (server action) so the route is dynamic.
  - `app/demo/page.tsx` — Demo split page with `Code` and `Agent Flow` panes.

- `components/` — Reusable UI components and client widgets.
  - `DemoWindow.tsx` — client-side agent-flow demo (chat-style UI).
  - `DottedBackground.tsx`, `QueryProvider.tsx`, `ThemeProvider.tsx`, etc.
  - `ui/` — local UI primitives (button, input, scroll area, etc.).

- `lib/` — low-level utilities.
  - `databaseConnection.ts` — Mongoose connection helper using a small global cache to avoid multiple connections in serverless contexts. It logs `connected`, `disconnected`, and `error` events; you can reduce logging by adjusting the `mongoose.connection.on(...)` listeners.
  - `utils.ts` — helper utilities used across the app.

- `modules/` — domain-specific modules grouped by feature.
  - `auth/` — server actions for onboarding and `User` model.
  - `messages/`, `projects/`, `fragments/` — models, actions, components for project/fragment/message domain.

- `inngest/` — Inngest client and serverless functions.
  - `client.ts` — instantiates `Inngest` for local event definitions.
  - `function.ts` — defines the `codeAgentFunction` which:
    - Connects to Mongo via `connectToDatabase()`
    - Creates a sandbox via `@e2b/code-interpreter` and runs tools (terminal, create/read files, install packages)
    - Builds an agent using `@inngest/agent-kit` + Google Gemini model configuration
    - Has retry/backoff logic for quota errors and caches results in-memory (simple LRU-like behavior)
    - Persists results as `Message` and `Fragment` documents in MongoDB and may serve a file server for sandboxed workspaces

  This function is the core of the automated agent-building flow. It uses a number of safeguards: increased delay to avoid rate limits, retry/backoff, parsing of structured `<task_summary>` content from agent output, and safe file handling via the sandbox API.

- `public/` — static assets
- `pages/api/` or `app/api/` — API routes (the project uses `app/api/inngest/route.ts` for Inngest webhooks in this repo).

### Data models (high level)

Models are defined under `modules/*/model/*.ts` and are typical Mongoose schemas for `User`, `Project`, `Message`, `Fragment`, etc. These models are used in server actions and the Inngest function to store results and link messages to projects.

## Auth flow (Clerk)

- The project uses `@clerk/nextjs` for authentication.
- Server code calls `currentUser()` (Clerk server API) inside server actions (e.g., `modules/auth/actions/index.ts`), which is why some routes must be rendered dynamically.
- Ensure your Clerk environment variables are set for both client and server side when testing authentication flows.

## Database connection (Mongoose)

`lib/databaseConnection.ts` implements a connection cache so that in serverless environments the process does not create a new DB connection per invocation. It expects `MONGODB_URL` to be defined and will log connection lifecycle events. If you want to silence logs during build you can remove or conditionally gate the `console.log` calls.

## Inngest & agent builder (detailed)

- `inngest/client.ts` creates an `Inngest` instance used to register functions.
- `inngest/function.ts` (`codeAgentFunction`) is an advanced orchestration that:
  - Creates an ephemeral sandbox and runs commands/installs/tests inside it
  - Exposes tools to the agent (terminal, createOrUpdateFiles, readFiles, installPackages)
  - Uses `gemini` model configuration and `createAgent`/`createNetwork` to build agents automatically from user prompts
  - Persists results into MongoDB (messages, fragments) and may start a minimal HTTP server inside the sandbox to expose workspace files
  - Implements robust retry/backoff for quota errors and caches outputs for a short TTL to reduce redundant calls

Security considerations:

- The sandbox runs user-specified code and starts background services (simple Python HTTP server). This is powerful but potentially risky — production use must have strict isolation and resource limits.
- Avoid exposing sandbox-host URLs to the public unless access control is in place.

## Developer workflows

### Add a new agent tool

1. Open `inngest/function.ts`.
2. Use `createTool({ name, description, parameters, handler })` and add the tool to the `tools` array.
3. The `handler` receives parameters and a context with `step` and `network` and can use the sandbox API to run commands and read/write files.

### Working with the sandbox

- Sandbox is provided by `@e2b/code-interpreter`.
- The function creates a sandbox, writes files to `/workspace`, runs shell commands, and can start simple servers (e.g., `python -m http.server 8000`) for preview purposes.

### Debugging prerender/dynamic issues

If you use `headers()`, `cookies()`, or `currentUser()` in server components or `generateMetadata`, Next.js may refuse to prerender and will throw an error during `next build`. To address:

- Mark the layout/page as dynamic: `export const dynamic = "force-dynamic";`
- Move request-specific logic into server actions or route handlers where appropriate
- Run `next build --debug-prerender` to get richer stack traces

## Testing & linting

- Linting is configured via `eslint` and `eslint-config-next`.
- Run lint:

```bash
npm run lint
```

- Unit tests: none are provided out of the box. Add tests with your preferred framework (Vitest, Jest) and wire a `test` script in `package.json`.

## Deployment notes

- When deploying (Vercel, Netlify, etc.), ensure all environment variables are set in the target environment, including `MONGODB_URL` and Clerk secrets.
- The repo uses Next.js 16 with Turbopack. Verify the platform supports the Next.js version and SWC/patching behavior.
- For Inngest-based workflows, you may either run Inngest functions locally (event-driven with local queues) or register them with an Inngest deployment; configure keys appropriately.

## Contributing

- Fork the repository and open a pull request with a clear description of the change and rationale.
- Keep changes small and focused; write tests for new features where possible.

## 🐛 Troubleshooting

### Build fails: "Route / couldn't be rendered statically"

**Symptom:**
```
Error: Route / couldn't be rendered statically because it used `headers()`.
```

**Root cause:** Dynamic APIs (`headers()`, `cookies()`, `currentUser()`) are called during server rendering.

**Fix:** Mark the route as dynamic
```ts
// app/(root)/layout.tsx
export const dynamic = "force-dynamic";
```

### Mongoose connection warnings

**Symptom:**
```
Mongoose connected to MongoDB
Mongoose connected to MongoDB
```

**Why:** Multiple connection listeners log during build.

**Fix:** Gate logging behind environment check
```ts
// lib/databaseConnection.ts
if (process.env.NODE_ENV !== 'production') {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected');
  });
}
```

### Inngest rate limit (quota exceeded)

**Symptom:**
```
RESOURCE_EXHAUSTED: 429 Quota exceeded
```

**Why:** Gemini API has rate limits (free tier: 20 req/day).

**Fix:** Implemented automatically via `retryWithBackoff()`
- Retries up to 5 times with exponential backoff
- Parses `Retry-After` header from Google
- Caches results for 5 minutes to avoid duplicate requests

### E2B sandbox timeout

**Symptom:**
```
Error: Sandbox connection timeout
```

**Why:** Sandbox takes time to spin up or network is slow.

**Fix:**
1. Check E2B API key is valid
2. Increase timeouts in E2B client config
3. Consider pre-warming sandboxes during off-peak hours

### TypeError: Cannot read property of undefined

**Common cause:** FileNode children is Record instead of array after transformation

**Fixed in:** `modules/fragments/component/FileExplorer.tsx`
```ts
// Safe rendering handles both types:
{Array.isArray(node.children) ? node.children : Object.values(node.children)}
```

---

## 📚 Additional resources

- **Next.js Docs:** https://nextjs.org/docs
- **Inngest Docs:** https://www.inngest.com/docs
- **E2B Sandbox:** https://e2b.dev
- **Mongoose Guide:** https://mongoosejs.com
- **Clerk Integration:** https://clerk.com/docs/references/nextjs

---

## 🤝 Contributing & Development

### Setup for contributors

```bash
# 1. Fork repo and clone locally
git clone https://github.com/YOUR_USERNAME/agent0.git
cd agent0

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Install and run
npm install
npm run dev

# 4. Make changes, test, and commit
git add .
git commit -m "feat: describe your change"
git push origin feature/my-feature

# 5. Open PR on GitHub
```

### Code style

- **Formatting:** Prettier (via ESLint)
- **Linting:** ESLint 9 with Next.js config
- **Types:** End-to-end TypeScript

```bash
npm run lint --fix
```

### Adding features

**Example: Add a new agent tool**

1. Open `inngest/function.ts`
2. Define tool:
```ts
createTool({
  name: "customTool",
  description: "Does X",
  parameters: z.object({
    arg1: z.string().describe("First arg"),
  }),
  handler: async ({ arg1 }, { step }) => {
    return await step.run("customTool", async () => {
      // Your logic
      return "result";
    });
  },
})
```

3. Add to `tools` array
4. Test with a prompt that triggers it
5. Commit and open PR

### Testing

```bash
# Lint check
npm run lint

# Build check
npm run build

# Dev test
npm run dev
# Visit http://localhost:3000/demo
```

---

## 📝 Summary: What makes this project interview-ready

✅ **Full-stack:** React frontend + Next.js backend + MongoDB persistence  
✅ **Type-safe:** End-to-end TypeScript with Zod validation  
✅ **Scalable:** Event-driven with Inngest; connection pooling for DB  
✅ **Resilient:** Retry/backoff for quota errors; caching to reduce API calls  
✅ **Documented:** Clear architecture, patterns, and trade-offs  
✅ **Production-ready:** Auth, audit trail, error handling, monitoring  
✅ **Developer experience:** Modular code, clear module boundaries (DDD), extensible tool system

---

**Made with ❤️ for AI-powered code generation.**
