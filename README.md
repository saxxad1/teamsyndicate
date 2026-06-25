# Team Syndicate Fund Management System

Internal web app for tracking Team Syndicate member funds, monthly contributions, dues, projects, profit/loss, and transactions.

## MVP Included

- Supabase login for admin and member roles
- Dashboard with fund balance, collection, profit/loss, project, and recent transaction summary
- Member add/edit/delete, profile, payment history, total paid, and total due
- Monthly contribution period creation with paid/unpaid/partial tracking
- Project add/list/detail/update/close with automatic profit/loss calculation
- Transaction add/edit/delete for manual records plus auto-generated contribution/project records
- Reports for monthly collection, member payments, dues, project profit/loss, total fund summary, and yearly totals
- Mobile responsive admin-panel layout
- Supabase/PostgreSQL schema with row-level security starter policies

The current build is connected to Supabase Auth and the tables in `supabase/schema.sql`.

## Demo Login

Admin:

```text
admin@teamsyndicate.com
Use the password created in Supabase Auth
```

Member:

```text
member@teamsyndicat.com
Use the password created in Supabase Auth
```

## Run Locally

```bash
npm install
npm run dev
```

Create `.env.local` first:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Open the URL printed by Next.js, usually `http://localhost:3000`.

Production check:

```bash
npm run lint
npm run build
```

## Initial Fund Data

The seeded data follows the requested opening balance:

- 17 members
- Member IDs are seeded as `1` through `17`
- May/June 2026 contributions are seeded from each member's provided opening balance
- Starting fund balance before investments/expenses: `112,000 BDT`

## Basic Usage

Add member:

1. Login as admin.
2. Go to `Members`.
3. Fill name, phone, email, join date, and status.
4. Save. For that member to log in, create a matching Supabase Auth user and link it in `public.users`.

Create monthly contribution:

1. Go to `Contributions`.
2. Select month, year, and amount.
3. Save the period.
4. Open the period details and mark members as paid, unpaid, or partial.

Add or close project:

1. Go to `Projects`.
2. Add project name, investment amount, dates, expected return, actual return, expense, and status.
3. Open project details to update the final return, expense, status, and end date.
4. Profit/loss is recalculated automatically.

Add transaction:

1. Go to `Transactions`.
2. Choose transaction type, amount, date, related member/project, method, and note.
3. Manual transactions can be edited or deleted. Auto transactions come from contributions and projects.

## Fund Formulas

Fund balance:

```text
Total Fund Balance =
Total Contributions + Project Returns + Other Income
- Investments - Expenses - Loss
```

Member due:

```text
Member Due = Expected Contribution - Paid Contribution
```

Project profit/loss:

```text
Profit = Actual Return - Investment Amount - Expense
```

If the result is negative, the app records it as loss.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Create users in Supabase Auth:
   - `admin@teamsyndicate.com`
   - `member@teamsyndicat.com`
5. Run `supabase/seed.sql`. This links the Auth users to `public.users`, creates the 17 members, and seeds May/June 2026 contributions.
6. Copy `.env.example` to `.env.local`.
7. Add your Supabase URL and publishable key.
8. Restart the Next.js dev server.

The schema includes RLS starter policies:

- Admin users can manage members, contributions, projects, transactions, reports, and settings.
- Member users can read their own profile/contribution records and public project summaries.
- Members cannot insert, update, or delete fund records.

## Deployment Setup

Vercel:

1. Push the repo to GitHub.
2. Import it in Vercel.
3. Add Supabase environment variables.
4. Use the default Next.js build command: `npm run build`.
5. Deploy.

For production security, keep Supabase Auth and RLS as the source of truth. Do not expose service-role keys in the browser.

## Project Structure

```text
src/app
  login
  (app)/dashboard
  (app)/members
  (app)/contributions
  (app)/projects
  (app)/transactions
  (app)/reports
  (app)/settings
src/components
src/lib
supabase/schema.sql
supabase/seed.sql
```
