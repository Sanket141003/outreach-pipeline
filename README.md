# Automated Outreach Pipeline

One domain in → lookalikes → decision-makers → verified emails → outreach sent.

## Pipeline

```
company.domain
    │
    ▼
[Stage 1] Ocean.io       → find lookalike company domains
    │
    ▼
[Stage 2] Prospeo        → find C-suite/VP contacts + LinkedIn URLs
    │
    ▼
[Stage 3] Eazyreach      → resolve LinkedIn URLs to verified emails
    │
    ▼
  ⚠️  Safety checkpoint  → review contacts before sending
    │
    ▼
[Stage 4] Brevo          → send personalized outreach emails
```

## Setup

### 1. Get a domain
Required to sign up for Ocean.io (needs a company email).
- Free via [GitHub Student Developer Pack](https://education.github.com/pack) (Namecheap)
- Or buy cheapest domain on [namecheap.com](https://namecheap.com)

### 2. Create accounts
In this order:
1. Get domain + set up company email (e.g. `you@yourdomain.com`)
2. [Ocean.io](https://ocean.io) — use your company email
3. [Prospeo](https://app.prospeo.io/api)
4. [Eazyreach](https://eazyreach.app)
5. [Brevo](https://app.brevo.com) — verify your sender email

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your API keys in .env
```

### 4. Install and run

```bash
npm install
node src/index.js stripe.com
```

Or without passing an argument (it will prompt you):
```bash
node src/index.js
```

## Configuration

Edit `.env` to control:
- `MAX_LOOKALIKES` — how many lookalike companies to find (default: 5)
- `MAX_CONTACTS_PER_COMPANY` — max decision-makers per company (default: 2)

## Email copy

Edit `src/email/template.js` to customize the outreach email subject and body.

## Project structure

```
src/
├── index.js                  # Entry point, orchestrates all stages
├── stages/
│   ├── stage1_ocean.js       # Ocean.io lookalike search
│   ├── stage2_prospeo.js     # Prospeo people search + enrich
│   ├── stage3_eazyreach.js   # Eazyreach email resolution
│   └── stage4_brevo.js       # Brevo email sending
├── email/
│   └── template.js           # Outreach email copy
└── utils/
    ├── logger.js             # Colored console output
    ├── validate.js           # Env var validation
    └── sleep.js              # Rate limit helper
```
