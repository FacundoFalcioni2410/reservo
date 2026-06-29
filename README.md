# Reservo

Appointment scheduling platform for service businesses. Each tenant gets a public booking page where clients can self-book, while admins and professionals manage everything from a shared dashboard.

## What it does

- **Public booking page** — clients visit `/{slug}`, pick a service, professional, and time slot, and book without an account
- **Admin dashboard** — weekly calendar view, booking management, client history, professional/branch/service configuration
- **Professional portal** — each professional logs in to see only their own schedule and clients
- **Events** — recurring or one-off group events with attendee registration, confirmation tokens, and waitlist support
- **Google Calendar sync** — bookings and event occurrences sync automatically to each professional's calendar
- **Email notifications** — confirmation emails on booking and event registration, customizable per tenant via templates
- **Multi-branch** — branches with independent working hours that inherit from the tenant when not overridden

## Tech stack

- **Next.js 16** (App Router) with React 19
- **PostgreSQL** via Prisma ORM (`@prisma/adapter-pg`)
- **Tailwind CSS v4**
- **Resend** for transactional email
- **Google Calendar API** for calendar sync
- **Sentry** for error tracking

## Getting started

**Prerequisites:** Node.js 20+, PostgreSQL database

```bash
npm install
```

Copy the environment file and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
RESEND_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Run migrations and start the dev server:

```bash
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.tsx                  # Landing page
  [slug]/                   # Public booking and event pages
  dashboard/                # Admin and professional dashboards
    bookings/               # Calendar + booking list
    professionals/          # Team management
    services/               # Service catalog
    branches/               # Branch management
    clients/                # Client history
    settings/               # Tenant config, email templates, integrations
    eventos/                # Event management
  (auth)/                   # Login, signup, invite flows
  actions/                  # Server actions
  lib/                      # Shared utilities (session, email, ICS, etc.)
prisma/
  schema.prisma
  migrations/
```

## Multi-tenancy

Every business is a `Tenant` with a unique `slug`. All data (users, bookings, services, events) is scoped to a tenant. The admin creates the tenant on signup; professionals are invited by email and set their own password via a token link.
