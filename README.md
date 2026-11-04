# LearnHebrew 🇮🇱

> A professional bilingual (English/Hebrew) online Hebrew language learning platform.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + Shadcn/UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Deployment**: Vercel (frontend) + Railway (backend)

## Documentation

| Document | Description |
|----------|-------------|
| [Project Plan & System Design](./docs/project-plan.md) | Full architecture, DB schema, API design, feature specs |
| [GitHub Setup](./docs/github-setup.md) | Repository setup, branch strategy, secrets |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/mustfamaheer-dotcom/LearnHebrew.git
cd LearnHebrew

# Backend setup
cd backend
npm install
cp .env.example .env   # Fill in your values
npx prisma migrate dev
npm run dev

# Frontend setup
cd ../frontend
npm install
cp .env.example .env   # Fill in your values
npm run dev
```

## Languages

The application fully supports:
- 🇬🇧 **English** (LTR)
- 🇮🇱 **Hebrew** (RTL)

## License

Private — All rights reserved.

