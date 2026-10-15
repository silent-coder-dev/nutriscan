<div align="center">

# 🔄 NutriScan: Project Flow

**Step by step: what happens when someone uses NutriScan, from the first visit to a personalised result.**

![Flows](https://img.shields.io/badge/flows-10%20diagrams-2e6b46?style=flat-square)
![Diagrams](https://img.shields.io/badge/diagrams-Mermaid-ff3670?style=flat-square&logo=mermaid&logoColor=white)

[← Architecture](04-ARCHITECTURE.md) · [README](../../README.md)

</div>

---

## Contents

1. [Page map](#1-page-map)
2. [User journey](#2-user-journey)
3. [Scan a product (guest)](#3-scan-a-product-guest)
4. [Load the analysis and swaps](#4-load-the-analysis-and-swaps)
5. [Sign up / sign in and import guest scans](#5-sign-up--sign-in-and-import-guest-scans)
6. [First discovery and XP](#6-first-discovery-and-xp)
7. [Profile update and token refresh](#7-profile-update-and-token-refresh)
8. [Session expiry](#8-session-expiry)
9. [Recent searches and Clear](#9-recent-searches-and-clear)
10. [NutriBot state machine](#10-nutribot-state-machine)
11. [What the user sees when something goes wrong](#11-what-the-user-sees-when-something-goes-wrong)

---

## 1. Page map

```mermaid
flowchart LR
    H["🏠 Home /<br/>search · result · recents"]
    L["🔑 /login"]
    R["📝 /register"]
    D["📊 /dashboard<br/>stats · scan log"]
    P["⚙️ /profile<br/>account · diet · security"]
    RC[["🕘 Recent panel<br/>(modal, every page)"]]
    LB[["🏆 Leaderboard<br/>(modal, every page)"]]

    H -- Sign in --> L
    H -- Join free --> R
    L <--> R
    L -- success --> D
    R -- success --> D
    D -- "← Back to home / New scan" --> H
    D -- Edit profile --> P
    P -- "← Back to home" --> H
    H & D & P --> RC & LB
    RC -- "pick (from another page)<br/>/?scan=barcode" --> H
    D & P -. "not signed in" .-> L
```

---

## 2. User journey

```mermaid
journey
    title A shopper checking a jar of spread
    section Discover
      Opens NutriScan: 4: Shopper
      Taps the Nutella sample: 5: Shopper
    section Understand
      Reads NutriBot's take: 5: Shopper, NutriBot
      Sees "High in sugar · 14 teaspoons": 3: Shopper
      Checks the Veg mark and allergens: 4: Shopper
    section Decide
      Opens a better-rated swap: 5: Shopper
      Compares the Nutri-Score: 5: Shopper
    section Come back
      Creates a free account: 4: Shopper
      Adds allergies and diet: 4: Shopper
      Gets personal alerts on the next scan: 5: Shopper, NutriBot
```

---

## 3. Scan a product (guest)

```mermaid
sequenceDiagram
    autonumber
    actor U as Shopper
    participant W as Web (page.tsx)
    participant A as API (ProductController)
    participant RL as RateLimiter (Redis)
    participant PS as ProductService
    participant DB as PostgreSQL
    participant OFA as Open Food Facts

    U->>W: Type / scan barcode → "Check it"
    W->>W: Validate length (8, 12 or 13 digits)
    W->>A: GET /products/{barcode}
    A->>A: Barcode is 8–14 digits?
    A->>RL: tryConsume(client IP)
    alt quota used up
        RL-->>A: allowed = false
        A-->>W: 429 RATE_LIMIT_EXCEEDED
        W-->>U: "Sign in to keep going" + NutriBot confused
    else quota left
        RL-->>A: allowed, remaining = N
        A->>PS: inspectProduct(barcode)
        PS->>DB: findByBarcode
        alt already known
            DB-->>PS: product
        else new barcode
            PS->>OFA: GET product (only needed fields, 10 s timeout)
            OFA-->>PS: product data (English text preferred)
            PS->>DB: save (unique barcode)
        end
        PS-->>A: ProductResponse (+ vegStatus)
        A-->>W: 200 + X-RateLimit-Remaining: N
        W->>W: addRecentSearch · addGuestScan
        W-->>U: Product card + "N free scans left" + NutriBot reacts
    end
```

---

## 4. Load the analysis and swaps

The product card appears immediately; the analysis loads in parallel and shows a skeleton while waiting.

```mermaid
sequenceDiagram
    autonumber
    participant W as ProductCard
    participant A as API
    participant IS as ProductInsightService
    participant RE as Rule engines
    participant C as Caffeine caches
    participant ORT as OpenRouter (optional)
    participant SAL as OFF search-a-licious

    W->>A: GET /products/{barcode}/insights (AbortController)
    A->>IS: getInsights(barcode, user?)
    IS->>IS: ensureCategories() (old rows: fetch once, refresh English text)
    IS->>RE: ProductAnalyzer.analyze()
    RE-->>IS: verdict · summary · findings
    IS->>C: AI summary cached?
    alt not cached and key set
        IS->>ORT: summarise (facts only, 30 s timeout)
        ORT-->>IS: 2–3 sentences
        IS->>C: store (6 h)
    end
    IS->>C: alternatives cached?
    alt not cached
        IS->>SAL: category + better grades, by popularity
        SAL-->>IS: hits
        IS->>C: store best 4 (6 h)
    end
    opt signed in
        IS->>RE: PersonalAlertChecker.check(product, user)
    end
    IS-->>A: Insights
    A-->>W: 200 JSON
    W-->>W: Show NutriBot's take · verdict tag · swaps
```

> [!TIP]
> Tapping a swap calls the same scan flow (section 3) with the swap's barcode and scrolls back to the top.

---

## 5. Sign up / sign in and import guest scans

```mermaid
sequenceDiagram
    autonumber
    actor U as Shopper
    participant W as Web (register / login)
    participant A as AuthController
    participant AS as AuthService
    participant SS as ProductScanService
    participant DB as PostgreSQL

    U->>W: Fill the form (live rule checklist, username availability)
    W->>A: POST /auth/register { …, guestBarcodes }
    A->>A: Bean validation (username, email, password rules)
    A->>AS: register()
    AS->>DB: email / username already taken?
    alt taken
        AS-->>W: 409 CONFLICT "Username @x is already taken."
    else free
        AS->>DB: save user (bcrypt password)
        AS->>SS: migrateGuestScans(user, barcodes)
        SS->>DB: one scan per known product (dedupe, skip already logged)
        AS-->>W: 201 { token, profile, migratedScansCount }
        W->>W: clearGuestScans() · saveSession()
        W-->>U: Redirect to ?next= or /dashboard
    end
```

Sign-in is the same flow via `POST /auth/login` (username **or** email). Five wrong passwords lock the form for 30 seconds on the client.

---

## 6. First discovery and XP

```mermaid
flowchart TD
    A["Signed-in user scans a barcode"] --> B{"Product already in DB?"}
    B -- yes --> C["Record scan (no XP)"]
    B -- no --> D["Fetch from providers"]
    D --> E{"Source?"}
    E -- "Open Food Facts" --> F["Atomic UPDATE<br/>scout_score + 10, unique_discoveries + 1"]
    E -- "AI estimate" --> G["No XP (unverified)"]
    F --> H["Record scan as discovery"]
    G --> I["Record scan"]
    H --> J["Response: earnedPoints = 10,<br/>totalScoutScore"]
    J --> K["UI: '+10 XP · First discovery!'<br/>header and dashboard update live"]
```

- Level = `floor(XP / 50) + 1`.
- The leaderboard shows the top 10 users with more than 0 XP.

---

## 7. Profile update and token refresh

```mermaid
sequenceDiagram
    autonumber
    participant W as ProfileClient
    participant A as UserController
    participant US as UserService
    participant DB as PostgreSQL

    W->>A: PUT /users/profile (Bearer old token)
    A->>US: updateProfile(email from token, request)
    US->>US: Username changed? Check 20-day cooldown + availability
    US->>US: Email changed? Check not in use
    US->>DB: save
    US-->>A: profile + NEW token (subject = new email)
    A-->>W: 200
    W->>W: saveSession(new token, profile)
    Note over W: Saving twice in a row and changing email both keep working
```

---

## 8. Session expiry

```mermaid
sequenceDiagram
    participant W as Any page
    participant API as lib/api.ts
    participant S as API
    participant G as AuthGuard

    W->>API: apiRequest(..., { auth: true })
    API->>S: request with Bearer token
    S-->>API: 401 UNAUTHORIZED (JSON)
    API->>API: clearSession()
    API-->>W: throw ApiError(message)
    Note over G: useSession() sees no session
    G->>G: router.replace("/login?next=/dashboard")
```

---

## 9. Recent searches and Clear

```mermaid
flowchart TD
    S["Successful lookup"] --> AR["addRecentSearch(product)<br/>dedupe · newest first · max 30"]
    AR --> LS[("localStorage<br/>nutriscan_recent_searches")]
    LS --> CH["Home: 'Recent:' chips (last 5)"]
    LS --> NB["Nav bar: Recent (count)"]
    NB --> PANEL["Recent panel<br/>All · Veg · Non-veg filters"]
    PANEL -- "pick on Home" --> SCAN["scanCode(barcode)"]
    PANEL -- "pick elsewhere" --> URL["router.push('/?scan=barcode')"] --> HOME["Home reads ?scan= → scanCode"]
    CH --> SCAN
    PANEL -- "✕ / Clear all" --> LS
    OUT["Sign out"] --> CLR["clearRecentSearches()"] --> LS

    CLEAR["Clear button in search bar"] --> RESET["Empty input · remove result & errors<br/>scroll to top · focus input"]
```

---

## 10. NutriBot state machine

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> scanning: lookup starts
    scanning --> great: grade A/B
    scanning --> okay: grade C / unknown
    scanning --> yikes: grade D/E
    scanning --> confused: error / not found
    great --> scanning: next lookup
    okay --> scanning: next lookup
    yikes --> scanning: next lookup
    confused --> scanning: next lookup
    great --> idle: Clear
    okay --> idle: Clear
    yikes --> idle: Clear
    confused --> idle: Clear
    idle --> sleep: 30 s without interaction
    sleep --> idle: mouse move / poke / hover

    state "trick (≈1–2 s)" as trick
    idle --> trick: poke / Enter / Space
    great --> trick: poke
    okay --> trick: poke
    yikes --> trick: poke
    trick --> idle: done (returns to current mood)
```

Tricks cycle in order: **wave → giggle → spin → wink → sneeze → dance → jump**. Dragging shows a "Wheee!" face and snaps back.

---

## 11. What the user sees when something goes wrong

| Situation | API | What the UI shows |
|:--|:--|:--|
| Barcode wrong length | none (checked client-side) | Inline: *"That's 5 digits. Retail barcodes have 8, 12 or 13."* |
| Not a retail barcode (e.g. letters from a QR code) | `400` | Red notice with the API message |
| Product not in any database | `404` | *"Product not registered for barcode…"* + NutriBot "?" |
| Guest used 5 free scans | `429` | Amber notice + **Sign in to keep going** button |
| Wrong password | `401` | *"Invalid username/email or password credentials."* |
| Username/email taken | `409` | Message on the form |
| Session expired | `401` | Signed out automatically → login page with `?next=` |
| API not running | network error | *"Unable to reach the NutriScan server…"* |
| Analysis service hiccup | any | Product still shows; analysis card shows an inline error |
| Camera blocked / missing | browser | Friendly message + "Upload photo" tab |
| Product photo fails to load | browser | 📦 placeholder |

---

<div align="center">

[← Architecture](04-ARCHITECTURE.md) · [README](../../README.md)

</div>
