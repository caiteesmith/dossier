# Dossier

A CRM built by a wedding photographer who got tired of paying for three tools that still didn't cover everything.

Dossier is a full-stack wedding photography studio management app: handling leads, bookings, contracts, timelines, shot lists, vendor contacts, questionnaires, and day-of exports in one place. No gallery delivery (that's a whole product on its own), no bloated feature sets designed for generic service businesses. Just the stuff a photographer actually needs, designed around how wedding days actually work.

---

## Why this exists

The current landscape is frustrating. Dubsado handles contracts and invoices well but its day-of tooling is nonexistent. Pixieset delivers galleries beautifully but doesn't have enough business ops. HoneyBook is polished but generic. Táve is photographer-specific but dated. Nobody owns the full workflow from first inquiry to delivered gallery, and nobody has ever built something that understands that the most important document you bring to a wedding isn't a contract, it's a one-page sheet with the timeline, vendor contacts, and shot list that you can hand to your second shooter at 8am.

Dossier is an attempt to fix that.

---

## What it does

**Lead pipeline**: Kanban-style board from first inquiry through booking. Track source, budget, venue, follow-up dates. Convert a lead to a booking in one click.

**Booking dashboard**: The hub for every wedding. Date countdown, milestone progress, outstanding tasks, light and golden hour times, and quick links to everything else.

**Tasks**: Auto-generated milestone checklist on booking creation (send contract, collect deposit, build shot list, confirm second shooter, etc.) plus manual tasks per wedding.

**Questionnaire**: A full pre-wedding questionnaire modeled after real photographer workflows: day-of locations, timeline slots, portrait details, family shot combinations, vendor info, restrictions, expectations. Responses feed directly into the day-of sheet.

**Timeline builder**: Block-by-block wedding day schedule with golden hour calculation based on venue coordinates and date.

**Shot list**: Grouped formals builder with drag-and-drop reordering. Bride's family, groom's family, wedding party, just the two of them.

**Vendor sheet**: All day-of contacts in one tappable list. Planner, DJ, florist, venue coordinator, officiant, with phone and email links.

**Day-of sheet**: Four-page print-ready PDF export: cover page with engagement photo, timeline, shot list with printable checkboxes, and a notes page with blank lines for the day. Export directly from the browser. Bring it to the wedding or send it to your second shooter.

---

## Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast DX, rich ecosystem for drag-and-drop (dnd-kit) |
| Styling | Tailwind CSS v4 | Utility-first, no design system overhead |
| Server state | TanStack Query | Clean loading/error states, optimistic updates |
| Routing | React Router v6 | Standard, works well with Netlify |
| Backend | ASP.NET Core Web API (.NET 8) | Strong typing end-to-end, great for complex business logic |
| Database | PostgreSQL via Supabase | Managed, free tier is plenty to start, great dashboard for debugging |
| Auth | Supabase Auth | JWT-based, magic links, zero auth boilerplate |
| Frontend hosting | Netlify | Already in use, easy deploys |
| API hosting | Railway | Generous free tier, straightforward .NET support |

The auth flow: Supabase handles login and returns a JWT. React attaches it as a Bearer token on every API request. ASP.NET Core validates it against the Supabase JWT secret. Row-level security on the database ensures photographers can only ever see their own data, even if something goes wrong at the API layer.

---

## Project structure

```
dossier/
├── frontend/                  # React + Vite
│   └── src/
│       ├── components/
│       │   ├── booking/       # DayOfSheet PDF export
│       │   ├── layout/        # AppShell, Sidebar
│       │   └── ui/            # Badge, Card, Button, TasksSnapshot
│       ├── data/              # Sample data, questionnaire template
│       ├── hooks/             # useData (React Query hooks)
│       ├── lib/               # Supabase client, Axios instance, Auth context
│       ├── pages/
│       │   ├── booking/       # BookingDetailPage + tab components
│       │   ├── DashboardPage
│       │   ├── LeadsPage
│       │   └── BookingsPage
│       └── types/             # Shared TypeScript interfaces
│
├── Dossier.Api/               # ASP.NET Core Web API
│   ├── Controllers/           # LeadsController (more coming)
│   ├── Data/                  # EF Core DbContext
│   ├── Extensions/            # ClaimsPrincipal helpers (JWT → photographer ID)
│   └── Models/                # EF Core entities
│
└── supabase/
    └── migrations/            # SQL schema + RLS policies
```

---

## Getting started

### Prerequisites

- Node 20+
- .NET 8 SDK
- A Supabase account and project

### 1. Database

Run migrations against your Supabase project in order:

```bash
# Via Supabase dashboard SQL editor, or:
supabase db push
```

Files: `supabase/migrations/001_initial_schema.sql`, `002_rls.sql`

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
# http://localhost:5173
```

### 3. Backend

```bash
cd Dossier.Api
cp appsettings.example.json appsettings.Development.json
# Fill in ConnectionStrings:Default and Supabase:JwtSecret
dotnet restore
dotnet run
# http://localhost:5000
# Swagger: http://localhost:5000/swagger
```

### Environment variables

**Frontend** (`.env.local`):

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `VITE_API_URL` | `http://localhost:5000` in dev |

**Backend** (`appsettings.Development.json`):

| Variable | Where to find it |
|---|---|
| `ConnectionStrings:Default` | Supabase → Settings → Database → Connection string |
| `Supabase:JwtSecret` | Supabase → Settings → API → JWT Secret |

---

## Development notes

### Sample data mode

The frontend currently runs on static sample data, no backend required to see the UI. All data hooks in `src/hooks/useData.ts` have `// TODO` comments showing exactly where to swap in real API calls. The shape of the sample data matches the API response shape exactly, so the swap is mechanical.

### Adding a new booking tab

1. Create the component in `src/pages/booking/`
2. Add the tab to the `TABS` array in `BookingDetailPage.tsx`
3. Add the render case in the tab content switch

### Adding a new API endpoint

1. Add the model to `Dossier.Api/Models/Models.cs`
2. Add the DbSet to `DossierDbContext.cs`
3. Create a controller in `Dossier.Api/Controllers/`
4. Add the corresponding SQL migration
5. Add RLS policy to `002_rls.sql`
6. Wire up the hook in `src/hooks/useData.ts`

---

## Roadmap

### Phase 1: Core UI (current)
- [x] Lead pipeline (kanban)
- [x] Booking dashboard with task tracking
- [x] Timeline builder
- [x] Shot list builder
- [x] Vendor sheet
- [x] Pre-wedding questionnaire template
- [x] Day-of PDF export (4-page: cover, timeline, shot list, notes)

### Phase 2: Client portal
- [ ] Magic-link client login via `portal_token`
- [ ] Couple-facing questionnaire submission
- [ ] Read-only timeline and vendor sheet view

### Phase 3: Business ops
- [ ] Contract templates + e-sign
- [ ] Invoices + payment schedules
- [ ] Stripe integration
- [ ] CODB calculator (gear depreciation, insurance, editing time)
- [ ] Mileage and tax tracking

### Phase 4: Intelligence
- [ ] AI blog post generator (pull couple name, venue, weather, timeline → draft a wedding recap post)
- [ ] Weather forecast widget on booking dashboard
- [ ] Sunset/golden hour auto-calculation from venue coordinates
- [ ] Business analytics (conversion rate, revenue by package, referral sources)
- [ ] Gallery delivery (phase of its own)

---

## A note on the PDF export

The day-of sheet is generated entirely in the browser using a print window; no server-side rendering, no PDF library dependencies. The print window receives the styled HTML, loads the fonts, and immediately triggers the browser print dialog. "Save as PDF" gives you a clean, letter-sized document.

This means the PDF inherits whatever fonts the browser has cached. If you're printing offline at a venue with spotty WiFi, load the booking detail page once while connected and the Google Fonts will be cached. The PDF will still render correctly.

Logo upload is on the roadmap. For now the cover page shows a placeholder.

---

## Contributing

This is a personal project built for real use. If you're a photographer-developer who has opinions about what's missing, open an issue. If you're a developer who wants to contribute, the most useful areas right now are Phase 2 (client portal) and the timeline/shot list drag-and-drop UX.

---

*Built with React, ASP.NET Core, Supabase, and eight years of standing at the back of ceremonies wondering why there wasn't better software for this.*