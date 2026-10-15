<div align="center">

# 🏗️ NutriScan: Architecture

**How the system is put together: services, layers, data model, security, API and configuration.**

![Style](https://img.shields.io/badge/style-layered%20REST-2e6b46?style=flat-square)
![Auth](https://img.shields.io/badge/auth-stateless%20JWT-1f2d24?style=flat-square)
![DB](https://img.shields.io/badge/db-PostgreSQL%2016-4169E1?style=flat-square)
![Cache](https://img.shields.io/badge/cache-Redis%20%2B%20Caffeine-DC382D?style=flat-square)

[← Design system](03-DESIGN-SYSTEM.md) · [README](../../README.md) · [Project flow →](05-PROJECT-FLOW.md)

</div>

---

## Contents

- [System context](#-system-context)
- [Repository layout](#-repository-layout)
- [Backend architecture](#-backend-architecture)
- [Security model](#-security-model)
- [Product lookup: provider chain](#-product-lookup-provider-chain)
- [Insights engine](#-insights-engine)
- [Caching strategy](#-caching-strategy)
- [Data model](#-data-model)
- [REST API reference](#-rest-api-reference)
- [Error contract](#-error-contract)
- [Frontend architecture](#-frontend-architecture)
- [Configuration](#-configuration)
- [Deployment view](#-deployment-view)

---

## 🌐 System context

```mermaid
flowchart LR
    user(["🙋 Shopper<br/>(browser / phone)"])

    subgraph web["nutriscan-web · Next.js 16 · :3000"]
        pages["Pages + components"]
        stores["Session & recents stores<br/>(localStorage)"]
    end

    subgraph api["nutriscan-api · Spring Boot 4.1 · :8080"]
        ctrl["REST controllers"]
        svc["Services & rule engines"]
        repo["JPA repositories"]
    end

    pg[("PostgreSQL 16<br/>nutriscandb")]
    redis[("Redis 7<br/>guest quota")]
    off["Open Food Facts<br/>product API v2"]
    sal["Open Food Facts<br/>search-a-licious"]
    orr["OpenRouter<br/>LLM (optional)"]

    user --> pages
    pages <--> stores
    pages -- "HTTPS JSON<br/>Authorization: Bearer JWT" --> ctrl
    ctrl --> svc --> repo --> pg
    svc --> redis
    svc --> off
    svc --> sal
    svc -.-> orr
```

| Boundary | Protocol | Notes |
|:--|:--|:--|
| Browser → Web | HTTP | Static, prerendered pages; all data fetched client-side. |
| Web → API | REST/JSON over HTTP(S) | Base URL from `NEXT_PUBLIC_API_BASE_URL`; CORS allow-list on the API. |
| API → PostgreSQL | JDBC (HikariCP) | Schema managed by Hibernate (`ddl-auto=update` in dev). |
| API → Redis | RESP (Lettuce) | 2 s timeouts; falls back to memory if down. |
| API → Open Food Facts / OpenRouter | HTTPS (`RestClient` + JDK HttpClient) | Explicit connect/read timeouts. |

---

## 📁 Repository layout

```text
NutriScan/
├── nutriscan-api/nutriscan-api/              ☕ Spring Boot API
│   ├── docker-compose.yml                     PostgreSQL 16 container
│   ├── pom.xml                                Maven build
│   └── src/
│       ├── main/java/com/nutriscan/
│       │   ├── NutriscanApiApplication.java
│       │   ├── config/        Security, CORS, RestClients, seed user, cache, password encoder
│       │   ├── controller/    AuthController, ProductController, UserController
│       │   ├── dto/           Request/response records, Open Food Facts + search DTOs, validation rules
│       │   ├── entity/        User, Product, ProductScan, ProductSource
│       │   ├── exception/     ApiException, GlobalExceptionHandler
│       │   ├── mapper/        ProductMapper (OFF → Product), AiProductMapper
│       │   ├── parser/        AiResponseParser
│       │   ├── prompt/        OpenRouterPromptBuilder
│       │   ├── provider/      ProductProvider chain (Open Food Facts, AI)
│       │   ├── repository/    UserRepository, ProductRepository, ProductScanRepository
│       │   ├── security/      JwtAuthenticationFilter, JsonSecurityErrorHandler
│       │   ├── service/       Product, Insight, Analyzer, Alerts, Veg, RateLimiter, Auth, User…
│       │   └── util/          Barcodes, NutriScores, JwtUtil, ClientIpUtil
│       ├── main/resources/application.properties
│       └── test/              61 tests (unit + MockMvc integration)
│
└── nutriscan-web/                             🖥️ Next.js frontend
    ├── app/
    │   ├── layout.tsx · globals.css · icon.tsx
    │   ├── page.tsx                           Home: search, results, recents
    │   ├── login/ · register/                 Auth pages
    │   ├── dashboard/  layout · page · DashboardClient
    │   ├── profile/    layout · page · ProfileClient
    │   └── components/                        21 UI components
    ├── lib/   api.ts · auth.ts · recent.ts · security.ts · validation.ts
    ├── types/ product.ts
    └── docs/  ← you are here
```

---

## ☕ Backend architecture

### Layers

```mermaid
flowchart TB
    subgraph L1["① Web layer"]
        F["JwtAuthenticationFilter"] --> C["@RestController<br/>Auth · Product · User"]
        C -. errors .-> EH["GlobalExceptionHandler<br/>JsonSecurityErrorHandler"]
    end
    subgraph L2["② Service layer"]
        PS["ProductService"] --> PROV["ProductProvider chain"]
        IS["ProductInsightService"] --> ENG["ProductAnalyzer · PersonalAlertChecker<br/>VegClassifier · HealthVerdictCalculator"]
        AS["AuthService · UserService"]
        RL["RateLimiterService"]
        SCAN["ProductScanService"]
    end
    subgraph L3["③ Integration layer"]
        OFFS["OpenFoodFactsService"]
        ORS["OpenRouterService"]
        MAP["Mappers · AiResponseParser"]
    end
    subgraph L4["④ Persistence layer"]
        R["Spring Data repositories"] --> DB[("PostgreSQL")]
    end
    C --> PS & IS & AS & RL
    PS --> SCAN --> R
    PROV --> OFFS & ORS
    OFFS & ORS --> MAP
    IS --> OFFS & ORS
    PS & IS & AS --> R
    RL --> REDIS[("Redis")]
```

### Package responsibilities

| Package | Key classes | Responsibility |
|:--|:--|:--|
| `controller` | `AuthController`, `ProductController`, `UserController` | HTTP mapping, input checks, guest quota. Thin: no business logic. |
| `service` | `ProductService` | Lookup orchestration: DB → providers → save → XP → scan record. |
| | `ProductInsightService` | Builds insights: analysis, AI summary, alerts, alternatives; caching; self-repair of old rows. |
| | `ProductAnalyzer` | Rule-based verdict, summary sentence and findings (FSA thresholds, drinks vs. food). |
| | `PersonalAlertChecker`, `VegClassifier`, `HealthVerdictCalculator` | Pure rule engines (static, unit-tested). |
| | `RateLimiterService` | 5 guest scans / IP / 24 h in Redis, with in-memory fallback. |
| | `AuthService`, `UserService`, `ProductScanService` | Accounts, profile, password, history, guest-scan migration. |
| | `OpenFoodFactsService`, `OpenRouterService`, `IngredientSimplifierService` | External calls and text clean-up. |
| `provider` | `ProductProvider`, `OpenFoodFactsProductProvider` (1), `AiProductProvider` (2) | Chain of responsibility for unknown barcodes. |
| `security` | `JwtAuthenticationFilter`, `JsonSecurityErrorHandler` | Token → `SecurityContext`; JSON 401/403. |
| `exception` | `ApiException`, `GlobalExceptionHandler` | One error contract for the whole API. |
| `util` | `Barcodes`, `NutriScores`, `JwtUtil`, `ClientIpUtil` | GS1 check digit, grade normalisation, tokens, client IP. |

---

## 🔐 Security model

| Aspect | Implementation |
|:--|:--|
| **Session** | Stateless. `SessionCreationPolicy.STATELESS`; no cookies, no CSRF token needed. |
| **Token** | JWT **HS256**, subject = email, claim `userID`, **7-day** expiry (`JWT_EXPIRATION`). Secret from `JWT_SECRET` (≥ 32 bytes, checked at startup). |
| **Passwords** | jBCrypt, cost 10. Rules: 8–72 chars with upper, lower, digit, symbol (72 = bcrypt byte limit). |
| **Invalid tokens** | Ignored by the filter, so the request continues as anonymous. Public routes still work; protected routes get **JSON 401**. |
| **Email change** | `PUT /users/profile` returns a **new token** (the old subject no longer exists). |
| **CORS** | Allow-list from `CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`); exposes `X-RateLimit-Remaining`. |
| **Client IP** | Socket address only (`ClientIpUtil`). Behind a proxy set `FORWARD_HEADERS_STRATEGY=native`. |
| **Guest abuse** | 5 lookups per IP per 24 h; a junk `Authorization` header still counts as a guest. |
| **AI abuse** | AI only queried for valid GS1 barcodes; AI products earn no XP. |

**Route access**

| Route pattern | Access |
|:--|:--|
| `OPTIONS /**`, `/error`, `ERROR` dispatches | public |
| `/actuator/health/**`, `/actuator/info` | public |
| `/api/v1/auth/**` | public |
| `GET /api/v1/products/**` | public (personalised when a valid token is sent) |
| `GET /api/v1/users/leaderboard` | public |
| everything else | **JWT required** |

---

## 🔗 Product lookup: provider chain

```mermaid
flowchart TD
    Q["GET /products/{barcode}"] --> V{"8–14 digits?"}
    V -- no --> E400["400 Bad Request"]
    V -- yes --> G{"Valid JWT?"}
    G -- no --> RL{"Guest quota left?<br/>(Redis / memory)"}
    RL -- no --> E429["429 Too Many Requests"]
    RL -- yes --> DB
    G -- yes --> DB{"In local DB?"}
    DB -- yes --> HIT["Return product<br/>(+ record scan if signed in)"]
    DB -- no --> P1["① OpenFoodFactsProductProvider"]
    P1 -- found --> SAVE
    P1 -- miss --> CD{"GS1 check digit valid<br/>and AI key set?"}
    CD -- no --> E404["404 Not Found"]
    CD -- yes --> P2["② AiProductProvider (OpenRouter)"]
    P2 -- found --> SAVE["Save product<br/>(unique barcode; race-safe)"]
    P2 -- miss --> E404
    SAVE --> XP{"Signed in and<br/>source = Open Food Facts?"}
    XP -- yes --> AW["+10 XP (atomic UPDATE)<br/>record scan as discovery"]
    XP -- no --> REC["Record scan / return"]
```

---

## 🧠 Insights engine

`GET /products/{barcode}/insights` combines four parts:

| Part | Source | Cached? | Personal? |
|:--|:--|:-:|:-:|
| **Verdict + summary + findings** | `ProductAnalyzer` (rules) | computed each time (cheap) | no |
| **AI summary** (replaces the rule summary when available) | `OpenRouterService.summarizeProduct` | ✅ 6 h per barcode (successes only) | no |
| **Alternatives** | `OpenFoodFactsService.searchByCategory` (most specific category, widened once) | ✅ 6 h per barcode | no |
| **Personal alerts** | `PersonalAlertChecker` with the user's profile | never | ✅ |

Before analysing, `ensureCategories()` fetches categories for older rows once and also refreshes their English label text.

---

## ⚡ Caching strategy

| Cache | Store | Key | TTL | Size | Purpose |
|:--|:--|:--|:--|:--|:--|
| Guest quota | **Redis** | `rate:guest:<ip>` | 24 h | n/a | Free-scan limit, shared across instances |
| Guest quota fallback | Caffeine | same | 24 h | 100 000 | Used when Redis is unreachable (Redis skipped for 30 s after a failure) |
| AI summaries | Caffeine | barcode | 6 h | 5 000 | Avoid repeated LLM calls |
| Alternatives | Caffeine | barcode | 6 h | 5 000 | Avoid repeated search calls |
| Category lookups | Caffeine | barcode | 6 h | 5 000 | Don't re-fetch categories that don't exist |
| Products | **PostgreSQL** | barcode | permanent | n/a | Every product seen is stored; later lookups are local |

---

## 🧬 Data model

```mermaid
erDiagram
    USERS ||--o{ SCAN_HISTORIES : "scans"
    PRODUCTS ||--o{ SCAN_HISTORIES : "is scanned in"

    USERS {
        bigint id PK
        varchar username UK "3-15, a-z 0-9 _ . -"
        varchar full_name
        varchar email UK
        varchar password "bcrypt hash"
        varchar dietary_preference
        varchar allergies "comma-separated"
        varchar medical_conditions
        int scout_score
        int unique_discoveries
        timestamp last_username_change
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        bigint id PK
        varchar barcode UK "indexed"
        varchar product_name
        varchar brand
        varchar nutri_score "A-E or UNKNOWN"
        varchar image_url
        text ingredients_text
        text simplified_ingredients
        varchar allergens
        double calories100g
        double sugars100g
        double fat100g
        double proteins100g
        double sodium100g
        varchar source "OPEN_FOOD_FACTS or AI_ESTIMATE"
        text category_tags "en: tags, general to specific"
        timestamp created_at
        timestamp updated_at
    }

    SCAN_HISTORIES {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        varchar health_verdict "Clean, Moderate, Avoid"
        text ai_analysis_summary
        boolean is_discovery
        timestamp scanned_at
    }
```

> [!NOTE]
> **Computed, not stored:** `vegStatus` (from `VegClassifier`) and the scan-log verdict are computed from the product each time they're read, so improvements to the rules apply to old data automatically.

---

## 📡 REST API reference

Base URL: `http://localhost:8080/api/v1`

| Method | Path | Auth | Description | Success | Errors |
|:--|:--|:-:|:--|:-:|:--|
| `POST` | `/auth/register` | none | Create account; imports `guestBarcodes` | `201` AuthResponse | `400` validation · `409` taken |
| `POST` | `/auth/login` | none | Sign in with username **or** email | `200` AuthResponse | `400` · `401` |
| `GET` | `/auth/check-username?username=` | none | Is the handle free? | `200 {available}` | `400` missing param |
| `GET` | `/products/{barcode}` | optional | Look up a product (guests: 5/day; header `X-RateLimit-Remaining`) | `200` Product | `400` · `404` · `429` |
| `GET` | `/products/{barcode}/insights` | optional | Summary, findings, alternatives (+ personal alerts with JWT) | `200` Insights | `400` · `404` not scanned yet |
| `GET` | `/users/leaderboard` | none | Top 10 scouts with points | `200` list | n/a |
| `GET` | `/users/me` | **JWT** | Fresh profile and stats | `200` | `401` |
| `GET` | `/users/me/scans` | **JWT** | Last 100 scans with verdict + veg status | `200` list | `401` |
| `PUT` | `/users/profile` | **JWT** | Update profile (username every 20 days); returns **new token** | `200` AuthResponse | `400` · `401` · `409` |
| `POST` | `/users/change-password` | **JWT** | Change password | `200 {message}` | `400` · `401` |
| `GET` | `/actuator/health` | none | Liveness / readiness | `200` / `503` | n/a |

<details>
<summary><b>Example: <code>GET /products/3017620422003</code> (Product)</b></summary>

```json
{
  "id": 1,
  "barcode": "3017620422003",
  "productName": "Nutella",
  "brand": "Nutella, Ferrero",
  "nutriScore": "E",
  "imageUrl": "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.879.400.jpg",
  "ingredientsText": "Sugar, vegetable fat (palm), hazelnuts (13%), skimmed milk powder (8.7%), …",
  "simplifiedIngredients": "Sugar, vegetable fat (palm), Hazelnuts (13%), …",
  "allergens": "Milk, Nuts, Soybeans",
  "calories100g": 539.0,
  "sugars100g": 56.3,
  "fat100g": 30.9,
  "proteins100g": 6.3,
  "sodium100g": 0.0428,
  "source": "OPEN_FOOD_FACTS",
  "vegStatus": "VEG",
  "isNewDiscovery": false,
  "earnedPoints": 0,
  "totalScoutScore": 0,
  "totalUniqueDiscoveries": 0
}
```
</details>

<details>
<summary><b>Example: <code>GET /products/3017620422003/insights</code> (Insights)</b></summary>

```json
{
  "barcode": "3017620422003",
  "verdict": "Avoid",
  "summary": "Nutella is best kept as an occasional treat. It's high in sugar and fat, with 56.3 g of sugar per 100 g (about 14 teaspoons). It also contains palm oil. Have a look at the better-rated swaps below.",
  "summarySource": "NUTRIBOT",
  "highlights": [
    { "tone": "bad",  "title": "High in sugar", "detail": "56.3 g per 100 g, about 14 teaspoons." },
    { "tone": "good", "title": "Low in salt",   "detail": "0.11 g per 100 g." },
    { "tone": "warn", "title": "Contains palm oil", "detail": "High in saturated fat and linked to deforestation." }
  ],
  "personalAlerts": [],
  "personalized": false,
  "alternatives": [
    { "barcode": "8480000671400", "productName": "Crema de cacahuete", "brand": "Hacendado", "nutriScore": "A", "imageUrl": "https://images.openfoodfacts.org/…" }
  ],
  "alternativesCategory": "Sweet spreads"
}
```
</details>

<details>
<summary><b>Example: AuthResponse</b></summary>

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9…",
  "userId": 12,
  "username": "asha_green",
  "email": "asha@example.com",
  "fullName": "Asha Green",
  "dietaryPreference": "Vegan",
  "allergies": "Peanuts, Dairy",
  "medicalConditions": "",
  "lastUsernameChange": null,
  "migratedScansCount": 2,
  "uniqueDiscoveries": 1,
  "scoutScore": 10
}
```
</details>

---

## 🚨 Error contract

Every failure, from validation and auth to rate limits and server errors, returns the same JSON shape:

```json
{
  "status": 400,
  "error": "VALIDATION_FAILED",
  "message": "Password must be 8-72 characters with an uppercase letter, a lowercase letter, a number and a symbol",
  "path": "/api/v1/auth/register",
  "timestamp": "2026-10-14T10:44:40.427Z",
  "fieldErrors": { "password": "Password must be 8-72 characters …" }
}
```

| `error` code | Status | When |
|:--|:-:|:--|
| `VALIDATION_FAILED` | 400 | Bean-validation failure (`fieldErrors` included) |
| `MALFORMED_REQUEST` | 400 | Missing or invalid JSON body |
| `BAD_REQUEST` | 400 | Bad barcode, missing parameter, wrong current password… |
| `UNAUTHORIZED` | 401 | Missing/expired token, wrong credentials |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Unknown product or route |
| `CONFLICT` | 409 | Email/username already in use |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Body isn't JSON |
| `RATE_LIMIT_EXCEEDED` | 429 | Guest used 5 free scans |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected error (logged with stack trace) |

The frontend always reads `message`; a `401` on an authenticated call signs the user out automatically.

---

## 💻 Frontend architecture

### Routes

| Route | File | Rendering | Access |
|:--|:--|:--|:--|
| `/` | `app/page.tsx` | Client component, prerendered shell | public |
| `/login` | `app/login/page.tsx` | Client | public (redirects if signed in) |
| `/register` | `app/register/page.tsx` | Client | public (redirects if signed in) |
| `/dashboard` | `layout.tsx` (AuthGuard) → `page.tsx` (server, `instant = false`) → `DashboardClient.tsx` | Server wrapper + client | signed in |
| `/profile` | same pattern → `ProfileClient.tsx` | Server wrapper + client | signed in |
| `/icon` | `app/icon.tsx` | Generated PNG | public |

### Modules

```mermaid
flowchart LR
    subgraph UI["app/ (pages & components)"]
        Home["page.tsx"] --> Card["ProductCard"]
        Home --> Bar["BarcodeSearchBar"] & Scan["BarcodeScannerModal"] & Bot["NutriBot"]
        Hdr["Header"] --> Rec["RecentSearchesModal"] & LB["LeaderboardModal"]
        Card --> Ins["ProductInsights"] & Alt["ProductAlternatives"] & HM["HealthMeter"] & NG["NutrientGrid"]
    end
    subgraph LIB["lib/"]
        API["api.ts<br/>fetch wrapper · typed calls"]
        AUTH["auth.ts<br/>session store · guest scans"]
        REC["recent.ts<br/>recent-search store"]
        VAL["validation.ts · security.ts"]
    end
    UI --> API & AUTH & REC & VAL
    API --> AUTH
    API -- "fetch" --> BE[("nutriscan-api")]
    AUTH & REC --> LS[("localStorage")]
```

### Client-side state

| Store | Key(s) in `localStorage` | Hook / API | Notes |
|:--|:--|:--|:--|
| Session | `nutriscan_token`, `nutriscan_user` | `useSession()`, `saveSession`, `updateSession`, `clearSession` | Shared across tabs via the `storage` event |
| Guest scans | `nutriscan_guest_scans` | `addGuestScan`, `getGuestScans`, `clearGuestScans` | Sent on sign-in/up, then cleared (max 50) |
| Recent searches | `nutriscan_recent_searches` | `useRecentSearches()`, `addRecentSearch`, `removeRecentSearch`, `clearRecentSearches` | Max 30, newest first; cleared on sign-out |

---

## 🔧 Configuration

### Backend (`application.properties` → environment variables)

| Variable | Default | Purpose |
|:--|:--|:--|
| `PORT` | `8080` | HTTP port |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | `jdbc:postgresql://localhost:5432/nutriscandb` / `nutriscan` / `nutriscan_password` | Database. Production: Neon (password only as a secret). `DB_URL` / `DB_USER` / `DB_PASSWORD` are accepted aliases |
| `DB_POOL_MAX_SIZE` / `DB_POOL_MIN_IDLE` | `5` / `0` | HikariCP size, tuned for Neon (idle pool lets Neon suspend) |
| `DDL_AUTO` | `update` | Hibernate schema mode |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Guest quota store |
| `JWT_SECRET` | *(empty → dev-only secret + warning)* | **Required in any deployed environment** (≥ 32 bytes) |
| `DATABASE_URL` | *(unset)* | `postgresql://user:pass@host/db` from a hosting platform; converted to JDBC by `DatabaseUrlResolver` unless `DB_URL` is set |
| `REDIS_HEALTH_ENABLED` | `true` | Set `false` where no Redis runs, so `/actuator/health` stays UP |
| `JWT_EXPIRATION` | `7d` | Token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated web origins |
| `OPENROUTER_API_KEY` | *(unset)* | Enables AI estimate + AI summary |
| `OPENROUTER_MODEL` | `apodex/apodex-1.1-mini:free` | OpenRouter model id |
| `SEED_ENABLED` / `SEED_EMAIL` / `SEED_PASSWORD` / `SEED_USERNAME` / `SEED_FULL_NAME` | `false` / – / – / `demo_scout` / `Demo Scout` | Optional demo account (needs email + password) |
| `FORWARD_HEADERS_STRATEGY` | `none` | `native` behind a reverse proxy |
| `TEST_DB_URL` | `…/nutriscandb_test` | Integration-test database |

### Frontend (`.env.local`)

| Variable | Default | Purpose |
|:--|:--|:--|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api/v1` | API base URL (inlined at build time) |

---

## 🚀 Deployment view

A suggested production layout (not yet deployed):

```mermaid
flowchart LR
    U([Users]) --> CDN["Static hosting / CDN<br/>(Next.js build)"]
    U --> RP["Reverse proxy / LB<br/>HTTPS"]
    RP --> A1["nutriscan-api #1"] & A2["nutriscan-api #2"]
    A1 & A2 --> PG[("Managed PostgreSQL")]
    A1 & A2 --> RD[("Managed Redis<br/>shared guest quota")]
    A1 & A2 --> EXT["Open Food Facts · OpenRouter"]
```

> [!IMPORTANT]
> Before going live: set `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` and `FORWARD_HEADERS_STRATEGY=native` (all pre-set in `render.yaml`). For a long-lived production system, also switch `DDL_AUTO` to `validate` with a migration tool (e.g. Flyway). Step-by-step Render guide: [LEARN.md → Part G](LEARN.md#part-g-deployment-render-pe-free-hosting).

---

<div align="center">

[← Design system](03-DESIGN-SYSTEM.md) · [README](../../README.md) · [Project flow →](05-PROJECT-FLOW.md)

</div>
