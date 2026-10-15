<div align="center">

# 📘 LEARN.md: NutriScan ko Andar se Samjho

### Hinglish guide · Backend focus · Interview ready

*"Main Spring seekh raha hoon aur backend developer banna chahta hoon." Ye file exactly isi ke liye hai.*

![Language](https://img.shields.io/badge/language-Hinglish-2e6b46?style=flat-square)
![Focus](https://img.shields.io/badge/focus-Spring%20Boot%20backend-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![Classes](https://img.shields.io/badge/backend%20classes-62%20explained-1f2d24?style=flat-square)
![Level](https://img.shields.io/badge/level-beginner%20→%20interview-b9502d?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-Render%20%2B%20Docker-46E3B7?style=flat-square&logo=render&logoColor=black)

[← README](../../README.md) · [Architecture (English)](04-ARCHITECTURE.md) · [Project flow (English)](05-PROJECT-FLOW.md)

</div>

---

## 🧭 Ye guide kaise padhein

| Step | Kya padhna hai | Time |
|:-:|:--|:--|
| 1 | [Part A: Big picture](#part-a-big-picture). Project kya hai, kaun kis se baat karta hai | 10 min |
| 2 | [Part B: Spring crash course](#part-b-spring-crash-course). Spring ke basic concepts **hamare hi code se** | 45 min |
| 3 | [Part C: Har class ka kaam](#part-c-har-class-ka-kaam-62-classes). Saari 62 classes, package by package | 60 min |
| 4 | [Part D: Request ka poora safar](#part-d-request-ka-poora-safar-flows). Ek request start se end tak | 30 min |
| 5 | [Part E: Deep dives](#part-e-deep-dives). Database, Security, Redis, External APIs, Errors, Testing | 60 min |
| 6 | [Part F: Interview prep](#part-f-interview-prep). Q&A, 2-minute pitch, common traps | 30 min |
| 7 | [Part G: Deployment (Render)](#part-g-deployment-render-pe-free-hosting). Docker, cloud database, step-by-step deploy, kya kiya / kya nahi kiya | 45 min |

> [!TIP]
> **Best tareeka:** IntelliJ mein backend kholo, aur har section padhte waqt us class ko side mein open rakho. `ProductController` pe ek **breakpoint** lagao, app ko Debug mode mein chalao, aur ek barcode scan karo. Phir step-by-step dekho ki request kahan-kahan jaati hai. Isse 10x jaldi samajh aayega.

**Symbols jo is file mein use hue hain:**

| Symbol | Matlab |
|:--|:--|
| 💡 | Concept samjho |
| 🎤 | Interview mein aise bolo (English mein ready answer) |
| ⚠️ | Common galti / trap |
| 🔍 | Hamare code mein yahan dekho |

---

# Part A: Big picture

## A1. NutriScan ek line mein

**Hinglish:** User kisi bhi packaged food ka barcode scan karta hai. Hamara backend us product ka data dhoondhta hai (pehle apne database mein, phir Open Food Facts se, phir AI se). Phir use simple bhasha mein samjhata hai: kitni sugar, salt, fat hai, veg hai ya non-veg, user ki allergy se clash karta hai ya nahi, aur better option kaunsa hai.

> 🎤 **Interview (English):** *"NutriScan is a full-stack app where users scan a food barcode and get a plain-language health analysis, allergy and diet alerts, a veg/non-veg mark and better-rated alternatives. I built the backend in Spring Boot with PostgreSQL, Redis and JWT security, integrating the Open Food Facts API and an optional LLM through OpenRouter."*

## A2. Kaun kis se baat karta hai

```mermaid
flowchart LR
    U(["🙋 User ka browser"]) --> FE["🖥️ Frontend<br/>Next.js (port 3000)"]
    FE -- "HTTP + JSON<br/>Authorization: Bearer token" --> BE["☕ Backend<br/>Spring Boot (port 8080)"]
    BE --> PG[("🐘 PostgreSQL<br/>users, products, scans")]
    BE --> RD[("🟥 Redis<br/>guest ka 5-scan counter")]
    BE --> OFF["🥫 Open Food Facts API<br/>product data + search"]
    BE -.-> AI["🤖 OpenRouter (AI)<br/>optional"]
```

## A3. Restaurant analogy (yaad rakhne ke liye)

Backend ko ek **restaurant** samjho:

| Restaurant mein | Hamare backend mein | Class example |
|:--|:--|:--|
| 🚪 Gate pe security guard (ID check karta hai) | **Filter** (JWT check) | `JwtAuthenticationFilter` |
| 🧑‍🍳 Waiter (order leta hai, plate deta hai) | **Controller** (request leta hai, response bhejta hai) | `ProductController` |
| 👨‍🍳 Chef (asli khana banata hai) | **Service** (business logic) | `ProductService` |
| 🏪 Store room (saaman rakhne ki jagah) | **Repository** (database se baat) | `ProductRepository` |
| 🥬 Bahar ka supplier (sabzi mandi) | **External API** | `OpenFoodFactsService` |
| 📋 Menu card ka format | **DTO** (data ka shape) | `ProductResponseDto` |
| 🧾 Complaint desk | **Exception handler** | `GlobalExceptionHandler` |

Waiter khud khana nahi banata, aur chef customer se baat nahi karta. **Har layer ka ek hi kaam.** Isi ko *Separation of Concerns* kehte hain.

## A4. Tech stack: kya, kyun, kahan

### Backend (main focus)

| Technology | Kya hai | Humne kyun use kiya | 🔍 Kahan |
|:--|:--|:--|:--|
| **Java 21** | Programming language | Strongly typed, fast, industry mein backend ke liye sabse common. Records jaise modern features. | poora backend |
| **Spring Boot 4.1** | Spring ke upar ready-made setup | Server, config, wiring sab automatic. Hum sirf logic likhte hain. | `NutriscanApiApplication` |
| **Spring Web MVC** | REST APIs banane ka module | `@RestController`, `@GetMapping` se easily endpoints. | `controller/` |
| **Spring Security** | Authentication/authorization | Har request pe check: kaun hai, kya access hai. | `SecurityConfig` |
| **JWT (JJWT library)** | Login token | Stateless login: server ko session yaad nahi rakhna padta. | `JwtUtil` |
| **BCrypt (jBCrypt)** | Password hashing | Password kabhi plain text mein save nahi hota. | `PasswordEncoder` |
| **Spring Data JPA + Hibernate** | Database ORM | SQL likhe bina Java objects ko tables mein save/fetch. | `repository/`, `entity/` |
| **PostgreSQL** | Relational database | Reliable, free, relations (user ↔ scans) ke liye perfect. | Docker |
| **Redis** | In-memory key-value store | Guest ka "5 scans/day" counter, fast + auto-expire (TTL). | `RateLimiterService` |
| **Caffeine** | Java in-memory cache | AI summary aur alternatives cache, taaki baar baar API call na ho. | `ProductInsightService` |
| **Bean Validation** | Input validation | `@NotBlank`, `@Pattern` se galat input pehle hi reject. | `dto/` |
| **Jackson** | JSON ↔ Java converter | Request JSON → Java object, Java object → response JSON. | automatic |
| **RestClient** | HTTP client (Spring ka) | Bahar ki APIs (Open Food Facts, OpenRouter) ko call karna. | `RestClientConfig` |
| **Lombok** | Boilerplate killer | Getters/setters/constructors/builders automatically. | almost har class |
| **Maven** | Build tool | Dependencies download, compile, test, package. | `pom.xml` |
| **JUnit + Mockito + MockMvc** | Testing | 61 tests: unit + full HTTP integration. | `src/test/` |

### Frontend (short mein)

| Technology | Kyun |
|:--|:--|
| **Next.js 16 + React 19** | Pages, routing, fast loading |
| **TypeScript** | Type safety, bugs kam |
| **Tailwind CSS 4** | Fast styling with design tokens |
| **Framer Motion** | NutriBot ke animations |
| **html5-qrcode** | Camera se barcode scan |

> 💡 Frontend ka kaam sirf **UI dikhana aur backend ko call karna** hai. Saara "dimaag" (business logic, security, data) **backend** mein hai. Isliye interview mein backend pe zyada sawal aayenge.

---

# Part B: Spring crash course

> Ye part un logon ke liye hai jo Spring abhi seekh rahe hain. Har concept **hamare project ke code** se samjhaya gaya hai.

## B1. Backend basics: HTTP, REST, JSON

**HTTP request** ke 4 important parts:

```http
GET /api/v1/products/3017620422003 HTTP/1.1     ← Method + URL (path)
Authorization: Bearer eyJhbGciOi...             ← Headers (extra info)
Content-Type: application/json
                                                 ← Body (POST/PUT mein data)
```

**HTTP methods** (REST mein inka matlab):

| Method | Matlab | Hamara example |
|:--|:--|:--|
| `GET` | Data **padho** | `GET /products/{barcode}` |
| `POST` | Naya **banao** / action | `POST /auth/register` |
| `PUT` | **Update** karo | `PUT /users/profile` |
| `DELETE` | **Hatao** | (abhi use nahi hua) |

**Status codes** (yaad rakho, interview mein pakka puchte hain):

| Code | Matlab | Hamare project mein kab |
|:--|:--|:--|
| `200 OK` | Sab theek | Product mil gaya |
| `201 Created` | Naya resource bana | Register successful |
| `400 Bad Request` | Tumhara input galat | Barcode "abc" bheja |
| `401 Unauthorized` | Pehchaan nahi (login nahi / token expired) | Bina token ke `/users/me` |
| `403 Forbidden` | Pehchaan hai par permission nahi | Access denied |
| `404 Not Found` | Cheez nahi mili | Product kahin nahi mila |
| `409 Conflict` | Data clash | Username already taken |
| `429 Too Many Requests` | Limit cross | Guest ke 5 scans khatam |
| `500 Internal Server Error` | Server ki galti | Unexpected bug |

> ⚠️ **401 vs 403** confuse mat karna: **401 = "tum kaun ho?"** (authentication fail), **403 = "pata hai tum kaun ho, par allowed nahi"** (authorization fail).

**REST** = URLs ko "resources" (nouns) ki tarah design karna: `/products/{barcode}`, `/users/me`, not `/getProductByBarcode`. Aur data **JSON** mein jaata/aata hai.

---

## B2. Spring Framework vs Spring Boot

| | Spring Framework | Spring Boot |
|:--|:--|:--|
| Kya hai | Core library: DI, MVC, Data, Security… | Spring ke upar **auto-configuration + starters + embedded server** |
| Setup | Bahut saari XML/Java config manually | Almost zero config: "convention over configuration" |
| Server | Tomcat alag se install karo, WAR deploy karo | **Tomcat andar hi aata hai**, bas `main()` chalao |

💡 **Simple bhasha mein:** Spring Framework = engine ke parts. Spring Boot = ready-made car. Engine wahi hai, par tumhe khud assemble nahi karna padta.

🔍 Hamara entry point:

```java
@SpringBootApplication   // = @Configuration + @EnableAutoConfiguration + @ComponentScan
@EnableCaching
public class NutriscanApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(NutriscanApiApplication.class, args);   // poora app yahin se start
    }
}
```

`@SpringBootApplication` teen kaam karta hai:
1. **`@ComponentScan`**: `com.nutriscan` aur uske saare sub-packages mein classes dhoondhta hai jin pe `@Component`, `@Service` etc. lage hain.
2. **`@EnableAutoConfiguration`**: `pom.xml` mein jo libraries hain (JPA, Security, Redis…) unke hisaab se khud setup karta hai. Jaise PostgreSQL driver dikha, to DataSource bana diya.
3. **`@Configuration`**: Ye class khud bhi config ho sakti hai.

> 🎤 *"Spring Boot is an opinionated layer on top of Spring. It gives auto-configuration, starter dependencies and an embedded server, so I can run the API with just a main method and focus on business logic."*

---

## B3. IoC aur Dependency Injection (Spring ka DIL ❤️)

Ye Spring ka **sabse important concept** hai. Interview mein 100% puchenge.

### Problem (bina Spring ke)

```java
// ❌ Bina DI ke: class khud apni dependencies banati hai
public class ProductService {
    private ProductRepository repo = new ProductRepository();      // tightly coupled
    private OpenFoodFactsService off = new OpenFoodFactsService(); // test kaise karoge?
}
```

Problems: har class khud objects banayegi, test mein fake (mock) object nahi daal sakte, aur ek change se sab jagah change.

### Solution: IoC (Inversion of Control)

**Object banane ka control tumse le liya gaya aur Spring ko de diya gaya.** Spring ek "container" (`ApplicationContext`) banata hai. Usme saare objects (**Beans**) banake rakhta hai, aur jisko jo chahiye wo **inject** kar deta hai.

🔍 Hamara real code: `ProductService`

```java
@Service
public class ProductService {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductScanService productScanService;
    private final List<ProductProvider> providers;     // 👈 saare providers ki LIST inject hoti hai!

    public ProductService(ProductRepository productRepository, UserRepository userRepository,
                          ProductScanService productScanService, List<ProductProvider> providers) {
        // Spring khud ye 4 cheezein bana ke yahan pass karta hai
        ...
    }
}
```

`ProductService` ne kahin `new` nahi likha. Spring ne startup pe dekha "isko 4 cheezein chahiye", pehle wo banayi, phir `ProductService` banaya. Ye hai **Constructor Injection**.

```mermaid
flowchart LR
    subgraph IOC["🫙 Spring ApplicationContext (IoC container)"]
        R1["ProductRepository bean"]
        R2["UserRepository bean"]
        S1["ProductScanService bean"]
        P1["OpenFoodFactsProductProvider bean"]
        P2["AiProductProvider bean"]
        PS["ProductService bean"]
    end
    R1 --> PS
    R2 --> PS
    S1 --> PS
    P1 -- "List&lt;ProductProvider&gt;" --> PS
    P2 -- "List&lt;ProductProvider&gt;" --> PS
```

### Bean kya hota hai?

**Bean = koi bhi object jo Spring ne banaya aur manage kiya.** By default har bean **singleton** hota hai: poore app mein uska sirf **ek** object. Isliye services mein request-specific data ko field mein store nahi karte (thread-safety!).

### Injection ke 3 tareeke

| Tareeka | Example | Recommend? |
|:--|:--|:--|
| **Constructor injection** | `public ProductService(ProductRepository r) {…}` | ✅ **Best**: fields `final`, testing easy, dependency missing ho to app start hi nahi hoga |
| Setter injection | `@Autowired public void setRepo(…)` | Optional dependencies ke liye |
| Field injection | `@Autowired private ProductRepository repo;` | ❌ Avoid: test mein mock daalna mushkil |

Hum **hamesha constructor injection** use karte hain. Lombok ka `@RequiredArgsConstructor` saare `final` fields ka constructor khud bana deta hai:

```java
@Service
@RequiredArgsConstructor          // 👈 Lombok: constructor auto-generate
public class AuthService {
    private final UserRepository userRepository;
    private final ProductScanService productScanService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
}
```

> 💡 Spring 4.3+ mein agar class ka **ek hi constructor** hai to `@Autowired` likhne ki zaroorat nahi.

### Ek interface, kai implementations: `List<ProductProvider>`

`ProductProvider` ek interface hai jiske 2 beans hain (`OpenFoodFactsProductProvider`, `AiProductProvider`). Jab hum `List<ProductProvider>` maangte hain, Spring **dono** ki list de deta hai. Phir hum priority se sort karte hain. Naya source add karna ho? Bas ek nayi `@Component` class banao jo `ProductProvider` implement kare, aur `ProductService` mein kuch change nahi karna padega. *(Open/Closed principle!)*

### Same type ke 2 beans: `@Qualifier`

`RestClientConfig` mein **3 `RestClient` beans** hain. Agar koi class sirf `RestClient` maange, Spring confuse ho jayega ("kaunsa doon?"). Isliye naam se maangte hain:

```java
public OpenFoodFactsService(
        @Qualifier("openFoodFactsRestClient") RestClient restClient,
        @Qualifier("openFoodFactsSearchRestClient") RestClient searchClient) { ... }
```

> ⚠️ Lombok ka `@RequiredArgsConstructor` `@Qualifier` ko constructor tak copy **nahi** karta. Isliye yahan humne constructor **haath se** likha.

> 🎤 *"IoC means the framework creates and wires objects instead of my code doing it. Spring keeps beans in the ApplicationContext and injects them, mainly through constructor injection, which keeps classes loosely coupled and easy to test with mocks."*

---

## B4. Stereotype annotations: kaunsi class pe kya lagta hai

| Annotation | Matlab | Hamare examples |
|:--|:--|:--|
| `@Component` | General bean | `JwtAuthenticationFilter`, `ProductMapper`, `PasswordEncoder`, providers |
| `@Service` | Business logic bean (semantically `@Component`) | `ProductService`, `AuthService`, `RateLimiterService` |
| `@Repository` | DB access bean. Spring Data interfaces ko ye automatically milta hai | `ProductRepository` (interface) |
| `@RestController` | `@Controller` + `@ResponseBody`: return value seedha JSON ban jaati hai | `ProductController` |
| `@Configuration` | Config class jisme `@Bean` methods hain | `SecurityConfig`, `RestClientConfig` |
| `@RestControllerAdvice` | Saare controllers ke liye global exception handler | `GlobalExceptionHandler` |

### `@Component` vs `@Bean`: kab kya?

| `@Component` (class pe) | `@Bean` (method pe, `@Configuration` ke andar) |
|:--|:--|
| **Apni** class ho to | **Bahar ki library** ka object ho, ya custom setup chahiye |
| `@Component class ProductMapper` | `@Bean RestClient openFoodFactsRestClient()` (RestClient Spring ki class hai, hum usko timeouts ke saath configure kar rahe hain) |

🔍 `RestClientConfig` (simplified):

```java
@Configuration
public class RestClientConfig {
    @Bean
    public RestClient openFoodFactsRestClient() {
        return RestClient.builder()
                .baseUrl("https://world.openfoodfacts.org")
                .requestFactory(requestFactory(Duration.ofSeconds(5), Duration.ofSeconds(10)))  // timeouts!
                .defaultHeader(HttpHeaders.USER_AGENT, "NutriScan/1.0")
                .build();
    }
    // + openFoodFactsSearchRestClient(), openRouterRestClient()
}
```

---

## B5. Configuration: `application.properties`, `@Value`, profiles

🔍 `src/main/resources/application.properties` (kuch lines):

```properties
server.port=${PORT:8080}
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/nutriscandb}
app.jwt.secret=${JWT_SECRET:}          # khaali = local dev secret + warning (deploy pe zaroor set karo)
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3000}
spring.jpa.open-in-view=false
spring.data.redis.timeout=2s
```

💡 `${DB_URL:default}` ka matlab: **environment variable `DB_URL` ho to wo use karo, warna default.** Isse code change kiye bina dev/prod alag config de sakte ho. (12-factor app principle)

**`@Value`**: property ko Java field/parameter mein lana:

```java
public JwtUtil(@Value("${app.jwt.secret:}") String secret,
               @Value("${app.jwt.expiration:7d}") Duration expiration) { ... }
```

Spring `"7d"` ko automatically `Duration` (7 din) mein convert kar deta hai. 😎

**Profiles**: tests ke liye `application-test.properties` hai (alag database, seed off). Test class pe `@ActiveProfiles("test")` lagate hi wo file load hoti hai.

**Conditional bean**: `DataInitializer` pe `@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")`. Property true **na** ho to ye bean **banega hi nahi** (default off).

---

## B6. Starters aur auto-configuration

`pom.xml` mein ye "starters" hain. Har starter apne saath poora set laata hai:

| Starter | Kya milta hai |
|:--|:--|
| `spring-boot-starter-webmvc` | Spring MVC + embedded **Tomcat** + Jackson |
| `spring-boot-starter-data-jpa` | Hibernate + Spring Data + HikariCP |
| `spring-boot-starter-security` | Spring Security filter chain |
| `spring-boot-starter-validation` | Hibernate Validator (`@NotBlank` etc.) |
| `spring-boot-starter-data-redis` | Lettuce Redis client + `StringRedisTemplate` |
| `spring-boot-starter-actuator` | `/actuator/health` jaise endpoints |
| `postgresql` | DB driver |
| `caffeine`, `jjwt`, `jbcrypt`, `commons-text`, `lombok` | Extra libraries |

💡 **Auto-configuration magic:** classpath pe `postgresql` driver + `spring.datasource.url` dikha, to Spring Boot ne **khud** `DataSource`, `EntityManagerFactory`, `TransactionManager` bana diye. `spring-data-redis` dikha, to `StringRedisTemplate` bean ready. Humne inme se kuch bhi manually nahi banaya!

---

## B7. Layered architecture

```mermaid
flowchart TB
    C["🧑‍🍳 Controller layer<br/>HTTP in/out, validation trigger<br/>(@RestController)"]
    S["👨‍🍳 Service layer<br/>business logic, transactions<br/>(@Service)"]
    R["🏪 Repository layer<br/>database queries<br/>(Spring Data JPA)"]
    D[("🐘 Database")]
    X["🥬 Integration layer<br/>external APIs<br/>(RestClient)"]
    C --> S --> R --> D
    S --> X
```

**Rule:** upar wali layer neeche wali ko call karti hai, ulta kabhi nahi. Controller kabhi repository ko seedha call nahi karta (hamare refactor mein `UserController` se `UserRepository` hata ke `UserService` ke through kiya).

---

## B8. Ek request Spring ke andar kaise chalti hai

```mermaid
flowchart LR
    A["🌐 HTTP request"] --> T["Tomcat<br/>(thread milta hai)"]
    T --> F["Filter chain<br/>CORS → JWT → Security"]
    F --> DS["DispatcherServlet<br/>(front controller)"]
    DS --> HM["HandlerMapping<br/>URL → method dhoondo"]
    HM --> MC["Message converter<br/>JSON → DTO (Jackson)"]
    MC --> V["@Valid<br/>validation"]
    V --> CT["Controller method"]
    CT --> SV["Service → Repository"]
    SV --> CT
    CT --> J["Jackson<br/>DTO → JSON"]
    J --> RES["HTTP response"]
```

1. **Tomcat** request leta hai aur ek **thread** assign karta hai (default ~200 threads ka pool).
2. **Filters** chalte hain (Spring Security ke filters + hamara `JwtAuthenticationFilter`).
3. **DispatcherServlet**: Spring MVC ka "receptionist". Har request isi se guzarti hai.
4. **HandlerMapping**: `@GetMapping("/{barcode}")` dekh ke sahi controller method choose karta hai.
5. **HttpMessageConverter (Jackson)**: `@RequestBody` wale JSON ko Java object (DTO) mein badalta hai.
6. **`@Valid`**: DTO ke annotations check hote hain. Fail hua to exception aur 400.
7. **Controller → Service → Repository** chalte hain.
8. Return kiya hua object **Jackson** se wapas JSON banta hai.

> 💡 **Filter vs Interceptor:** Filter servlet level pe hai (DispatcherServlet se **pehle**). Security, CORS, logging ke liye. Interceptor Spring MVC level pe hai (DispatcherServlet ke **baad**, controller se pehle). Humne JWT check **Filter** mein kiya kyunki Spring Security bhi filters pe hi bana hai.

---

## B9. Annotations cheat sheet (sab jo hamare code mein hain)

<details open>
<summary><b>Web / Controller</b></summary>

| Annotation | Kaam | Example |
|:--|:--|:--|
| `@RestController` | JSON API controller | `ProductController` |
| `@RequestMapping("/api/v1/products")` | Class-level base URL | sab controllers |
| `@GetMapping`, `@PostMapping`, `@PutMapping` | HTTP method + path | `@GetMapping("/{barcode}")` |
| `@PathVariable` | URL ka hissa → parameter | `{barcode}` → `String barcode` |
| `@RequestParam` | `?username=x` → parameter | `check-username` |
| `@RequestBody` | JSON body → DTO | register/login |
| `@Valid` | DTO validation trigger | `@Valid @RequestBody RegisterRequestDto` |
| `@AuthenticationPrincipal` | Logged-in user (hamare case mein email string) | `UserController` |
| `ResponseEntity<T>` | Status + headers + body control | `ResponseEntity.status(201).body(...)` |

</details>

<details open>
<summary><b>Validation (DTO fields)</b></summary>

| Annotation | Kaam |
|:--|:--|
| `@NotBlank` | null / empty / sirf spaces nahi chalega |
| `@Email` | Email format |
| `@Size(max = 255)` | Length limit (DB column 255 hai, isliye) |
| `@Pattern(regexp = …)` | Regex se check (username, password rules) |

</details>

<details open>
<summary><b>JPA / Entity</b></summary>

| Annotation | Kaam |
|:--|:--|
| `@Entity` | Ye class ek DB table hai |
| `@Table(name = "products", indexes = …)` | Table ka naam + index |
| `@Id` + `@GeneratedValue(strategy = IDENTITY)` | Primary key, DB auto-increment |
| `@Column(unique = true, nullable = false, length = 50)` | Column constraints |
| `@Column(columnDefinition = "TEXT")` | Lambi text (255 se zyada) |
| `@Enumerated(EnumType.STRING)` | Enum ko naam se save karo (`"AI_ESTIMATE"`), number se nahi |
| `@ManyToOne(fetch = LAZY)` + `@JoinColumn` | Relationship (bahut saare scans → ek user) |
| `@CreationTimestamp` / `@UpdateTimestamp` | Hibernate time khud bharega |
| `@PrePersist` / `@PreUpdate` | Save se pehle chalne wale methods |
| `@Query` | Custom JPQL query |
| `@Modifying` | UPDATE/DELETE query |
| `@Transactional` | Ek transaction mein chalao |

</details>

<details open>
<summary><b>Lombok</b></summary>

| Annotation | Kya generate karta hai |
|:--|:--|
| `@Getter` / `@Setter` | getters/setters |
| `@NoArgsConstructor` / `@AllArgsConstructor` | Constructors (JPA ko no-args chahiye) |
| `@RequiredArgsConstructor` | `final` fields ka constructor (DI ke liye) |
| `@Builder` / `@Builder.Default` | `User.builder().email(..).build()` style |
| `@Slf4j` | `log` variable (logging) |

</details>

---

# Part C: Har class ka kaam (62 classes)

## C0. Package map

```text
com.nutriscan
├── NutriscanApiApplication     🚀 main()
├── config/       ⚙️  Setup: Security, CORS, HTTP clients, seed user, cache, password hashing
├── controller/   🧑‍🍳 HTTP endpoints (waiters)
├── service/      👨‍🍳 Business logic + rule engines (chefs)
├── provider/     🔗 Product data sources (chain)
├── repository/   🏪 Database access
├── entity/       🗄️ DB tables as Java classes
├── dto/          📋 Request/response shapes
├── mapper/       🔄 External data → Entity
├── parser/       🧾 AI response reading
├── prompt/       💬 AI prompts
├── security/     🛡️ JWT filter, JSON 401/403
├── exception/    🚨 Error handling
└── util/         🧰 Small helpers (barcode, JWT, IP)
```

```mermaid
flowchart TB
    subgraph CTRL["controller"]
        AC[AuthController]
        PC[ProductController]
        UC[UserController]
    end
    subgraph SVC["service"]
        AS[AuthService]
        US[UserService]
        PS[ProductService]
        PIS[ProductInsightService]
        PSS[ProductScanService]
        RLS[RateLimiterService]
        OFFS[OpenFoodFactsService]
        ORS[OpenRouterService]
    end
    subgraph RULES["service (rule engines)"]
        PA[ProductAnalyzer]
        PAC[PersonalAlertChecker]
        VC[VegClassifier]
        HVC[HealthVerdictCalculator]
    end
    subgraph PROV["provider"]
        OFP[OpenFoodFactsProductProvider]
        AIP[AiProductProvider]
    end
    subgraph REPO["repository"]
        UR[UserRepository]
        PR[ProductRepository]
        SR[ProductScanRepository]
    end
    AC --> AS
    UC --> US
    PC --> PS & PIS & RLS
    AS --> UR & PSS
    US --> UR & PSS
    PS --> PR & UR & PSS & OFP & AIP
    PIS --> PR & UR & OFFS & ORS & PA & PAC
    PSS --> SR & PR
    OFP --> OFFS
    AIP --> ORS
```

---

## C1. 🚀 Root

### `NutriscanApiApplication`
- **Kya karta hai:** App ka starting point (`main` method). Start hone se pehle `DatabaseUrlResolver.applyFromEnvironment()` chalata hai, jo Render jaise hosts ka `DATABASE_URL` Spring ke JDBC format mein badal deta hai ([Part G](#g3-deploy-ke-liye-humne-kya-kya-kiya)).
- **Annotations:** `@SpringBootApplication` (scan + auto-config), `@EnableCaching` (Spring cache abstraction on).
- **Interview point:** "`SpringApplication.run()` ApplicationContext banata hai, saare beans create karta hai, aur embedded Tomcat start karta hai."

---

## C2. ⚙️ `config` package (6 classes)

### `SecurityConfig` 🛡️ (bahut important)
**Kya karta hai:** Batata hai ki kaunsa URL public hai, kaunsa login maangta hai, aur JWT filter kahan lagega.

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)            // token-based API: CSRF ki zaroorat nahi
        .cors(Customizer.withDefaults())                  // CorsConfig wala bean use karo
        .httpBasic(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))  // no sessions
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint(securityErrorHandler)   // 401 JSON
            .accessDeniedHandler(securityErrorHandler))       // 403 JSON
        .authorizeHttpRequests(auth -> auth
            .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
            .requestMatchers("/api/v1/auth/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/users/leaderboard").permitAll()
            .anyRequest().authenticated())                    // baaki sab ke liye login zaroori
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

**Har line kyun:**
- `csrf disable`: CSRF attack **cookies** pe depend karta hai. Hum token header mein bhejte hain, cookies nahi, isliye safe hai.
- `STATELESS`: Server koi session (HttpSession) nahi rakhta. Har request apna JWT laati hai. Isse **horizontal scaling** easy: kisi bhi server pe request jaaye, chalega.
- `/error` + `ERROR` dispatch permit: ⚠️ **Hamara asli bug fix!** Pehle validation error aane pe Spring internally `/error` pe forward karta tha, aur Security use bhi block karke **khaali 403** de deta tha. User ko kabhi asli message nahi dikhta tha.
- `addFilterBefore`: hamara JWT filter Spring ke login filter se **pehle** chale, taki user pehle se "logged in" mark ho jaye.

### `CorsConfig`
**CORS kya hai?** Browser security rule: `localhost:3000` (frontend) se `localhost:8080` (backend) pe call **alag origin** hai. Backend ko explicitly bolna padta hai "haan, 3000 allowed hai".

```java
@Value("${app.cors.allowed-origins:http://localhost:3000}")
private List<String> allowedOrigins;          // comma-separated → List automatically
...
config.setExposedHeaders(List.of("X-RateLimit-Remaining"));   // frontend ye header padh sake
```

> 💡 Browser pehle ek **preflight `OPTIONS`** request bhejta hai ("kya main ye kar sakta hoon?"). Isliye `OPTIONS /**` permit hai aur JWT filter OPTIONS ko skip karta hai.

### `RestClientConfig`
3 `RestClient` beans: Open Food Facts (5 s connect / 10 s read), search-a-licious (5 s / 8 s), OpenRouter (5 s / 30 s).
**Kyun timeouts?** ⚠️ Pehle timeout nahi tha. Agar bahar ka server hang ho jaata, to hamara Tomcat thread **forever** atak jaata. 200 threads atke = app dead. Ab max 30 sec.

### `PasswordEncoder`
jBCrypt ka chhota wrapper: `encode()` hash banata hai (cost 10), `matches()` check karta hai.
> 💡 BCrypt **salt** khud hash ke andar store karta hai, isliye same password ke do hash alag dikhte hain. Aur ye jaan-boojh ke **slow** hai, taki brute-force mehenga pade.

### `DataInitializer`
`CommandLineRunner` implement karta hai, matlab app start hote hi `run()` chalta hai. Optional demo user bana deta hai, **sirf** jab `SEED_ENABLED=true` ho aur `SEED_EMAIL` + `SEED_PASSWORD` env vars diye hon. Default: **off**.
⚠️ **Bug fix 1:** Pehle har restart pe user **delete + recreate** hota tha. User ki scan history ho to foreign key error aur **app start hi nahi hota tha!** Ab sirf "create if missing".
⚠️ **Bug fix 2 (deploy se pehle):** Pehle code mein **asli email aur password hardcoded** the. Public GitHub pe ye leak ho jaate! Ab code mein koi credential nahi, sab env vars se.

### `CacheConfig`
`ConcurrentMapCacheManager("products")` bean (Spring's `@Cacheable` ke liye). **Honest note:** abhi koi method `@Cacheable` use nahi karta; hamare caches Caffeine se directly bane hain (`ProductInsightService`). Ye future use ke liye hai.

---

## C3. 🧑‍🍳 `controller` package (3 classes)

> Controller ka rule: **patla (thin) rakho.** Sirf HTTP ka kaam: input lo, service ko do, response bhejo. Logic service mein.

### `AuthController` (`/api/v1/auth`)

```java
@PostMapping("/register")
public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
}
```
- `POST /register` → **201**, `POST /login` → 200, `GET /check-username` → `{available: true/false}`.
- Koi `try/catch` nahi! Errors `GlobalExceptionHandler` sambhalta hai. (Pehle har method mein try/catch tha, jo galat status deta tha.)

### `ProductController` (`/api/v1/products`): sabse interesting

```java
@GetMapping("/{barcode}")
public ResponseEntity<ProductResponseDto> getProductByBarcode(
        @PathVariable String barcode, HttpServletRequest request, Principal principal) {

    String cleanBarcode = barcode.trim();
    if (!Barcodes.isWellFormed(cleanBarcode)) {                     // 1️⃣ format check pehle
        throw ApiException.badRequest("Barcodes are 8 to 14 digits ...");
    }

    String userEmail = (principal != null) ? principal.getName() : null;   // 2️⃣ guest ya user?

    Long remainingScans = null;
    if (userEmail == null) {                                         // 3️⃣ guest → rate limit
        RateLimiterService.Result quota = rateLimiterService.tryConsume(ClientIpUtil.getClientIp(request));
        if (!quota.allowed()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMIT_EXCEEDED", "You have used your 5 free scans...");
        }
        remainingScans = quota.remaining();
    }

    ProductResponseDto dto = productService.inspectProduct(cleanBarcode, userEmail)   // 4️⃣ asli kaam
            .orElseThrow(() -> ApiException.notFound("Product not found for barcode: " + cleanBarcode));

    ResponseEntity.BodyBuilder ok = ResponseEntity.ok();
    if (remainingScans != null) ok.header("X-RateLimit-Remaining", String.valueOf(remainingScans));
    return ok.body(dto);
}
```

**Important design decisions:**
- Barcode check **rate limit se pehle**: galat barcode pe guest ka free scan waste na ho.
- "Guest" ka matlab **valid token nahi hai** (`principal == null`), "header nahi hai" nahi. ⚠️ **Security bug fix:** pehle `Authorization: Bearer garbage` bhejke koi bhi unlimited scans le sakta tha!
- `Principal`: Spring Security logged-in user ko yahan inject karta hai (anonymous ho to `null`).
- Doosra endpoint `GET /{barcode}/insights`: analysis + swaps + personal alerts. Rate limit **nahi** (product pehle se DB mein hona chahiye).

### `UserController` (`/api/v1/users`)
- `GET /leaderboard` (public), `GET /me`, `GET /me/scans`, `PUT /profile`, `POST /change-password` (JWT zaroori).
- `@AuthenticationPrincipal String currentUserEmail`: JWT filter ne principal mein **email string** rakha tha, wahi yahan milta hai.

---

## C4. 👨‍🍳 `service` package (13 classes)

### `ProductService` (lookup ka orchestrator)
**Flow:** local DB → nahi mila to providers chain → save → XP → scan record → DTO.

```java
// (simplified: asli code ProductService.java mein dekho)
public Optional<ProductResponseDto> inspectProduct(String barcode, String userEmail) {
    User user = findUser(userEmail).orElse(null);

    Optional<Product> localProduct = productRepository.findByBarcode(barcode);
    if (localProduct.isPresent()) { ... return; }           // 1. DB hit, sabse fast

    Optional<Product> fetched = fetchFromProviders(barcode); // 2. OFF → AI
    if (fetched.isEmpty()) return Optional.empty();

    try {
        saved = productRepository.saveAndFlush(fetched.get());   // 3. save
        isNewDiscovery = true;
    } catch (DataIntegrityViolationException e) {
        saved = productRepository.findByBarcode(barcode).orElseThrow(() -> e);  // race condition!
        isNewDiscovery = false;
    }

    if (user != null && isNewDiscovery && saved.getSource() == ProductSource.OPEN_FOOD_FACTS) {
        userRepository.awardDiscovery(user.getId(), DISCOVERY_POINTS);  // 4. atomic +10 XP
    }
    ...
}
```

**3 interview-worthy points:**
1. **Race condition handling:** 2 users ek saath same naya barcode scan karein, to dono save karne jayenge. Barcode `unique` hai, isliye doosre ko `DataIntegrityViolationException` milega. Hum use catch karke pehle wale ka row use karte hain. Crash nahi hota.
2. **Jaan-boojh ke `@Transactional` NAHI lagaya:** Bahar ki API call 10 sec le sakti hai. Transaction khula rahega to DB connection itni der busy rahega (pool sirf 20 ka hai!). Isliye har DB call apni chhoti transaction mein hai.
3. **AI products ko XP nahi:** warna koi random barcodes daal ke AI se fake products banwa ke points farm kar leta.

### `ProductInsightService` ("NutriBot's take" banata hai)
4 cheezein combine karta hai: **rule analysis** + **AI summary** (optional) + **alternatives** + **personal alerts**.
- 3 **Caffeine caches** (6 hour TTL): `aiSummaries`, `alternatives`, `categoryLookups`.
- **AI summary sirf success pe cache:** fail hua to agli request dobara try karegi.
- `ensureCategories()`: purane products jinke paas category nahi thi, unke liye ek baar Open Food Facts se fetch karke **self-repair** (English allergens bhi).
- `betterGrades()`: current grade se better grades: E → a,b,c; C → a,b; A → kuch nahi.
- Personal alerts **kabhi cache nahi**: ye har user ke liye alag hain.

### `ProductAnalyzer` (rule engine 🧠)
Pure **static** class: koi bean nahi, koi DB nahi. Input `Product`, output `Analysis(verdict, summary, highlights, beverage)`.
- UK **FSA traffic-light** thresholds: food (per 100 g) aur drinks (per 100 ml) ke alag limits.
- Sugar ko teaspoons mein (4 g = 1 tsp), calories ko "2000 kcal ka kitna %".
- Palm oil (regex: "palm", "palme", "palma" but "palmitate" nahi), sweeteners, E-number additives detect.
- **Kyun static/pure?** Easy unit testing (no mocks), fast, deterministic.

### `PersonalAlertChecker`
User ki allergies/diet/medical notes vs label text. Keyword matching with **false-friend handling**: "peanut butter" dairy nahi hai par peanut hai; "eggplant" egg nahi; "coconuts" mein "nuts" match nahi (word-start regex).

### `VegClassifier`
India (FSSAI) wala veg/non-veg: meat/fish/egg/gelatin → `NON_VEG`; milk/honey veg. "May contain traces of egg" ignore. Whole-word match ("cod" ≠ "codium").

### `HealthVerdictCalculator`
`Clean / Moderate / Avoid`: Nutri-Score A/B → Clean, C → Moderate, D/E → Avoid; grade na ho to FSA thresholds.

### `RateLimiterService` (Redis + fallback)

```java
// (simplified)
private long increment(String key) {
    if (System.currentTimeMillis() >= redisRetryAtMillis) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);    // Redis INCR (atomic)
            if (count != null) {
                if (count == 1 || ...) redisTemplate.expire(key, WINDOW_DURATION);   // 24h TTL
                return count;
            }
        } catch (RuntimeException e) {
            redisRetryAtMillis = System.currentTimeMillis() + 30_000;   // 30 sec Redis ko skip karo
        }
    }
    return localCounters.get(key, k -> new AtomicLong()).incrementAndGet();  // Caffeine fallback
}
```
- Key: `rate:guest:<ip>`, value: count. 5 se zyada → 429.
- ⚠️ **Bug fix:** Redis band hone pe pehle har guest request **500** deti thi. Ab memory fallback (**graceful degradation**). Aur fail ke baad 30 sec Redis ko try hi nahi karte, warna har request 2 sec timeout wait karti (ye ek mini **circuit breaker** hai).

### `AuthService`
- `register()`: email/username exists? → **409**. Password BCrypt → save → guest scans migrate → JWT banao.
- `login()`: username **ya** email se dhoondo → password match → JWT. Galat ho to same message ("Invalid username/email or password"), taki attacker ko pata na chale ki email exist karta hai ya nahi.

### `UserService`
- `updateProfile()`: username 20 din mein ek baar; email change ho to **naya JWT return** (⚠️ bug fix: purane token ka subject purana email tha, to email badalte hi user logout ho jaata tha).
- `requireUser()`: token valid hai par user DB mein nahi, to **401** (session invalid maano).
- `getLeaderboard()`: `PageRequest.of(0, 10)` se top 10.

### `ProductScanService`
- `recordScan()`: har scan history mein (`@Transactional`).
- `migrateGuestScans()`: login ke waqt guest ke barcodes ko history mein daalo (duplicates skip, max 50).
- `getRecentScans()`: `@Transactional(readOnly = true)`, last 100.

### `OpenFoodFactsService`
- `fetchProductByBarcode()`: `?fields=` se **sirf zaroori fields** maangta hai (poora product JSON bahut bada hota hai). 404 = normal "nahi mila" (error nahi).
- `searchByCategory()`: search-a-licious pe Lucene query: `categories_tags:"en:colas" AND nutriscore_grade:(a OR b)`.

### `OpenRouterService`
- `isConfigured()`: API key nahi to AI calls **skip** (pehle bina key ke bhi call karke 401 khata tha).
- `fetchProductFromAi()` (unknown barcode) aur `summarizeProduct()` (summary).

### `IngredientSimplifierService`
French/Spanish ingredient words → English dictionary ("sucre" → "Sugar", "huile de palme" → "Palm Oil") + HTML un-escape (`&amp;` → `&`) via Apache Commons Text.

---

## C5. 🔗 `provider` package (3 classes): Chain of Responsibility

```java
public interface ProductProvider {
    Optional<Product> fetchProduct(String barcode);
    int getPriority();      // kam number = pehle try
}
```

| Class | Priority | Kya karta hai |
|:--|:-:|:--|
| `OpenFoodFactsProductProvider` | 1 | OFF se laao → `ProductMapper` → ingredients simplify |
| `AiProductProvider` | 2 | Sirf **valid GS1 check digit** wale barcode pe AI se poochho; result `AI_ESTIMATE` tag |

💡 **Chain of Responsibility pattern:** request ek-ek handler ko di jaati hai jab tak koi handle na kar le. Naya source (jaise koi Indian food DB) = nayi class, baaki code same.

---

## C6. 🏪 `repository` package (3 interfaces)

> **Spring Data JPA ka jadoo:** tum sirf **interface** likhte ho, implementation Spring runtime pe khud bana deta hai!

### `ProductRepository`
```java
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByBarcode(String barcode);   // method name se query ban jaati hai!
}
```
`JpaRepository` se free mein milta hai: `save()`, `findById()`, `findAll()`, `delete()`, `saveAndFlush()`, pagination…
`findByBarcode` → Spring khud banata hai: `SELECT p FROM Product p WHERE p.barcode = ?`. Ye **derived query** hai.

### `UserRepository`

```java
@Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:identifier) OR LOWER(u.username) = LOWER(:identifier)")
Optional<User> findByEmailOrUsername(@Param("identifier") String identifier);   // custom JPQL

boolean existsByEmail(String email);               // derived: SELECT COUNT > 0
List<User> findLeaderboard(Pageable pageable);     // @Query + Pageable = LIMIT 10

@Transactional
@Modifying(clearAutomatically = true, flushAutomatically = true)
@Query("UPDATE User u SET u.scoutScore = COALESCE(u.scoutScore, 0) + :points, " +
       "u.uniqueDiscoveries = COALESCE(u.uniqueDiscoveries, 0) + 1 WHERE u.id = :userId")
int awardDiscovery(@Param("userId") Long userId, @Param("points") int points);
```

- **JPQL** SQL jaisa dikhta hai par **Entity names** (`User`, `u.scoutScore`) use karta hai, table names nahi.
- ⚠️ **Bug fix 1:** `@Param` galat package se import tha (`io.lettuce…`). Sahi: `org.springframework.data.repository.query.Param`.
- ⚠️ **Bug fix 2:** method ka naam `findTop10By…` tha par `@Query` laga tha. **`@Query` hone pe naam wala "Top10" ignore hota hai!** Saare users aate the. Fix: `Pageable` se limit.
- ⚠️ **Bug fix 3 (race condition):** pehle XP aise badhta tha: user read karo → +10 → save. 2 requests ek saath = ek update kho jaata. Ab **ek atomic SQL UPDATE** (`score = score + 10`). DB khud lock sambhalta hai.

### `ProductScanRepository`

```java
@Query("SELECT s FROM ProductScan s JOIN FETCH s.product WHERE s.user.id = :userId ORDER BY s.scannedAt DESC, s.id DESC")
List<ProductScan> findRecentWithProduct(@Param("userId") Long userId, Pageable pageable);

boolean existsByUserIdAndProductId(Long userId, Long productId);
```
💡 **`JOIN FETCH` kyun?** **N+1 problem** se bachne ke liye (Part E1 mein detail).

---

## C7. 🗄️ `entity` package (4 classes)

| Entity | Table | Important cheezein |
|:--|:--|:--|
| `User` | `users` | `username` & `email` unique; `@PrePersist`/`@PreUpdate` se timestamps; `@Builder.Default` scoutScore = 0 |
| `Product` | `products` | `barcode` unique + index; `@Enumerated(STRING) source`; `category_tags` TEXT |
| `ProductScan` | `scan_histories` | `@ManyToOne(fetch = LAZY)` user & product; `is_discovery` |
| `ProductSource` | (enum) | `OPEN_FOOD_FACTS`, `AI_ESTIMATE` |

```java
@Entity
@Table(name = "scan_histories")
public class ProductScan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)            // bahut saare scans → ek user
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    ...
}
```

> 💡 **Entity vs DTO:** Entity = DB ka exact mirror (password hash bhi!). DTO = bahar bhejne wala safe shape. **Entity ko kabhi seedha API se return mat karo**: password leak, lazy-loading errors, aur DB change se API toot jaayegi.

---

## C8. 📋 `dto` package (18 classes)

`ValidationRules` (sirf constants) ko chhod ke saare DTOs **Java `record`** hain. Record = immutable data class; constructor, getters, `equals`, `toString` automatic.

```java
public record RegisterRequestDto(
        @NotBlank(message = "Username is required")
        @Pattern(regexp = ValidationRules.USERNAME_REGEX, message = ValidationRules.USERNAME_MESSAGE)
        String username,

        @NotBlank @Email @Size(max = 254)
        String email,

        @NotBlank @Pattern(regexp = ValidationRules.PASSWORD_REGEX, message = ValidationRules.PASSWORD_MESSAGE)
        String password,

        @Size(max = ValidationRules.MAX_GUEST_BARCODES)
        List<String> guestBarcodes,
        ...
) {}
```

| Group | Classes | Kaam |
|:--|:--|:--|
| **Request (input)** | `RegisterRequestDto`, `LoginRequestDto`, `UpdateProfileRequestDto`, `ChangePasswordRequestDto` | Validation annotations ke saath |
| **Response (output)** | `AuthResponseDto`, `ProductResponseDto`, `ScanHistoryDto`, `LeaderboardUserDto`, `ProductInsightsDto`, `InsightPointDto`, `ProductAlternativeDto` | Safe shape; `fromEntity()` static factory methods |
| **Error** | `ApiErrorResponse` | Har error ka ek hi JSON shape |
| **External API** | `OpenFoodFactsResponseDto`, `OpenFoodFactsProductDto`, `NutrimentsDto`, `OffSearchResponseDto`, `AiProductResponseDto` | Bahar ke JSON ko map karna |
| **Constants** | `ValidationRules` | Username/password regex ek jagah (frontend ke `validation.ts` se match) |

**External DTO trick:**

```java
@JsonIgnoreProperties(ignoreUnknown = true)     // bahar ki API ke extra fields ignore (warna crash!)
public record NutrimentsDto(
        @JsonProperty("energy-kcal_100g") Double calories100g,   // JSON ka naam → Java ka naam
        @JsonProperty("sugars_100g") Double sugars100g, ...
) {}
```

⚠️ **Bug fix:** username ka backend regex number + symbol **zaroori** maangta tha, par frontend bolta tha "optional". "johnsmith" register hi nahi ho paata tha. Ab dono jagah same rule (`ValidationRules`).

---

## C9. 🔄 `mapper`, 🧾 `parser`, 💬 `prompt` (4 classes)

| Class | Kaam | Interesting detail |
|:--|:--|:--|
| `ProductMapper` | OFF DTO → `Product` entity | English text prefer; allergens tags `en:milk` → "Milk"; Nutri-Score normalize; sirf valid category slugs |
| `AiProductMapper` | AI DTO → `Product` | `source = AI_ESTIMATE`; AI ka image URL **kabhi trust nahi** (null) |
| `AiResponseParser` | AI ka raw response → DTO / text | Markdown code fences aur extra text hata ke JSON nikalta hai; `{}` = "pata nahi" |
| `OpenRouterPromptBuilder` | AI ke liye prompts | Summary prompt mein sirf **hamare paas ke facts**: "don't invent anything" |

💡 **Mapper kyun alag?** Agar Open Food Facts apna JSON format badle, to sirf DTO + mapper badlega. Entity aur services safe.

---

## C10. 🛡️ `security` (2) · 🚨 `exception` (2) · 🧰 `util` (4)

### `JwtAuthenticationFilter`

```java
// (simplified: asli code mein try/catch aur request details bhi hain)
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {    // har request pe EK baar
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) { chain.doFilter(request, response); return; }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) { chain.doFilter(request, response); return; }

        String token = authHeader.substring(7);           // "Bearer " ke baad ka part
        if (jwtUtil.validateToken(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            String email = jwtUtil.extractEmail(token);
            var auth = new UsernamePasswordAuthenticationToken(email, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(auth);   // 👈 "ye user logged in hai"
        }
        chain.doFilter(request, response);               // aage badhao
    }
}
```

- **Token galat ho to error nahi phenkta**, bas user ko anonymous rehne deta hai. Phir public routes chalenge, protected pe Security khud 401 dega.
- `SecurityContextHolder`: **ThreadLocal** jaisa storage. Is request ke thread mein "current user kaun hai" yahan rehta hai.
- 💡 **Interview gem:** ye class `@Component` hai, to Spring Boot ise servlet container mein **bhi** register kar deta hai, aur security chain mein bhi add hai. `OncePerRequestFilter` ensure karta hai ki **ek request pe ek hi baar** chale.

### `JsonSecurityErrorHandler`
`AuthenticationEntryPoint` (401) + `AccessDeniedHandler` (403) implement karta hai, aur khaali response ki jagah **JSON** likhta hai. Frontend 401 dekh ke user ko auto-logout karta hai.

### `ApiException`
Hamari custom exception: `HttpStatus` + error code + message. Static factories: `badRequest()`, `unauthorized()`, `notFound()`, `conflict()`. Service mein bas `throw ApiException.conflict("Username taken")` aur baaki handler sambhalega.

### `GlobalExceptionHandler`

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex, HttpServletRequest req) {
        return build(ex.getStatus(), ex.getError(), ex.getMessage(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)   // @Valid fail
    public ResponseEntity<ApiErrorResponse> handleBodyValidation(...) { /* 400 + fieldErrors */ }

    @ExceptionHandler(HttpMessageNotReadableException.class)   // kharab JSON
    ...
    @ExceptionHandler(DataIntegrityViolationException.class)   // unique constraint → 409
    ...
    @ExceptionHandler(Exception.class)                         // baaki sab → 500 (log + generic msg)
    ...
}
```
💡 **Kyun?** Har controller mein try/catch likhne ki jagah **ek jagah** saare errors → consistent JSON. 500 mein internal details (stack trace) user ko **nahi** dikhte, sirf log mein.

### `util` classes

| Class | Kaam |
|:--|:--|
| `Barcodes` | `isWellFormed()`: 8–14 digits; `hasValidCheckDigit()`: GS1 mod-10 algorithm (barcode ka last digit check digit hota hai) |
| `NutriScores` | `"e"`, `"not-applicable"`, `null` → `A–E` ya `UNKNOWN` |
| `JwtUtil` | Token banana (`generateToken`), check karna (`validateToken`), email nikalna. Secret ≥ 32 bytes check startup pe |
| `ClientIpUtil` | Client IP sirf socket se (`getRemoteAddr`). ⚠️ Bug fix: pehle `X-Forwarded-For` header trust karta tha, jo client fake kar sakta tha |

---

# Part D: Request ka poora safar (flows)

## D1. App start hone pe kya hota hai?

```mermaid
sequenceDiagram
    autonumber
    participant M as main()
    participant SB as SpringApplication
    participant CTX as ApplicationContext
    participant DB as PostgreSQL
    participant T as Tomcat

    M->>SB: SpringApplication.run()
    SB->>SB: application.properties + env vars padho
    SB->>CTX: @ComponentScan (com.nutriscan.**)
    CTX->>CTX: Auto-config: DataSource, JPA, Redis, Security, Jackson
    CTX->>DB: HikariCP pool connect + Hibernate ddl-auto=update (tables bana/badal do)
    CTX->>CTX: Beans banao (dependency order mein), constructor injection
    CTX->>CTX: SecurityFilterChain ready, JwtUtil secret check
    SB->>T: Embedded Tomcat start on :8080
    SB->>CTX: CommandLineRunner → DataInitializer.run() (demo user)
    Note over T: "Started NutriscanApiApplication in ~10 s"
```

## D2. ⭐ Product scan request: A to Z (showpiece flow)

**Scenario:** Logged-in user `GET /api/v1/products/5449000000996` (Coca-Cola, pehli baar).

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Next.js (lib/api.ts)
    participant F as JwtAuthenticationFilter
    participant SEC as Spring Security
    participant PC as ProductController
    participant PS as ProductService
    participant PR as ProductRepository
    participant OFP as OpenFoodFactsProductProvider
    participant OFA as Open Food Facts
    participant UR as UserRepository
    participant PSS as ProductScanService

    U->>FE: Barcode type karke "Check it"
    FE->>F: GET /products/5449000000996 + Bearer JWT
    F->>F: Token valid? Email nikalo, SecurityContext set
    F->>SEC: chain.doFilter()
    SEC->>SEC: GET /products/** permitAll ✔
    SEC->>PC: DispatcherServlet → getProductByBarcode()
    PC->>PC: Barcodes.isWellFormed ✔, principal != null (rate limit skip)
    PC->>PS: inspectProduct(barcode, email)
    PS->>UR: findByEmail(email)
    PS->>PR: findByBarcode() → empty
    PS->>OFP: fetchProduct() (priority 1)
    OFP->>OFA: GET /api/v2/product/...json?fields=...
    OFA-->>OFP: JSON
    OFP->>OFP: ProductMapper.toEntity + simplify ingredients
    OFP-->>PS: Optional of Product
    PS->>PR: saveAndFlush(product) → INSERT
    PS->>UR: awardDiscovery(+10) → atomic UPDATE
    PS->>PSS: recordScan(user, product, discovery=true) → INSERT
    PS-->>PC: ProductResponseDto (vegStatus computed)
    PC-->>FE: 200 OK + JSON (Jackson)
    FE-->>U: Product card + "+10 XP · First discovery!"
```

**Har step ke peeche ka "kyun":**

| Step | Kyun aisa? |
|:--|:--|
| Filter mein token check | Security controller se pehle, ek hi jagah |
| Barcode check pehle | Galat input pe mehngi API call ya free scan waste na ho |
| DB pehle | Sabse fast + free; external API sirf naye product pe |
| `fields=` filter | Poora OFF JSON bahut bada; sirf zaroori fields = fast |
| `saveAndFlush` + catch | Race condition safe |
| Atomic UPDATE | XP kabhi lost na ho |
| DTO return | Entity leak nahi, API stable |

## D3. Register → JWT → agli request

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant AC as AuthController
    participant AS as AuthService
    participant PE as PasswordEncoder
    participant UR as UserRepository
    participant J as JwtUtil

    FE->>AC: POST /auth/register {username, email, password, guestBarcodes}
    AC->>AC: @Valid (regex, size, email) → fail ho to 400 + fieldErrors
    AC->>AS: register(dto)
    AS->>UR: existsByEmail / existsByUsername → ho to 409
    AS->>PE: encode(password) → "$2a$10$..."
    AS->>UR: save(user)
    AS->>J: generateToken(email, userId)
    J-->>AS: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIi....signature"
    AS-->>FE: 201 {token, profile, migratedScansCount}
    Note over FE: localStorage mein token save
    FE->>AC: Agli har request: Authorization: Bearer <token>
```

## D4. Error ka safar (example: galat password format)

```text
1. POST /auth/register  { "password": "weak" }
2. Jackson → RegisterRequestDto ✔
3. @Valid → @Pattern fail ✘ → MethodArgumentNotValidException
4. DispatcherServlet exception ko @RestControllerAdvice tak bhejta hai
5. GlobalExceptionHandler.handleBodyValidation() → ApiErrorResponse
6. Response: 400
   { "status":400, "error":"VALIDATION_FAILED",
     "message":"Password must be 8-72 characters with ...",
     "fieldErrors": { "password": "..." } }
7. Frontend message dikhata hai
```

## D5. Insights flow (short)

`GET /products/{barcode}/insights` → `ProductInsightService.getInsights()`:
1. Product DB se (nahi hai to 404 "Scan this product first").
2. `ensureCategories()`: purane rows self-repair.
3. `ProductAnalyzer.analyze()` → verdict + summary + highlights.
4. AI summary (cache → OpenRouter → cache), sirf agar key set hai.
5. Alternatives (cache → search-a-licious → best 4 → cache).
6. Logged in hai to `PersonalAlertChecker.check()`.
7. `ProductInsightsDto` return.

---

# Part E: Deep dives

## E1. 🐘 Database aur JPA (deep)

### ORM kya hai?
**Object-Relational Mapping**: Java objects ↔ DB tables. Tum `productRepository.save(product)` likhte ho, Hibernate khud `INSERT INTO products (...) VALUES (...)` banata hai.

```mermaid
erDiagram
    USERS ||--o{ SCAN_HISTORIES : "1 user, kai scans"
    PRODUCTS ||--o{ SCAN_HISTORIES : "1 product, kai scans"
    USERS { bigint id PK
            varchar email UK
            varchar username UK
            int scout_score }
    PRODUCTS { bigint id PK
               varchar barcode UK
               varchar nutri_score
               varchar source }
    SCAN_HISTORIES { bigint id PK
                     bigint user_id FK
                     bigint product_id FK
                     boolean is_discovery }
```

### `ddl-auto=update`
Hibernate entities dekh ke tables **khud bana/badal** deta hai (naya field = naya column). Dev ke liye badhiya. ⚠️ **Production mein nahi**: wahan `validate` + Flyway/Liquibase migrations use karo.

### `@Transactional`: transaction kya hai?
**ACID**: ya to saare DB operations ho, ya ek bhi nahi. Example: `register()` mein user save + guest scans migrate. Beech mein fail hua to sab rollback.

| Concept | Matlab | Hamare code mein |
|:--|:--|:--|
| `@Transactional` | Method ek transaction mein | `AuthService.register()`, `UserService.updateProfile()` |
| `readOnly = true` | Sirf read: Hibernate optimization | `getRecentScans()`, `getProfile()` |
| Proxy-based | Spring class ka proxy banata hai jo transaction start/commit karta hai | sab jagah |

⚠️ **Self-invocation trap (interview favourite):** Same class ke andar ek method doosre `@Transactional` method ko call kare (`this.save()`), to transaction **apply nahi hota**, kyunki call proxy se nahi guzri. Isliye scan recording alag bean `ProductScanService` mein hai.

### Lazy vs Eager loading
- `@ManyToOne(fetch = LAZY)`: `scan.getProduct()` call karne pe hi product load hoga.
- **Fayda:** zaroorat na ho to extra query nahi.
- **Khatra:** transaction band hone ke baad access kiya to `LazyInitializationException`.

### N+1 problem ⚠️
100 scans load kiye (1 query), phir har scan ka product alag se (100 queries) = **101 queries**! 😱
**Fix:** `JOIN FETCH` = ek hi query mein scans + products:
```sql
SELECT s FROM ProductScan s JOIN FETCH s.product WHERE s.user.id = :userId
```

### Open-In-View (OSIV) = false
Spring Boot by default DB session ko view rendering tak khula rakhta hai (lazy loading "chal jaata hai" par connection der tak busy). Humne `spring.jpa.open-in-view=false` kiya. Saara data service ki transaction mein hi load + DTO mein convert, phir connection free.

### HikariCP (connection pool)
DB connection banana mehenga hai, isliye pehle se 5–20 connections ka pool. Request aayi, connection udhaar liya, kaam karke wapas. `connection-timeout=5000`: 5 sec mein connection na mile to error.

## E2. 🛡️ Security (deep)

### JWT anatomy

```text
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiJhc2hhQGV4YW1wbGUuY29tIiwidXNlcklEIjoxMiwiaWF0Ijo...  . pbXEhw3ap6...
└──── Header ───────┘   └──────────────────── Payload (claims) ─────────────────────┘    └ Signature ┘
  {"alg":"HS256"}         {"sub":"asha@example.com","userID":12,"iat":...,"exp":...}     HMAC(secret)
```

- Header + payload sirf **Base64URL** hain (encrypted **nahi**!). Koi bhi padh sakta hai, isliye password jaise secrets token mein **kabhi nahi**.
- **Signature** = `HMAC-SHA256(header.payload, secret)`. Koi payload badle, signature match nahi hoga, token reject.
- Expiry: 7 din (`exp` claim).

### Stateless vs Session

| Session-based | JWT (hamara) |
|:--|:--|
| Server memory mein session; browser ke paas session ID cookie | Server kuch yaad nahi rakhta; token khud proof hai |
| Multiple servers = session share karna padega | Koi bhi server verify kar sakta hai (sirf secret chahiye) |
| Logout easy (session delete) | Logout = client token phenk de (server-side revoke ke liye blacklist chahiye, trade-off) |

### Password storage: BCrypt
- `hashpw(password, gensalt(10))`: **one-way** hash, cost factor 10 (2¹⁰ rounds).
- Login pe `checkpw(raw, hash)`. Hash se password wapas nikal nahi sakte.
- Password rules: 8–72 chars (72 = BCrypt ki byte limit), upper + lower + digit + symbol.

## E3. 🟥 Redis aur caching (deep)

| | Redis | Caffeine |
|:--|:--|:--|
| Kahan | Alag server (Docker) | App ki memory (JVM) |
| Share? | Saare app instances share karte hain | Har instance ka apna |
| Restart ke baad | Data bachta hai | Khatam |
| Hamara use | Guest quota (sab servers pe same count chahiye) | AI summary, alternatives (dobara ban sakte hain) + Redis fallback |

**Redis commands jo humne use kiye:**
- `INCR rate:guest:1.2.3.4`: atomic +1 (2 requests ek saath bhi sahi count).
- `EXPIRE key 86400`: 24 ghante baad key apne aap delete (**TTL**).

```bash
# Khud dekho:
docker exec nutriscan-redis redis-cli GET rate:guest:127.0.0.1
docker exec nutriscan-redis redis-cli TTL rate:guest:127.0.0.1
```

## E4. 🌍 External API integration (deep)

```mermaid
flowchart LR
    S["OpenFoodFactsService"] -- "RestClient.get()<br/>.uri(...).retrieve().body(Dto.class)" --> API["Open Food Facts"]
    API -- "JSON" --> J["Jackson → OpenFoodFactsResponseDto"]
    J --> M["ProductMapper → Product entity"]
```

**Checklist jo humne follow kiya (interview mein bolo!):**
1. ⏱️ **Timeouts** (connect + read): hang protection.
2. 🎯 **Sirf zaroori fields** maango (`?fields=`).
3. 🛡️ **`@JsonIgnoreProperties(ignoreUnknown = true)`**: API naya field add kare to crash nahi.
4. 🚫 **Errors handle**: 404 = "nahi mila" (debug log), baaki = warn log + `Optional.empty()`. Bahar ki API fail ho to hamara app crash nahi.
5. 🧱 **DTO + Mapper**: bahar ka format andar leak nahi.
6. 💾 **Cache**: same cheez baar baar mat maango.
7. 🤖 **AI ko trust mat karo**: valid barcode check, `AI_ESTIMATE` label, no XP, image URL ignore, "{}" handling.

## E5. 🚨 Validation aur error handling (deep)

**Validation ke 3 levels:**

| Level | Kahan | Example |
|:--|:--|:--|
| 1. Frontend | `lib/validation.ts` | Turant feedback (UX) |
| 2. DTO (`@Valid`) | `RegisterRequestDto` | Format/size rules |
| 3. Service (business rules) | `AuthService`, `UserService` | "Username taken", "20 days cooldown" |

> 💡 Frontend validation **sirf UX** ke liye hai. Security ke liye backend validation **zaroori**, kyunki koi bhi Postman se direct API call kar sakta hai.

**Ek consistent error shape** = frontend ka kaam easy: hamesha `response.message` dikhao.

## E6. 🧪 Testing (deep)

| Type | Kya test hota hai | Tool | Example |
|:--|:--|:--|:--|
| **Unit test** | Ek class, bina Spring | JUnit + AssertJ (+ Mockito) | `ProductAnalyzerTest`, `BarcodesTest` |
| **Integration test** | Poora app: HTTP → DB | `@SpringBootTest` + `MockMvc` | `ApiIntegrationTest` (24 tests) |

```java
@SpringBootTest            // poora ApplicationContext start
@AutoConfigureMockMvc      // fake HTTP client (bina real server)
@ActiveProfiles("test")    // application-test.properties (alag DB)
class ApiIntegrationTest {
    @MockitoBean private OpenFoodFactsService openFoodFactsService;   // bahar ki API fake

    @Test
    void guestsGetFiveScansAndFakeTokensDoNotBypassTheLimit() throws Exception {
        mvc.perform(get("/api/v1/products/" + barcode).with(ip("10.2.0.1")))
           .andExpect(status().isOk())
           .andExpect(header().string("X-RateLimit-Remaining", "4"));
        ...
    }
}
```

- **`@MockitoBean`**: real bean ki jagah fake. Tests internet pe depend nahi karte.
- **Test DB alag** (`nutriscandb_test`): dev data safe.
- Test profile mein Redis ka port jaan-boojh ke band rakha, taki **fallback** bhi test ho jaaye. 😎
- Run: `./mvnw test` → 61 tests.

## E7. Frontend ↔ Backend integration

| Cheez | Frontend | Backend |
|:--|:--|:--|
| Base URL | `NEXT_PUBLIC_API_BASE_URL` | `server.port=8080` |
| Auth | `Authorization: Bearer <token>` (`lib/api.ts`) | `JwtAuthenticationFilter` |
| Token storage | `localStorage` (`lib/auth.ts`) | Stateless (kuch store nahi) |
| Errors | `ApiError(message, status)`; 401 → auto logout | `ApiErrorResponse` JSON |
| Guest quota | `X-RateLimit-Remaining` header padhta hai | `CorsConfig` mein exposed |
| Cross-origin | Browser preflight `OPTIONS` | `CorsConfig` + `OPTIONS` permitAll |
| Shared rules | `validation.ts` | `ValidationRules.java` |

---

# Part F: Interview prep

## F1. 🎤 2-minute project pitch (English, ready to speak)

> *"NutriScan helps people understand packaged food. You scan a barcode and get a plain-language verdict on sugar, salt and fat, allergy and diet alerts, a veg/non-veg mark and better-rated alternatives.*
>
> *I built the backend with Spring Boot 4 in a layered architecture: controllers, services and Spring Data JPA repositories on PostgreSQL. Product lookup uses a chain-of-responsibility: first the local database, then the Open Food Facts API, then an optional LLM through OpenRouter, guarded by barcode check-digit validation so the AI can't be abused.*
>
> *Security is stateless JWT with Spring Security and BCrypt-hashed passwords. Guests get five free scans a day, rate-limited in Redis with an in-memory Caffeine fallback, so the app keeps working if Redis is down.*
>
> *I focused on robustness: timeouts on every external call, a global exception handler with one JSON error contract, atomic SQL updates for points to avoid race conditions, JOIN FETCH to avoid N+1 queries, and 61 tests including MockMvc integration tests against a real test database."*

## F2. Sawal-jawab (Q&A)

<details>
<summary><b>Q1. Spring aur Spring Boot mein kya fark hai?</b></summary>

**Hinglish:** Spring core framework hai (DI, MVC, Data…). Spring Boot uske upar auto-configuration, starters aur embedded Tomcat deta hai, taki setup ka kaam na karna pade.
> 🎤 *"Spring Boot adds auto-configuration, starter dependencies and an embedded server on top of the Spring framework, so you get a production-ready app with minimal configuration."*
</details>

<details>
<summary><b>Q2. Dependency Injection kya hai? Aapne kaise use kiya?</b></summary>

**Hinglish:** Class apni dependencies khud `new` nahi karti; Spring container inject karta hai. Humne constructor injection + Lombok `@RequiredArgsConstructor` use kiya. Example: `ProductService` ko repositories aur `List<ProductProvider>` constructor se milte hain.
> 🎤 *"I use constructor injection everywhere. It makes dependencies explicit and final, and lets me pass mocks in tests. Spring even injects a List of all ProductProvider beans, which I sort by priority."*
</details>

<details>
<summary><b>Q3. `@Component`, `@Service`, `@Repository`, `@Controller` mein kya fark hai?</b></summary>

**Hinglish:** Teeno `@Component` hi hain (bean banate hain), bas meaning alag hai. `@Repository` DB exceptions ko Spring ke `DataAccessException` mein translate karta hai. `@RestController` return value ko JSON bana deta hai.
> 🎤 *"They're all specialisations of @Component. They document the layer, and @Repository adds exception translation."*
</details>

<details>
<summary><b>Q4. `@Bean` kab use karte ho?</b></summary>

**Hinglish:** Jab object kisi bahar ki library ka ho ya custom setup chahiye. Humne 3 `RestClient` beans timeouts ke saath banaye (`RestClientConfig`), aur same type hone ki wajah se `@Qualifier` se inject kiye.
</details>

<details>
<summary><b>Q5. Spring mein ek HTTP request ka flow batao.</b></summary>

**Hinglish:** Tomcat thread → Filters (CORS, hamara JWT filter, Security authorization) → DispatcherServlet → HandlerMapping → Jackson (JSON → DTO) → `@Valid` → Controller → Service → Repository → Jackson (DTO → JSON) → response. Exception aaye to `@RestControllerAdvice`.
</details>

<details>
<summary><b>Q6. JWT authentication kaise implement kiya?</b></summary>

**Hinglish:** Login pe `JwtUtil` HS256 token banata hai (subject = email, 7 din). Har request pe `JwtAuthenticationFilter` (OncePerRequestFilter) header se token nikalta hai, verify karta hai, aur `SecurityContextHolder` mein authentication set karta hai. `SecurityConfig` stateless hai aur public/protected routes define karta hai.
> 🎤 *"A OncePerRequestFilter validates the Bearer token and populates the SecurityContext. The filter chain is stateless, and unauthenticated access to protected routes returns a JSON 401 through a custom AuthenticationEntryPoint."*
</details>

<details>
<summary><b>Q7. CSRF disable kyun kiya? Safe hai?</b></summary>

**Hinglish:** CSRF attack browser ki automatically bheji gayi **cookies** ka fayda uthata hai. Hum token **Authorization header** mein bhejte hain jo browser khud nahi lagata. Isliye stateless token API mein CSRF disable karna standard hai.
</details>

<details>
<summary><b>Q8. Password kaise store karte ho?</b></summary>

**Hinglish:** BCrypt hash, cost 10, salt automatically. Plain password kahin store/log nahi hota. Login pe `checkpw`. Aur galat email ya galat password, dono pe same error message (user enumeration se bachne ke liye).
</details>

<details>
<summary><b>Q9. `@Transactional` kya karta hai? Koi trap?</b></summary>

**Hinglish:** Method ko ek DB transaction mein chalata hai, error pe rollback. Proxy-based hai, isliye **same class se self-call** pe kaam nahi karta. Aur humne lambi external API calls ko transaction ke **bahar** rakha taki DB connection atka na rahe.
</details>

<details>
<summary><b>Q10. N+1 problem kya hai? Kaise solve kiya?</b></summary>

**Hinglish:** List load ki (1 query) phir har item ka relation alag query se (N queries). Humne scan history ke liye `JOIN FETCH` use kiya, ek hi query.
</details>

<details>
<summary><b>Q11. Race condition handle ki hai kahin?</b></summary>

**Hinglish:** Haan, do jagah:
1. **XP:** read-modify-write ki jagah atomic `UPDATE ... SET score = score + 10`.
2. **Same naya product do log ek saath:** barcode unique constraint + `DataIntegrityViolationException` catch karke existing row use.
> 🎤 *"I moved points to a single atomic UPDATE and relied on the unique constraint for concurrent inserts, catching DataIntegrityViolationException and re-reading the existing row."*
</details>

<details>
<summary><b>Q12. Rate limiting kaise ki? Redis kyun?</b></summary>

**Hinglish:** Guest IP pe Redis `INCR` + 24h `EXPIRE`. Redis isliye kyunki multiple servers pe bhi count shared rahe aur TTL built-in hai. Redis down ho to Caffeine in-memory fallback, aur 30 sec tak Redis retry nahi (circuit-breaker jaisa). Aur "guest" = valid token nahi, taki fake token se bypass na ho.
</details>

<details>
<summary><b>Q13. Exception handling kaise ki?</b></summary>

**Hinglish:** Custom `ApiException` (status + code) service se throw, aur `@RestControllerAdvice` `GlobalExceptionHandler` saare exceptions ko ek JSON shape mein badalta hai. Validation errors → 400 + fieldErrors; unique constraint → 409; unknown → 500 (detail sirf log mein). Security ke 401/403 ke liye custom `AuthenticationEntryPoint`.
</details>

<details>
<summary><b>Q14. Entity ko seedha return kyun nahi kiya?</b></summary>

**Hinglish:** Password hash leak, lazy-loading exceptions, aur DB schema change se API contract toot jaata. DTO (Java records) se safe, stable, immutable output.
</details>

<details>
<summary><b>Q15. External API slow/down ho jaaye to?</b></summary>

**Hinglish:** Timeouts (5 s connect / 10–30 s read), exception catch karke `Optional.empty()`, logs, caching, aur chain mein next provider try. App kabhi crash nahi hota; user ko "not found" ya clear message.
</details>

<details>
<summary><b>Q16. Kaunse design patterns use kiye?</b></summary>

| Pattern | Kahan |
|:--|:--|
| Chain of Responsibility | `ProductProvider` chain |
| DTO | `dto/` package |
| Mapper / Adapter | `ProductMapper`, `AiProductMapper` |
| Builder | Lombok `@Builder` (`User.builder()`) |
| Singleton | Har Spring bean (default scope) |
| Dependency Injection / IoC | Poora app |
| Static factory method | `ApiException.notFound()`, `ProductResponseDto.fromEntity()` |
| Strategy-like rule engines | `ProductAnalyzer`, `VegClassifier` |
| Graceful degradation / circuit breaker (simple) | `RateLimiterService` |
</details>

<details>
<summary><b>Q17. Testing kaise ki?</b></summary>

**Hinglish:** 61 tests. Rule engines ke unit tests (fast, no Spring), aur `@SpringBootTest` + MockMvc integration tests jo asli HTTP flow + test PostgreSQL database chalate hain; external APIs `@MockitoBean` se fake. Har bug fix ke liye test hai (jaise fake-token bypass).
</details>

<details>
<summary><b>Q18. Production mein deploy karna ho to kya badloge?</b></summary>

**Hinglish:** Strong `JWT_SECRET` env var, `CORS_ALLOWED_ORIGINS` real domain, `ddl-auto=validate` + Flyway migrations, `SEED_ENABLED=false`, managed PostgreSQL/Redis, reverse proxy ke peeche `FORWARD_HEADERS_STRATEGY=native`, HTTPS, aur monitoring (Actuator + logs).
</details>

<details>
<summary><b>Q19. Is project ka sabse mushkil bug kaunsa tha?</b></summary>

**Hinglish (ek achha story answer):** "Saari validation errors frontend pe **khaali 403** aa rahi thi. Debug kiya to pata chala: validation fail hone pe Spring `/error` pe forward karta hai, aur Spring Security us internal error dispatch ko bhi protected maan ke block kar raha tha. Fix: `/error` aur `ERROR` dispatcher type permit kiye, aur ek `@RestControllerAdvice` banaya jo har error ko proper JSON (400/401/404/409/429) mein badalta hai. Iske baad maine integration tests likhe jo har status code verify karte hain."
</details>

<details>
<summary><b>Q20. AI ko kaise safe use kiya?</b></summary>

**Hinglish:** AI kabhi "source of truth" nahi. (1) Sirf valid GS1 check-digit barcodes pe AI call, (2) AI products `AI_ESTIMATE` tag + UI warning + no XP, (3) summary prompt mein sirf hamare facts aur "don't invent", (4) response parse defensively (fences, prose, `{}`), (5) key na ho to feature off, rule-based analysis chalta rehta hai.
</details>

## F3. ⚠️ Common traps (interview mein inse bacho)

| Trap | Sahi samajh |
|:--|:--|
| "JWT encrypted hota hai" | ❌ Sirf **signed** hai (Base64 encoded). Koi bhi payload padh sakta hai |
| "`@Transactional` har jagah lagao" | ❌ Lambi external calls ke saath connection atka rehta hai; self-invocation pe kaam nahi karta |
| "Field injection (`@Autowired` field) best hai" | ❌ Constructor injection best |
| "401 aur 403 same hain" | ❌ 401 = authentication, 403 = authorization |
| "Frontend validation kaafi hai" | ❌ Backend validation zaroori (Postman se bypass) |
| "Entity return karna theek hai" | ❌ DTO use karo |
| "`findTop10By...` + `@Query` = 10 results" | ❌ `@Query` hone pe naam ka limit ignore. `Pageable` use karo |
| "`X-Forwarded-For` se client IP" | ❌ Client fake kar sakta hai; trusted proxy config chahiye |

---

# Part G: Deployment (Render pe free hosting)

> Is part mein: project ko internet pe live kaise karte hain, humne kya kya badla, **kya nahi kiya**, aur interview mein deployment kaise explain karna hai.

## G1. Sabse pehle: local vs cloud (ye confusion sabko hota hai)

**Tumhare laptop pe abhi kya chal raha hai:**

```mermaid
flowchart LR
    subgraph LAPTOP["💻 Tumhara laptop (localhost)"]
        FE1["Next.js :3000"] --> BE1["Spring Boot :8080"]
        BE1 --> PG1[("🐳 Docker: Postgres :5432")]
        BE1 --> RD1[("🐳 Docker: Redis :6379")]
    end
```

**Sawal:** "Main Docker mein Postgres aur Redis chala raha hoon, to kya Render unhe use kar sakta hai?"

**Jawab: Nahi.** ❌ Tumhare Docker containers **tumhare laptop ke andar** chal rahe hain. `localhost:5432` ka matlab hai "isi computer pe". Render ka server duniya mein kahin aur hai. Wo tumhare laptop tak nahi pahunch sakta, aur laptop band hote hi database bhi band.

**Isliye cloud mein sab kuch cloud mein chahiye:**

```mermaid
flowchart LR
    U(["🌍 Koi bhi user"]) --> FE["☁️ Render: nutriscan-web<br/>(Next.js, Node)"]
    FE -- "HTTPS + JWT" --> BE["☁️ Render: nutriscan-api<br/>(Spring Boot, Docker)"]
    BE --> PG[("☁️ Neon Postgres (free, serverless)")]
    BE --> OFF["🥫 Open Food Facts"]
    BE -.-> AI["🤖 OpenRouter (optional)"]
    BE -. "Redis nahi:<br/>memory fallback" .-> MEM["🧠 In-memory counter"]
```

| Cheez | Local (abhi) | Render (deploy ke baad) |
|:--|:--|:--|
| Frontend | `npm run dev` on :3000 | Render **Node** web service |
| Backend | IntelliJ / `mvnw` on :8080 | Render **Docker** web service (hamara `Dockerfile`) |
| PostgreSQL | Docker container on laptop | **Neon** serverless Postgres (free, AWS us-east-2) |
| Redis | Docker container on laptop | **Nahi** (free mein skip). Guest limit memory fallback se chalega |
| Data | Tumhara local data | **Naya khaali database.** Local data apne aap nahi jaata |

> 💡 Docker ka use **local** pe database chalane ke liye bhi hai, aur **cloud** pe hamari Spring Boot app ko package karne ke liye bhi. Dono alag cheezein hain (G4 mein detail).

---

## G2. Deploy karne se pehle code mein kya problems thi

| # | Problem | Kyun problem thi |
|:-:|:--|:--|
| 1 | Backend ka **Dockerfile nahi** tha | Render pe Java ka built-in runtime nahi hai; Java app **Docker** se chalti hai |
| 2 | **Asli email + password code mein hardcoded** (`DataInitializer`) | Public GitHub pe sabko dikh jaata. Security leak |
| 3 | **JWT secret ka default value** properties file mein | Agar deploy pe change nahi kiya, to koi bhi code padh ke **fake login token** bana sakta |
| 4 | Render database URL `postgresql://user:pass@host/db` deta hai | Spring ko `jdbc:postgresql://host:5432/db` + alag username/password chahiye |
| 5 | Render ek **proxy** ke peeche app chalata hai | Saare guests ka IP same dikhta, to **sabko milake** sirf 5 scans/day! |
| 6 | Health check Redis pe depend karta tha | Redis nahi hai to `/actuator/health` = DOWN, aur Render app ko "unhealthy" maan leta |
| 7 | Free plan sirf **512 MB RAM** | Spring Boot default settings ke saath memory kam pad sakti hai |
| 8 | CORS mein URL ke end pe `/` laga diya to | Browser origin bina `/` bhejta hai, match fail, CORS error |

---

## G3. Deploy ke liye humne kya kya kiya

| # | Kya kiya | File | Kyun |
|:-:|:--|:--|:--|
| 1 | **Dockerfile** (multi-stage) banaya | `nutriscan-api/nutriscan-api/Dockerfile` | Render pe Spring Boot chalane ke liye. Detail G4 mein |
| 2 | **`.dockerignore`** banaya | `nutriscan-api/nutriscan-api/.dockerignore` | `target/`, `.idea` jaisi faltu cheezein image build mein na jaayein (fast build) |
| 3 | **`DatabaseUrlResolver`** class + `main()` mein call | `util/DatabaseUrlResolver.java`, `NutriscanApiApplication.java` | `DATABASE_URL` (postgresql://…) ko automatically JDBC URL + username + password mein badalta hai. Render, Railway, Heroku sab pe kaam karega |
| 4 | **JWT secret ka default hataya** | `application.properties`, `JwtUtil.java` | Ab `JWT_SECRET` env var na ho to local dev secret use hota hai **aur log mein WARNING** aati hai. Render pe `generateValue: true` se random secret banta hai |
| 5 | **Hardcoded credentials hataye**, demo user env vars se + default OFF | `DataInitializer.java`, `application.properties` | Code mein ab koi email/password nahi. `SEED_ENABLED`, `SEED_EMAIL`, `SEED_PASSWORD` se control |
| 6 | **CORS trailing slash fix** | `CorsConfig.java` | `https://x.onrender.com/` aur `https://x.onrender.com` dono chalenge |
| 7 | **Health probes on** + Redis health switch | `application.properties` | `/actuator/health/liveness` sirf "app zinda hai?" check karta hai (DB/Redis nahi). `REDIS_HEALTH_ENABLED=false` |
| 8 | **JVM memory tuning** | `Dockerfile` (`JAVA_TOOL_OPTIONS`) | 512 MB container mein fit hone ke liye (G4 dekho) |
| 9 | **Chhota DB connection pool, Neon ke liye tuned** | `application.properties` (pool 5, min-idle 0, 30 s timeout) | Kam RAM + Neon ko idle pe so jaane dena (G3b dekho) |
| 10 | **`FORWARD_HEADERS_STRATEGY=native`** | `render.yaml` | Proxy ke peeche **asli user IP** mile, taki har guest ko alag 5 scans milein |
| 11 | **`render.yaml` Blueprint** banaya | `NutriScan/render.yaml` | Ek click mein database + backend + frontend teeno ban jaayein |
| 12 | **Root `.gitignore`** | `NutriScan/.gitignore` | `node_modules`, `target`, `.env*` jaisi cheezein GitHub pe na jaayein |
| 13 | **Node version** declare kiya | `nutriscan-web/package.json` (`engines`) | Render compatible Node (≥ 20.9) use kare, jo Next.js 16 ko chahiye |
| 14 | **Tests** | `DatabaseUrlResolverTest.java` (+4 tests, total **61**) | URL conversion galat hua to deploy pe hi pata chalega, isliye pehle test |
| 15 | **Docker image locally build + run karke check kiya** | (verification) | 512 MB limit ke saath container chala ke health + API check kiya |
| 16 | **Neon database config** | `application.properties` (`SPRING_DATASOURCE_URL/USERNAME/PASSWORD`) | Production DB = Neon; local pe Docker fallback. Password **sirf** Render env var mein |
| 17 | **Render region = Ohio** | `render.yaml` | Neon `us-east-2` (Ohio) mein hai; API bhi wahin, to har query fast |
| 18 | **`DatabaseUrlResolver` ab `SPRING_DATASOURCE_URL` ka respect karta hai** | `DatabaseUrlResolver.java` (+1 test, total **61**) | Dono set hon to Neon wala URL jeete; galti se doosra DB use na ho |
| 19 | **GitHub pe push** (ek repo, README root pe) | <https://github.com/silent-coder-dev/nutriscan> | Render isi repo se deploy karega; push se pehle secrets check kiye |

> ✅ **Asli test result (Render jaisi settings: 512 MB, `PORT=10000`, `postgresql://` URL, Redis nahi):** app **29 sec** mein start hua, memory **~300 MB / 512 MB**. Health UP, naye DB pe Nutella Open Food Facts se aaya, analysis chala, register + JWT login chala, CORS (trailing slash ke saath) chala, alag forwarded IPs ko alag guest quota mila, aur Redis na hone pe memory fallback chala.

### `DatabaseUrlResolver`: kaise kaam karta hai

```text
Render deta hai:   postgresql://nutriscan:s3cr3t@dpg-abc123-a/nutriscandb
                   └scheme┘   └─user──┘ └pass─┘ └──host────┘ └──db─────┘

Hum banate hain:   spring.datasource.url      = jdbc:postgresql://dpg-abc123-a:5432/nutriscandb
                   spring.datasource.username = nutriscan
                   spring.datasource.password = s3cr3t
```

```java
public static void main(String[] args) {
    DatabaseUrlResolver.applyFromEnvironment(System.getenv());   // 👈 Spring start hone se PEHLE
    SpringApplication.run(NutriscanApiApplication.class, args);
}
```

💡 **System properties** ki priority `application.properties` se zyada hoti hai, isliye ye values jeet jaati hain. Aur agar `DB_URL` already set hai (jaise local pe), to resolver kuch nahi karta.

---

## G3b. Neon database: kya hai aur humne kaise joda

**Neon** ek **serverless PostgreSQL** service hai (cloud mein asli Postgres). "Serverless" ka matlab: koi use nahi kar raha to database ka compute **so jaata hai** (auto-suspend), aur request aate hi **jaag jaata hai**. Free plan ke liye perfect.

### Neon ka connection string todke samjho

Neon dashboard tumhe aisa string deta hai:

```text
jdbc:postgresql://ep-xxxx-pooler.c-7.us-east-2.aws.neon.tech/neondb?user=neondb_owner&password=****&sslmode=require&channelBinding=require
```

| Hissa | Matlab |
|:--|:--|
| `ep-xxxx-pooler.….neon.tech` | Host. `-pooler` = Neon ka **connection pooler** (PgBouncer): bahut saare app connections ko kam database connections pe share karta hai. Serverless ke liye recommended |
| `neondb` | Database ka naam |
| `user=neondb_owner` | Username |
| `password=****` | Password (🔒 secret) |
| `sslmode=require` | Connection **encrypted** (internet pe password/data plain text mein nahi jaata) |
| `channelBinding=require` | Extra protection (man-in-the-middle attack se). Hamara PostgreSQL driver 42.7.13 isko support karta hai (humne jar check kiya) |

### Humne 3 alag variables kyun banaye?

```text
SPRING_DATASOURCE_URL      = jdbc:postgresql://ep-xxxx-pooler.…/neondb?sslmode=require&channelBinding=require   (user/password URL se HATA diye)
SPRING_DATASOURCE_USERNAME = neondb_owner
SPRING_DATASOURCE_PASSWORD = ********   🔒 secret
```

💡 Password URL ke andar ho to wo logs, screenshots, error messages mein leak ho sakta hai. Alag variable mein Render use **secret** ki tarah chhupa ke rakhta hai.

### `application.properties` mein kya likha

```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:${DB_URL:jdbc:postgresql://localhost:5432/nutriscandb}}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:${DB_USER:nutriscan}}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:${DB_PASSWORD:nutriscan_password}}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

- `${A:${B:default}}` = **nested placeholder**: pehle `A` dekho, nahi to `B`, nahi to default.
- **Render pe** `SPRING_DATASOURCE_*` set hain, to **Neon** use hoga.
- **Laptop pe** kuch set nahi, to **local Docker** Postgres use hoga. Local experiments se cloud data kharab nahi hoga.

> ⚠️ **Jo humne jaan-boojh ke NAHI kiya:** Neon ka password `application.properties` mein default ki tarah **nahi** daala. Ye file GitHub pe jaati hai; password wahan gaya to koi bhi tumhara database padh ya delete kar sakta hai. **Password sirf Render ke Environment tab mein.**

> 💡 Dialect line optional hai: Hibernate khud detect kar leta hai, aur start pe ek harmless note (`HHH90000025 … does not need to be specified`) log karta hai. Request pe rakhi hai; hata bhi sakte ho.

### HikariCP ko Neon ke liye tune kiya

| Setting | Value | Kyun (Neon ke liye) |
|:--|:--|:--|
| `maximum-pool-size` | `5` | 512 MB RAM + Neon pooler pehle se connections share karta hai |
| `minimum-idle` | `0` | Koi use nahi kar raha to pool **khaali** ho jaata hai, aur Neon **so** sakta hai. Free compute hours bachte hain |
| `idle-timeout` | 2 min | Idle connections jaldi band |
| `max-lifetime` | 10 min | Neon/PgBouncer connection kaate, usse pehle hum khud naya bana lein |
| `connection-timeout` | **30 sec** (pehle 5 sec tha) | Soya hua Neon jaagne mein kuch second leta hai; 5 sec mein pehli request fail ho sakti thi |

> ✅ **Test kiya:** app ko sirf `SPRING_DATASOURCE_*` variables ke saath start kiya (Neon jaise URL parameters `channelBinding` ke saath, local test DB pe). Connection bana, health UP, aur ek galat `DATABASE_URL` set hone par bhi ignore hua. Asli Neon password hamare paas nahi tha, isliye **Neon se live connection humne test nahi kiya**. Wo Render pe pehli deploy pe hoga.

---

## G4. Docker samjho (Hinglish mein, zero se)

### Image vs Container

| | Image | Container |
|:--|:--|:--|
| Kya hai | **Recipe + saaman** ka packed dabba (read-only) | Us image se **chalta hua** program |
| Analogy | Cake ki **recipe + ingredients** ka box | **Bana hua cake** jo plate pe hai |
| Command | `docker build` | `docker run` |

**Docker kyun?** "Mere laptop pe to chal raha tha!" wali problem khatam. Image mein Java version, JAR, settings sab fixed hain, to laptop pe aur Render pe **bilkul same** chalega.

### Hamara Dockerfile line by line

```dockerfile
# ---------- 1) Build stage ----------
FROM maven:3.9-eclipse-temurin-21 AS build      # Maven + JDK 21 wali image (sirf build ke liye)
WORKDIR /app                                     # container ke andar folder
COPY pom.xml .                                   # pehle sirf pom.xml copy
RUN mvn -B -q dependency:go-offline              # saari dependencies download (ye layer cache hoti hai)
COPY src ./src                                   # ab source code
RUN mvn -B -q package -DskipTests                # JAR banao (target/*.jar)

# ---------- 2) Run stage ----------
FROM eclipse-temurin:21-jre-alpine               # chhoti image: sirf Java RUNTIME, Maven nahi
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app     # non-root user (security)
COPY --from=build /app/target/*.jar app.jar      # build stage se SIRF JAR uthao
USER app
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Xss512k"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]      # container start = app start
```

| Concept | Matlab | Hamare Dockerfile mein |
|:--|:--|:--|
| **Multi-stage build** | Ek stage mein build, doosre mein sirf result | Maven + JDK (~800 MB) final image mein nahi jaate. Final image chhoti aur secure |
| **Layer caching** | Har instruction ek layer; jo nahi badla wo dobara nahi banta | `pom.xml` pehle copy kiya, to code badalne pe dependencies dobara download nahi hoti |
| **JRE vs JDK** | JDK = compile + run; JRE = sirf run | Run stage mein JRE (chhota) |
| **Alpine** | Bahut chhota Linux | Image size kam |
| **Non-root user** | Container mein root se app mat chalao | Hack hone pe nuksaan kam |
| **`-DskipTests`** | Build mein tests skip | Tests ko database chahiye; wo locally chalte hain (61 tests) |

### JVM memory flags kyun?

| Flag | Matlab | Kyun |
|:--|:--|:--|
| `-XX:MaxRAMPercentage=70` | Heap = container memory ka 70% | 512 MB mein ~358 MB heap, baaki JVM ke liye |
| `-XX:+UseSerialGC` | Simplest garbage collector | Sabse kam memory overhead |
| `-XX:TieredStopAtLevel=1` | Sirf fast (C1) JIT compiler | Free plan ka CPU slow hai; app jaldi start hota hai |
| `-Xss512k` | Har thread ka stack chhota | Tomcat ke threads ki memory bachti hai |

### Locally Docker image chala ke dekho

```bash
cd nutriscan-api/nutriscan-api
docker build -t nutriscan-api:local .

# Render jaisa: 512 MB RAM, DATABASE_URL format, Redis nahi
docker run --rm -p 8080:8080 --memory=512m \
  -e DATABASE_URL="postgresql://nutriscan:nutriscan_password@host.docker.internal:5432/nutriscandb" \
  -e JWT_SECRET="any-long-random-string-at-least-32-bytes" \
  -e REDIS_HEALTH_ENABLED=false \
  nutriscan-api:local
```

💡 `host.docker.internal` = container ke andar se **tumhara laptop**. Container ke andar `localhost` ka matlab container khud hota hai, laptop nahi!

---

## G5. Step by step: Render pe deploy

### Step 0: Ek GitHub repo (monorepo)

Render GitHub se code uthata hai. Ek repo jiske **root** mein dono folders hon:

```text
nutriscan/                      ← GitHub repo ka root
├── render.yaml                 ← Blueprint (ye root pe hona chahiye)
├── .gitignore
├── nutriscan-api/nutriscan-api/   (Dockerfile yahan)
└── nutriscan-web/
```

> ✅ **Ye step ho chuka hai.** Poora project ek repo mein push ho gaya: **<https://github.com/silent-coder-dev/nutriscan>**
> - `nutriscan-web/` ke andar ek purana **`.git` folder** tha (create-next-app wala). Use **backup karke hataya** (`Downloads/NutriScan-backup-2026-10-14/nutriscan-web-dot-git`), warna Git use "repo ke andar repo" (submodule) maan leta aur GitHub/Render pe frontend folder **khaali** dikhta.
> - README ko `nutriscan-web/` se **repo root** pe move kiya, kyunki GitHub sirf root ka README main page pe dikhata hai. Saare links fix kiye.
> - Push se pehle check kiya: `.env.local`, `node_modules`, `target`, `.next`, IntelliJ `.idea` (jisme OpenRouter key thi) **push nahi hue**; staged files mein koi secret nahi.
> - Commit mein sirf tumhara naam (Silent_Coder).

Neeche ke commands reference ke liye hain (kisi naye project mein yahi steps):

```bash
cd NutriScan
# (nutriscan-web/.git hatane ke baad)
git init
git add .
git commit -m "NutriScan: ready for Render"
git branch -M main
git remote add origin https://github.com/<tumhara-username>/<repo>.git
git push -u origin main
```

⚠️ Push se pehle check karo: `git status` mein **`.env.local` nahi** dikhna chahiye (secrets!).

**Ab aage ke changes kaise bhejein:** `NutriScan` folder se

```bash
git add -A
git commit -m "kya badla, short mein"
git push
```

Render pe Blueprint connect hone ke baad har `git push` pe **auto-deploy** hoga.

### Step 0.5: Neon se connection details lo

1. <https://console.neon.tech> → apna project → **Connect** button.
2. **Pooled connection** ON rakho (host mein `-pooler` dikhega) aur format **Java / JDBC** choose karo.
3. String ko 3 hisson mein todo: URL (bina user/password), username, password ([G3b](#g3b-neon-database-kya-hai-aur-humne-kaise-joda) dekho).
4. Password **kahin share mat karna** (chat, screenshot, GitHub); seedha Render mein paste karna.

### Step 1: Render account + Blueprint

1. <https://render.com> pe GitHub se sign up.
2. **New + → Blueprint** → apna repo choose karo.
3. Render `render.yaml` padh ke 2 services dikhayega: `nutriscan-api`, `nutriscan-web` (database Neon pe hai, Render pe nahi).
4. Ye values maangega (`sync: false` wali):

| Variable | Kya daalna hai |
|:--|:--|
| `SPRING_DATASOURCE_URL` (api) | `jdbc:postgresql://<neon-host>-pooler.<region>.aws.neon.tech/neondb?sslmode=require&channelBinding=require` |
| `SPRING_DATASOURCE_USERNAME` (api) | `neondb_owner` |
| `SPRING_DATASOURCE_PASSWORD` (api) 🔒 | Neon ka password (**secret**) |
| `CORS_ALLOWED_ORIGINS` (api) | `https://nutriscan-web.onrender.com` |
| `NEXT_PUBLIC_API_BASE_URL` (web) | `https://nutriscan-api.onrender.com/api/v1` |

> 💡 **Chicken-and-egg problem:** frontend ko backend ka URL chahiye, backend ko frontend ka URL. Render URL service ke naam se banta hai: `https://<service-name>.onrender.com`. Agar naam pehle se kisi ne le liya ho to Render peeche kuch random add kar deta hai. Isliye services banne ke baad **dashboard mein asli URL check karo**, aur alag ho to dono variables update karo.

5. **Apply** dabao. Pehla build 5–10 min le sakta hai (Maven dependencies download hoti hain).

### Step 2: Check karo

| Check | URL | Expected |
|:--|:--|:--|
| Backend zinda hai? | `https://nutriscan-api.onrender.com/actuator/health/liveness` | `{"status":"UP"}` |
| API chal rahi hai? | `https://nutriscan-api.onrender.com/api/v1/users/leaderboard` | `[]` |
| Frontend | `https://nutriscan-web.onrender.com` | Home page + NutriBot |
| Poora flow | Frontend pe "Try one: Nutella" | Product card + analysis |

### Step 3: URL badla to

- `NEXT_PUBLIC_API_BASE_URL` badla → frontend **dobara build** karo (Manual Deploy → *Clear build cache & deploy*), kyunki ye value **build ke time** JavaScript mein bake hoti hai.
- `CORS_ALLOWED_ORIGINS` badla → backend restart (save karte hi Render redeploy kar deta hai).

### Manual tareeka (Blueprint ke bina)

<details>
<summary><b>Agar Blueprint mein koi error aaye to ye karo</b></summary>

1. Neon se URL, username, password lo (Step 0.5).
2. **New + → Web Service** → repo → **Language: Docker**, **Region: Ohio**
   - Dockerfile Path: `nutriscan-api/nutriscan-api/Dockerfile`
   - Docker Build Context: `nutriscan-api/nutriscan-api`
   - Health Check Path: `/actuator/health/liveness`
   - Env vars: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` 🔒, `JWT_SECRET` (koi lamba random string), `CORS_ALLOWED_ORIGINS`, `FORWARD_HEADERS_STRATEGY=native`, `SEED_ENABLED=false`, `REDIS_HEALTH_ENABLED=false`
3. **New + → Web Service** → same repo → **Language: Node**
   - Root Directory: `nutriscan-web`
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Env var: `NEXT_PUBLIC_API_BASE_URL=https://<api-url>/api/v1`

</details>

---

## G6. Environment variables (Render pe)

### Backend (`nutriscan-api`)

| Variable | Value | Zaroori? | Kyun |
|:--|:--|:-:|:--|
| `SPRING_DATASOURCE_URL` | Neon JDBC URL (bina user/password, `sslmode=require`) | ✅ | DB kahan hai |
| `SPRING_DATASOURCE_USERNAME` | `neondb_owner` | ✅ | DB user |
| `SPRING_DATASOURCE_PASSWORD` | 🔒 Neon password | ✅ **secret** | DB password. Kabhi code/GitHub/chat mein nahi |
| `JWT_SECRET` | Random (Render generate karta hai) | ✅ | Token signing. **Kabhi share mat karna** |
| `CORS_ALLOWED_ORIGINS` | `https://<frontend>.onrender.com` | ✅ | Browser ko frontend se API call allow |
| `FORWARD_HEADERS_STRATEGY` | `native` | ✅ | Asli client IP (guest limit) |
| `REDIS_HEALTH_ENABLED` | `false` | ✅ (Redis na ho to) | Health UP rahe |
| `SEED_ENABLED` | `false` | ✅ | Demo account nahi |
| `DB_POOL_MAX_SIZE` / `DB_POOL_MIN_IDLE` | default `5` / `0` | ❌ optional | Pool size badalna ho to |
| `DATABASE_URL` | `postgresql://…` | ❌ alternative | Neon ki jagah Render Postgres use karo to (auto-convert hota hai) |
| `OPENROUTER_API_KEY` | tumhari key | ❌ optional | AI summary + AI fallback |
| `SPRING_DATA_REDIS_URL` | `redis://…` | ❌ optional | Agar kabhi Redis add karo (Render Key Value) |
| `PORT` | Render khud set karta hai | auto | `server.port=${PORT:8080}` |

### Frontend (`nutriscan-web`)

| Variable | Value | Note |
|:--|:--|:--|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<backend>.onrender.com/api/v1` | **Build time** pe bake hota hai; badlo to rebuild |

> 💡 **Spring ka "relaxed binding":** env var `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` apne aap property `spring.datasource.hikari.maximum-pool-size` ban jaata hai (`_` → `.`, uppercase → lowercase). Isliye koi bhi Spring property env var se override kar sakte ho.

---

## G7. Kya NAHI kiya (honest list) 📝

| # | Kya nahi kiya / limitation | Matlab | Aage kya kar sakte ho |
|:-:|:--|:--|:--|
| 1 | **Render pe deploy abhi baaki hai** (GitHub push ✅ ho chuka) | Render account login tumhara hai; maine sab files ready ki aur locally Docker se test kiya | Upar ke steps follow karo |
| 2 | **`render.yaml` Render pe test-run nahi hua** | Render ke documented format pe likha hai, par asli Blueprint run nahi kiya | Error aaye to G5 ka manual tareeka |
| 3 | **Redis cloud pe nahi** | Guest limit memory mein: app restart/sleep pe reset, aur ek hi instance ke liye | Render Key Value (free) bana ke `SPRING_DATA_REDIS_URL` set karo |
| 4 | **Free plan sleep** | 15 min koi request nahi aayi to app so jaata hai; agli request pe ~1–2 min wake-up (Spring Boot slow start) | Demo se pehle ek baar URL khol ke "jagao" 😄 |
| 5 | **Neon free plan ki limits** | Idle pe database so jaata hai (pehli query pe kuch second delay), storage aur compute hours limited hain; latest limits Neon ki pricing page pe check karo | Zaroori data ho to `pg_dump` se backup |
| 6 | **Local data migrate nahi kiya** | Tumhare local scans/users cloud pe nahi jaayenge; cloud DB khaali start hoga | `pg_dump` + `psql` se copy (optional) |
| 7 | **Database migrations tool nahi** (Flyway/Liquibase) | `ddl-auto=update` se Hibernate tables banata hai. College project ke liye theek, production ke liye risky | Flyway add karo, `DDL_AUTO=validate` |
| 8 | **CI/CD pipeline nahi** (GitHub Actions) | Push pe Render deploy karega, par tests apne aap nahi chalenge | GitHub Actions mein `./mvnw test` |
| 9 | **Docker build mein tests skip** | Tests ko database chahiye | CI mein test, phir deploy |
| 10 | **Custom domain nahi** | URL `*.onrender.com` hoga (HTTPS Render free mein deta hai) | Domain kharid ke Render mein add |
| 11 | **Email verification / forgot password nahi** | Feature hi nahi hai | Future feature |
| 12 | **AI key set nahi** | Bina key ke AI off; rule-based analysis chalega | `OPENROUTER_API_KEY` add karo |
| 13 | **College WiFi pe sab ek IP** | Ek hi network ke saare guests ke 5 scans share honge | Login karke use karo (no limit) |
| 14 | **Monitoring/alerts nahi** | Sirf Render logs + `/actuator/health` | Uptime monitor (free) add kar sakte ho |

---

## G8. Troubleshooting (Render pe)

| Problem | Wajah | Fix |
|:--|:--|:--|
| Build fail: `mvn` error | Code compile nahi hua | Locally `./mvnw package -DskipTests` chalao, error theek karo |
| Deploy ke baad app crash / "Exited with status 1" | Logs dekho; zyada tar DB connection | `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` teeno set hain? URL `jdbc:postgresql://` se shuru hota hai? |
| `password authentication failed` | Galat Neon password | Neon console se password reset karke Render mein update karo |
| SSL / connection errors | `sslmode=require` missing | URL ke end mein `?sslmode=require` hona chahiye |
| `prepared statement "S_1" already exists` | Pooler (PgBouncer) + prepared statements | URL mein `&prepareThreshold=0` add karo |
| Pehli request pe DB timeout | Neon so raha tha | Normal; timeout 30 sec rakha hai. Dobara try karo |
| Health check fail | Galat path ya app slow start | Path `/actuator/health/liveness`; first start mein 1–2 min lagte hain |
| Browser console: **CORS error** | `CORS_ALLOWED_ORIGINS` galat | Exact frontend URL, `https://` ke saath, koi path nahi |
| Frontend: "Unable to reach the NutriScan server" | `NEXT_PUBLIC_API_BASE_URL` galat ya backend so raha hai | URL check karo, frontend **rebuild** karo; backend URL ek baar khol ke jagao |
| Sab jagah 401 / logout | `JWT_SECRET` badla to purane tokens invalid | Dobara login karo (normal hai) |
| Pehli request bahut slow | Free plan **cold start** | Normal hai |
| Guest ko jaldi 429 | Proxy IP | `FORWARD_HEADERS_STRATEGY=native` set hai? |
| Memory error (OOM) | 512 MB kam pad gaya | `JAVA_TOOL_OPTIONS` mein `MaxRAMPercentage=60` karo; pool size 5 hi rakho |

---

## G9. 🎤 Deployment interview Q&A

<details>
<summary><b>Q1. Aapne project kaise deploy kiya?</b></summary>

**Hinglish:** Backend ko multi-stage Dockerfile se package kiya: Maven stage mein JAR banta hai, aur chhoti JRE Alpine image mein sirf JAR jaata hai, non-root user ke saath. Render pe teen cheezein: managed Postgres, Docker web service (API), aur Node web service (Next.js). Config 12-factor style mein environment variables se aata hai, aur `render.yaml` Blueprint se poora setup ek click mein.
> 🎤 *"I containerised the Spring Boot API with a multi-stage Dockerfile and deployed it on Render with a managed PostgreSQL database and a Node service for the Next.js frontend. All configuration comes from environment variables, and a Blueprint file describes the whole stack."*
</details>

<details>
<summary><b>Q2. Multi-stage Docker build kyun?</b></summary>

**Hinglish:** Build tools (Maven, JDK) sirf build ke liye chahiye. Final image mein sirf JRE + JAR, to image chhoti, fast deploy, aur attack surface kam.
</details>

<details>
<summary><b>Q3. Secrets kaise manage kiye?</b></summary>

**Hinglish:** Code mein koi secret nahi. JWT secret, DB password sab env vars se. JWT secret Render random generate karta hai. Pehle code mein credentials hardcoded the, wo deploy se pehle hataye. `.env` files `.gitignore` mein.
</details>

<details>
<summary><b>Q3b. Production database kaunsa hai aur kaise connect kiya?</b></summary>

**Hinglish:** Neon serverless PostgreSQL, pooled (PgBouncer) endpoint ke saath, SSL + channel binding. Connection details teen env vars (`SPRING_DATASOURCE_URL/USERNAME/PASSWORD`) se aate hain; password sirf Render secret mein. HikariCP ko serverless ke liye tune kiya: chhota pool, `minimum-idle=0` taki Neon idle pe suspend ho sake, aur 30 sec connection timeout taki cold start pe fail na ho. API ko Neon ke hi AWS region (Ohio) mein deploy kiya taki latency kam ho.
> 🎤 *"Production uses Neon serverless Postgres through its pooled endpoint with SSL. Credentials come from environment variables, with the password stored only as a platform secret. I tuned HikariCP for serverless: a small pool, zero minimum idle so the compute can suspend, and a longer connection timeout for cold starts."*
</details>

<details>
<summary><b>Q4. Platform ka DATABASE_URL Spring ke saath kaise joda?</b></summary>

**Hinglish:** Ek chhoti utility `DatabaseUrlResolver` banayi jo `main()` mein Spring start hone se pehle `postgresql://user:pass@host/db` ko JDBC URL + username + password system properties mein badal deti hai. Iske unit tests bhi hain.
</details>

<details>
<summary><b>Q5. 512 MB RAM mein Spring Boot kaise chalaya?</b></summary>

**Hinglish:** Container-aware JVM flags: `MaxRAMPercentage=70`, Serial GC, C1-only JIT for fast startup, chhota thread stack; aur HikariCP pool 5. Open-in-view band, chhote caches.
</details>

<details>
<summary><b>Q6. Reverse proxy ke peeche client IP kaise milta hai?</b></summary>

**Hinglish:** `server.forward-headers-strategy=native` se Tomcat ka RemoteIpValve trusted proxy ka `X-Forwarded-For` padhta hai. Hum raw header kabhi trust nahi karte, warna client fake IP bhej ke rate limit bypass kar sakta hai.
</details>

<details>
<summary><b>Q7. Health checks kaise kiye?</b></summary>

**Hinglish:** Spring Boot Actuator ke liveness/readiness probes. Platform health check `/actuator/health/liveness` pe hai, jo sirf "app process zinda hai?" check karta hai. Optional Redis down ho to bhi app restart loop mein nahi jaata.
</details>

---


## 🏋️ Practice: khud karke seekho

- [ ] **Breakpoint lagao** `ProductController.getProductByBarcode` pe, Debug mode mein app chalao, Nutella scan karo, aur F7/F8 se poora flow dekho.
- [ ] **SQL dekho:** `application.properties` mein `spring.jpa.show-sql=true` karo aur dekho kaunsi queries chalti hain (JOIN FETCH wali bhi).
- [ ] **Naya endpoint banao:** `GET /api/v1/users/me/stats` jo total scans aur veg/non-veg count de (Controller → Service → Repository `countBy...`).
- [ ] **Naya provider banao:** ek fake `LocalCsvProductProvider` (priority 3) aur dekho bina `ProductService` badle kaise chain mein aa jaata hai.
- [ ] **Test likho:** `VegClassifier` ke liye ek naya test case ("chicken stock" → NON_VEG).
- [ ] **Redis dekho:** guest scan karo, phir `redis-cli GET` aur `TTL` chalao.
- [ ] **Postman/curl se API todo:** galat JSON, bina token, galat barcode bhejke har error JSON dekho.

```bash
curl -s http://localhost:8080/api/v1/products/3017620422003 -i          # guest scan + rate-limit header
curl -s -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" -d '{"email":"x","password":"y"}' # 401 JSON
curl -s http://localhost:8080/api/v1/users/me                            # 401 (no token)
```

---

## 📖 Glossary (shabd-kosh)

| Term | Simple matlab |
|:--|:--|
| **Bean** | Spring ka banaya hua object |
| **IoC container / ApplicationContext** | Spring ka "godown" jahan saare beans rehte hain |
| **DI (Dependency Injection)** | Zaroorat ki cheez bahar se dena |
| **Auto-configuration** | Classpath dekh ke Spring ka khud setup |
| **DispatcherServlet** | Spring MVC ka main receptionist |
| **Filter** | Request controller tak pahunchne se pehle ka checkpoint |
| **DTO** | Data ka shape jo API se aata/jaata hai |
| **Entity** | DB table ka Java roop |
| **ORM / JPA / Hibernate** | Objects ↔ tables; JPA = rules (spec), Hibernate = implementation |
| **JPQL** | Entities pe likhi SQL jaisi query |
| **Transaction** | Ya sab ho ya kuch nahi |
| **Lazy loading** | Zaroorat padne pe hi data load |
| **N+1** | Ek list + har item ki alag query = slow |
| **Connection pool (HikariCP)** | Ready DB connections ka set |
| **JWT** | Signed token jo pehchaan saabit karta hai |
| **BCrypt** | Slow, salted, one-way password hash |
| **CORS** | Browser rule: alag origin se API call ki permission |
| **Stateless** | Server user ka session yaad nahi rakhta |
| **TTL** | Kitni der baad data apne aap expire |
| **Rate limiting** | Ek time window mein requests ki limit |
| **Graceful degradation** | Ek hissa fail ho to bhi app chalta rahe |
| **Idempotent** | Baar baar karo, result same (GET, PUT) |
| **MockMvc** | Bina real server ke HTTP test |
| **Profile** | Environment-specific config (test, prod) |
| **Docker image** | App + Java + settings ka packed, read-only dabba |
| **Container** | Image se chalta hua program |
| **Multi-stage build** | Ek stage mein build, final image mein sirf result |
| **Blueprint (render.yaml)** | Render ko batane wali file: kaunse services/DB banane hain |
| **Cold start** | Soya hua free server pehli request pe jaagta hai, isliye slow |
| **Environment variable** | Code ke bahar se di gayi setting (secrets, URLs) |
| **Reverse proxy** | Beech ka server jo request aage forward karta hai (Render ka load balancer) |

---

<div align="center">

**Yaad rakho:** interview mein "kya kiya" se zyada **"kyun kiya"** matter karta hai. Har section ka "kyun" yaad karo. 💪

[← README](../../README.md) · [Architecture (English)](04-ARCHITECTURE.md) · [Project flow (English)](05-PROJECT-FLOW.md)

Made with ❤️ by **Silent Coder**

</div>
