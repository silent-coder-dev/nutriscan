<div align="center">

# 🌱 NutriScan

### *Scan it. Understand it. Eat better.*

Scan any packaged food's barcode and get a plain-English verdict on sugar, salt, fat, additives and allergens, a **Veg / Non-veg** mark, **personal alerts** for your diet, and **better-rated swaps** from the same shelf, with help from **NutriBot**, a cute mascot who reacts to every result.

<br>

![Next.js](https://img.shields.io/badge/Next.js-16.4-000000?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4.3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
<br>
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)
<br>
![Backend tests](https://img.shields.io/badge/backend%20tests-61%20passing-2e6b46?style=flat-square)
![Lint](https://img.shields.io/badge/eslint-0%20problems-2e6b46?style=flat-square)
![Data](https://img.shields.io/badge/data-Open%20Food%20Facts%20(ODbL)-8fbf4a?style=flat-square)

<br>

[**Overview**](nutriscan-web/docs/01-PROJECT-OVERVIEW.md) · [**Tech stack**](nutriscan-web/docs/02-TECH-STACK.md) · [**Design system**](nutriscan-web/docs/03-DESIGN-SYSTEM.md) · [**Architecture**](nutriscan-web/docs/04-ARCHITECTURE.md) · [**Project flow**](nutriscan-web/docs/05-PROJECT-FLOW.md) · [**🎓 Learn (Hinglish)**](nutriscan-web/docs/LEARN.md)

<br>

<img src="nutriscan-web/docs/screenshots/result-top.png" alt="NutriScan: Nutella result with Nutri-Score E, veg mark, recent searches and NutriBot" width="900">

</div>

---

## 📚 Table of contents

- [What is NutriScan?](#-what-is-nutriscan)
- [Features](#-features)
- [Documentation](#-documentation)
- [Screenshots](#-screenshots)
- [Quick start](#-quick-start)
- [Configuration](#-configuration)
- [Scripts](#-scripts)
- [Project structure](#-project-structure)
- [API at a glance](#-api-at-a-glance)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Credits and data licence](#-credits-and-data-licence)

---

## 🌿 What is NutriScan?

Food labels are written for regulators, not shoppers. *"56.3 g sugar per 100 g"* means little in a shop aisle, imported products list ingredients in other languages, and allergy or diet checks mean reading every line.

**NutriScan turns a barcode into an answer:**

| You do | NutriScan does |
|:--|:--|
| 📷 Scan or type a barcode | Finds the product (local DB → Open Food Facts → optional AI estimate) |
| 👀 Look at the result | Explains it in plain words: *"about 14 teaspoons of sugar"*, *Clean / Moderate / Avoid* |
| 🙋 Add your allergies and diet | Flags clashes: *Contains Dairy*, *May not be vegan*, *Watch the sugar* |
| 🔁 Want something better | Suggests popular products from the same category with a better Nutri-Score |

> [!NOTE]
> The full story, including the problem, who it's for and **17 real problems we solved while building it**, is in **[docs/01-PROJECT-OVERVIEW.md](nutriscan-web/docs/01-PROJECT-OVERVIEW.md)**.

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

**🔎 Scan and search**
- Camera scanning, photo upload, or typing (EAN-8, UPC-A, EAN-13)
- One-tap sample products
- **Clear** button to start a fresh search
- **Recent searches** on the home page and in the nav bar, with **Veg / Non-veg** filters

**🧠 NutriBot's take**
- Plain-English verdict and summary
- *Watch out* / *The good stuff* findings
- Drinks judged per 100 ml
- Optional **AI summary** (OpenRouter)

</td>
<td width="50%" valign="top">

**🙋 Personal and local**
- Allergy, diet and medical-note alerts
- 🟩 **Veg** / 🟫 **Non-veg** mark (FSSAI style)
- Better-rated **swaps**, tap to check

**👤 Accounts and fun**
- Dashboard with scan log, XP and levels
- +10 XP for first-ever discoveries, leaderboard
- 5 free guest scans per day
- **NutriBot**: follows your cursor, does tricks when poked, reacts to every result

</td>
</tr>
</table>

---

## 📖 Documentation

| # | Document | What's inside |
|:-:|:--|:--|
| 1 | [**Project overview**](nutriscan-web/docs/01-PROJECT-OVERVIEW.md) | The problem, who it's for, the solution, feature tour, **how we overcame the hard problems**, limits, roadmap |
| 2 | [**Tech stack**](nutriscan-web/docs/02-TECH-STACK.md) | Every frontend, backend, data and tooling technology with versions, purpose and location; test inventory |
| 3 | [**Design system**](nutriscan-web/docs/03-DESIGN-SYSTEM.md) | Fonts, colour tokens, images and assets, icons, library components used, our component catalog, NutriBot spec |
| 4 | [**Architecture**](nutriscan-web/docs/04-ARCHITECTURE.md) | System context, backend layers, security, provider chain, caching, ER diagram, REST API reference, configuration |
| 5 | [**Project flow**](nutriscan-web/docs/05-PROJECT-FLOW.md) | Page map, user journey, sequence diagrams for scan, analysis, sign-up, XP, token refresh, recents, NutriBot states |
| 🎓 | [**LEARN.md (Hinglish)**](nutriscan-web/docs/LEARN.md) | Backend ko andar se samjho: Spring crash course, saari 62 classes, request ka poora safar, deep dives, interview Q&A |

> [!TIP]
> All diagrams are written in **Mermaid**, so GitHub, GitLab and VS Code's Markdown preview render them automatically.

---

## 📸 Screenshots

| Home | Result |
|:--:|:--:|
| <img src="nutriscan-web/docs/screenshots/home.png" alt="Home page" width="420"> | <img src="nutriscan-web/docs/screenshots/result-top.png" alt="Result page" width="420"> |
| **Recent searches** | **Dashboard** |
| <img src="nutriscan-web/docs/screenshots/recent-searches.png" alt="Recent searches panel with veg filters" width="420"> | <img src="nutriscan-web/docs/screenshots/dashboard.png" alt="Dashboard with back button and scan log" width="420"> |
| **Sign in** | **Mobile** |
| <img src="nutriscan-web/docs/screenshots/login.png" alt="Sign-in page with NutriBot" width="420"> | <img src="nutriscan-web/docs/screenshots/mobile-home.png" alt="Mobile home page" width="200"> |

<details>
<summary><b>📜 Full result page (long screenshot)</b></summary>
<br>
<p align="center"><img src="nutriscan-web/docs/screenshots/result-full.png" alt="Full result page: analysis, daily impact, ingredients, nutrition facts and swaps" width="700"></p>
</details>

---

## 🚀 Quick start

### Prerequisites

| Tool | Version | Check |
|:--|:--|:--|
| Node.js | **20.9+** | `node -v` |
| Java JDK | **21+** (developed on 25) | `java -version` |
| Docker Desktop | any recent | `docker --version` |
| Git Bash / any shell | n/a | n/a |

The project has two folders next to each other:

```text
NutriScan/
├── nutriscan-api/nutriscan-api/   ☕ backend
└── nutriscan-web/                 🖥️ frontend + docs
```

### 1️⃣ Start PostgreSQL and Redis

```bash
cd nutriscan-api/nutriscan-api
docker compose up -d                                                     # PostgreSQL 16 on :5432
docker run -d --name nutriscan-redis -p 6379:6379 redis:7-alpine         # Redis 7 on :6379
```

> [!NOTE]
> Redis is optional for local development. Without it the guest scan limit falls back to an in-memory counter.

### 2️⃣ Run the API (port 8080)

```bash
cd nutriscan-api/nutriscan-api
./mvnw spring-boot:run            # Windows: mvnw.cmd spring-boot:run
```

Optional, to enable AI summaries and the AI product fallback:

```bash
export OPENROUTER_API_KEY=sk-or-...      # PowerShell: $env:OPENROUTER_API_KEY="sk-or-..."
```

Check it's up: <http://localhost:8080/actuator/health> → `{"status":"UP"}`

### 3️⃣ Run the web app (port 3000)

```bash
cd nutriscan-web
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1" > .env.local
npm run dev
```

Open **<http://localhost:3000>** and tap **Nutella** under *Try one*. 🎉

> [!TIP]
> Want a ready-made demo login? Start the API with `SEED_ENABLED=true`, `SEED_EMAIL` and `SEED_PASSWORD` set (see `config/DataInitializer.java`). It is off by default and no credentials live in the code.

---

## 🔧 Configuration

### Frontend

| Variable | Default | Description |
|:--|:--|:--|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api/v1` | Where the API lives. Baked in at **build** time. |

### Backend (most used)

| Variable | Default | Description |
|:--|:--|:--|
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | local Docker values | PostgreSQL connection (production: Neon; the password only as a platform secret). `DB_URL` / `DB_USER` / `DB_PASSWORD` also work |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Guest-quota store |
| `JWT_SECRET` | *(empty → dev-only secret + warning)* | **Required in any deployed environment** (≥ 32 bytes) |
| `DATABASE_URL` | *(unset)* | Platform-style `postgresql://user:pass@host/db`, converted automatically (used on Render) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Allowed web origins (comma-separated) |
| `OPENROUTER_API_KEY` | *(unset)* | Enables AI features |
| `SEED_ENABLED` (+ `SEED_EMAIL`, `SEED_PASSWORD`) | `false` | Optional demo account |

Full list: [Architecture → Configuration](nutriscan-web/docs/04-ARCHITECTURE.md#-configuration).

---

## 🧾 Scripts

**Frontend** (`nutriscan-web/`)

| Command | What it does |
|:--|:--|
| `npm run dev` | Dev server with Turbopack on <http://localhost:3000> |
| `npm run build` | Production build (all pages prerendered) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + React Compiler rules) |
| `npx tsc --noEmit` | Type check |

**Backend** (`nutriscan-api/nutriscan-api/`)

| Command | What it does |
|:--|:--|
| `./mvnw spring-boot:run` | Run the API on <http://localhost:8080> |
| `./mvnw test` | Run the 61 unit + integration tests |
| `./mvnw package` | Build the runnable JAR in `target/` |

---

## 📂 Project structure

```text
nutriscan-web/
├── app/
│   ├── layout.tsx            Fonts (Fraunces · Figtree · Space Mono), metadata
│   ├── globals.css           Theme tokens + component classes (Tailwind v4)
│   ├── icon.tsx              Generated favicon
│   ├── page.tsx              Home: search, result, recents, NutriBot
│   ├── login/ · register/    Auth pages
│   ├── dashboard/            AuthGuard layout → server page → DashboardClient
│   ├── profile/              AuthGuard layout → server page → ProfileClient
│   └── components/           21 components (ProductCard, NutriBot, Header, …)
├── lib/
│   ├── api.ts                Typed API client (fetch wrapper, ApiError, 401 sign-out)
│   ├── auth.ts               Session store (useSession), guest scans
│   ├── recent.ts             Recent-search store (useRecentSearches)
│   ├── validation.ts         Password / username rules (mirror the API)
│   └── security.ts           Input clean-up, cached username check
├── types/product.ts          Product, NutriScore, VegStatus types
├── docs/                     📖 The five detailed documents + screenshots
└── next.config.ts            cacheComponents · partialPrefetching · Turbopack CSS
```

Backend structure and layers: [Architecture → Repository layout](nutriscan-web/docs/04-ARCHITECTURE.md#-repository-layout).

---

## 📡 API at a glance

| Method | Endpoint | Auth |
|:--|:--|:-:|
| `POST` | `/api/v1/auth/register` · `/api/v1/auth/login` | none |
| `GET` | `/api/v1/auth/check-username?username=` | none |
| `GET` | `/api/v1/products/{barcode}` | optional (guests: 5/day) |
| `GET` | `/api/v1/products/{barcode}/insights` | optional (personalised with JWT) |
| `GET` | `/api/v1/users/leaderboard` | none |
| `GET` | `/api/v1/users/me` · `/api/v1/users/me/scans` | JWT |
| `PUT` | `/api/v1/users/profile` | JWT |
| `POST` | `/api/v1/users/change-password` | JWT |

Every error returns `{ status, error, message, path, timestamp, fieldErrors? }`. Details and examples: [Architecture → REST API reference](nutriscan-web/docs/04-ARCHITECTURE.md#-rest-api-reference).

---

## ☁️ Deployment

The repo is ready for **[Render](https://render.com)** (free tier):

| File | Purpose |
|:--|:--|
| [`render.yaml`](render.yaml) | Blueprint: Docker API + Node frontend in one click (Ohio region, next to the Neon database) |
| [`nutriscan-api/nutriscan-api/Dockerfile`](nutriscan-api/nutriscan-api/Dockerfile) | Multi-stage build (Maven → JRE 21 Alpine), non-root, tuned for 512 MB |

Database: **[Neon](https://neon.tech)** serverless PostgreSQL (pooled endpoint, SSL), configured only through `SPRING_DATASOURCE_*` environment variables.

Verified locally with Render-like limits (512 MB, `PORT=10000`, no Redis): starts in ~30 s, uses ~300 MB.

> [!IMPORTANT]
> Your local Docker Postgres/Redis run on your laptop, so Render can't use them; production uses Neon. Step-by-step guide, env vars, and what is **not** done yet: **[LEARN.md → Part G](nutriscan-web/docs/LEARN.md#part-g-deployment-render-pe-free-hosting)** (Hinglish).

---

## 🧪 Testing

```bash
# Backend: 61 tests (needs PostgreSQL; uses a separate nutriscandb_test database)
docker exec nutriscan-postgres psql -U nutriscan -d nutriscandb -c "CREATE DATABASE nutriscandb_test"   # once
cd nutriscan-api/nutriscan-api && ./mvnw test

# Frontend
cd nutriscan-web && npx tsc --noEmit && npm run lint && npm run build
```

Test inventory: [Tech stack → Testing](nutriscan-web/docs/02-TECH-STACK.md#-testing).

---

## 🩺 Troubleshooting

<details>
<summary><b>"Unable to reach the NutriScan server"</b></summary>

The API isn't running or `NEXT_PUBLIC_API_BASE_URL` points to the wrong place. Check <http://localhost:8080/actuator/health>. After changing `.env.local`, restart `npm run dev`.
</details>

<details>
<summary><b><code>mvnw</code>: "JAVA_HOME environment variable is not defined correctly"</b></summary>

`JAVA_HOME` points to a JDK folder that no longer exists (e.g. after a JDK update). Point it to your installed JDK, for example `C:\Program Files\Java\jdk-25.0.4.1`, then open a new terminal.
</details>

<details>
<summary><b>"Port 8080 was already in use"</b></summary>

Another API instance is running (Spring DevTools may have restarted an old one). Stop it, or run on another port with `PORT=8081` and update `NEXT_PUBLIC_API_BASE_URL`.
</details>

<details>
<summary><b>"You have used your 5 free scans" while developing</b></summary>

Sign in (no limit), or reset your local counter:
```bash
docker exec nutriscan-redis redis-cli DEL rate:guest:127.0.0.1
```
</details>

<details>
<summary><b>Browser console shows a CORS error</b></summary>

The web app's origin isn't allowed. Set `CORS_ALLOWED_ORIGINS` on the API (e.g. `http://localhost:3000,http://192.168.1.10:3000`).
</details>

<details>
<summary><b>Backend tests fail with "database nutriscandb_test does not exist"</b></summary>

Create it once with the `CREATE DATABASE` command in [Testing](#-testing).
</details>

<details>
<summary><b>No AI summary appears</b></summary>

Expected without `OPENROUTER_API_KEY`: the analysis is then built from nutrition rules and labelled **"Label analysis"**. With a key it shows **"AI summary"**.
</details>

---

## 🧭 Roadmap

- [x] Barcode lookup, analysis, personal alerts, veg mark, swaps
- [x] Eco redesign, NutriBot mascot, recent searches, Clear button
- [x] Dockerfile + Render Blueprint (deploy-ready, verified locally)
- [x] Pushed to GitHub as one repo (README at the root, secrets checked)
- [x] Production database set up for Neon (configured through environment variables only)
- [ ] Deploy on Render (backend + frontend)
- [ ] Use Open Food Facts `ingredients_analysis_tags` to double-check the veg mark
- [ ] Sync recent searches to the account
- [ ] Commit the Playwright end-to-end suite
- [ ] Remove unused packages (`three`, `canvas-confetti`, `clsx`, `tailwind-merge`) and components

---

## 🙏 Credits and data licence

- **Product data** © [Open Food Facts](https://world.openfoodfacts.org) contributors, available under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). Product images are under their own licences on Open Food Facts.
- **Nutri-Score** grades are computed by Open Food Facts; NutriScan only displays them.
- **Icons** by [Lucide](https://lucide.dev) (ISC). **Fonts** [Fraunces](https://fonts.google.com/specimen/Fraunces), [Figtree](https://fonts.google.com/specimen/Figtree), [Space Mono](https://fonts.google.com/specimen/Space+Mono) (SIL Open Font License).
- **Barcode reading** by [html5-qrcode](https://github.com/mebjas/html5-qrcode) (Apache-2.0).

> [!CAUTION]
> NutriScan gives general information from label data, **not medical advice**. Allergy and veg/non-veg checks are keyword-based; always read the pack.

<div align="center">
<br>

Made with ❤️ by **Silent Coder**

</div>
