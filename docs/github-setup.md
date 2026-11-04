# GitHub Repository Setup

## Repository Information

| Field       | Value                                                        |
|-------------|--------------------------------------------------------------|
| Remote URL  | `https://github.com/mustfamaheer-dotcom/LearnHebrew.git`     |
| Main Branch | `main`                                                       |

---

## Initial Setup Commands

Run the following commands **once** after cloning or initializing the local repository:

```bash
# 1. Add the remote origin
git remote add origin https://github.com/mustfamaheer-dotcom/LearnHebrew.git

# 2. Rename branch to main (if not already)
git branch -M main

# 3. Push and set upstream tracking
git push -u origin main
```

---

## Recommended Git Workflow (Feature Branch Strategy)

```bash
# Create a new feature branch
git checkout -b feature/<feature-name>

# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "feat: <short description of what you did>"

# Push the feature branch
git push origin feature/<feature-name>

# Open a Pull Request on GitHub → merge into main after review
```

---

## Commit Message Convention (Conventional Commits)

| Prefix     | When to use                                       |
|------------|---------------------------------------------------|
| `feat:`    | New feature                                       |
| `fix:`     | Bug fix                                           |
| `docs:`    | Documentation changes                             |
| `style:`   | Formatting, missing semicolons (no logic change)  |
| `refactor:`| Code restructuring without feature/bug change     |
| `test:`    | Adding or updating tests                          |
| `chore:`   | Build process, dependency updates, CI/CD config   |
| `perf:`    | Performance improvements                          |
| `security:`| Security patches or hardening                     |

---

## Branch Strategy

```
main          ← Production-ready code only
 └── develop  ← Integration branch (merge features here first)
      ├── feature/auth
      ├── feature/calendar
      ├── feature/packages
      ├── feature/gamification
      └── feature/admin-dashboard
```

---

## Environment Files — NEVER COMMIT

Add these to `.gitignore`:

```
# Environment files
.env
.env.local
.env.production
.env.development

# Node
node_modules/

# Build outputs
dist/
build/

# Logs
*.log

# OS files
.DS_Store
Thumbs.db
```

---

## GitHub Secrets (for CI/CD)

Configure these secrets in **GitHub → Settings → Secrets and Variables → Actions**:

| Secret Name               | Description                        |
|---------------------------|------------------------------------|
| `DATABASE_URL`            | PostgreSQL connection string        |
| `JWT_SECRET`              | JWT signing secret                  |
| `JWT_REFRESH_SECRET`      | JWT refresh token secret            |
| `GOOGLE_OAUTH_CLIENT_ID`  | Google OAuth client ID              |
| `GOOGLE_OAUTH_SECRET`     | Google OAuth client secret          |
| `VERCEL_TOKEN`            | Vercel deployment token             |
| `VERCEL_ORG_ID`           | Vercel organization ID              |
| `VERCEL_PROJECT_ID`       | Vercel project ID                   |
| `SENDGRID_API_KEY`        | Email service API key               |

---

## Collaborators & Access

> Add collaborators via **GitHub → Settings → Collaborators and Teams**

| Role        | Permission Level |
|-------------|-----------------|
| Owner/Admin | Admin           |
| Backend Dev | Write           |
| Frontend Dev| Write           |
| Designer    | Read            |

---

*Last updated: November 2026*

