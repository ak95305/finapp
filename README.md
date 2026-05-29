# Next.js + Google Sheets CRUD Boilerplate

A fully-typed, reusable CRUD starter using **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **Google Sheets** as storage, and **Google Apps Script** as the API layer. Deployable on Vercel with zero backend infrastructure.

---

## Setup

### 1. Google Sheet

Create a Google Sheet and add a tab named **Items** with these column headers in row 1:

```
id | name | description | status | amount | email | createdAt | updatedAt
```

### 2. Google Apps Script

1. Open the sheet → **Extensions → Apps Script**
2. Paste the contents of `apps-script/Code.gs` and `apps-script/appsscript.json`
3. Deploy → **New deployment** → **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the deployment URL

### 3. Environment

```bash
cp .env.example .env.local
# Edit .env.local and set:
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
```

### 4. Run

```bash
npm install
npm run dev
```

---

## Folder structure

```
├── app/
│   ├── layout.tsx              # Root layout with Navbar
│   ├── page.tsx                # Home / quick-start guide
│   └── items/
│       ├── page.tsx            # List page
│       ├── new/page.tsx        # Create page
│       └── [id]/
│           ├── page.tsx        # Detail page
│           └── edit/page.tsx   # Edit page
├── components/
│   ├── layout/
│   │   └── Navbar.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── DataTable.tsx       # Sortable table with row actions
│       ├── EmptyState.tsx
│       ├── ErrorMessage.tsx
│       ├── Form.tsx            # Config-driven form
│       ├── Input.tsx           # Input / Textarea / Select
│       └── Modal.tsx           # Modal + ConfirmModal
├── hooks/
│   ├── use-async.ts            # Single-operation async state
│   ├── use-crud.ts             # Full list CRUD state
│   └── use-record.ts           # Single-record fetch
├── services/
│   ├── api-client.ts           # createApiClient<TRecord, TCreate>(sheet)
│   └── items.ts                # itemsService — swap for your domain
├── types/
│   └── index.ts                # BaseRecord, Item, FieldConfig, TableColumn…
├── lib/
│   ├── config.ts               # env vars
│   └── utils.ts                # cn, formatDate, formatCurrency, …
└── apps-script/
    ├── Code.gs                 # GET/POST handler — getAll/getById/create/update/delete
    └── appsscript.json
```

---

## Adapting to a new domain

1. Add your type to `types/index.ts` extending `BaseRecord`
2. Create `services/your-resource.ts` calling `createApiClient<YourType, CreateInput>("SheetTabName")`
3. Define `FieldConfig[]` for your form fields
4. Copy the `items` pages into `app/your-resource/` and swap the service + fields

---

## Deployment (Vercel)

```bash
vercel deploy
# Add NEXT_PUBLIC_APPS_SCRIPT_URL in Vercel project settings → Environment Variables
```
