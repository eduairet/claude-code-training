# Expert Backend Engineering Guide for Rust API

This document provides comprehensive guidance for developing production-grade Rust APIs using Axum, with integrated Postman testing via MCP.

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Rust Backend Best Practices](#rust-backend-best-practices)
3. [Axum Framework Mastery](#axum-framework-mastery)
4. [Error Handling Patterns](#error-handling-patterns)
5. [API Design Standards](#api-design-standards)
6. [Database Integration](#database-integration)
7. [Authentication & Security](#authentication--security)
8. [Testing Strategy](#testing-strategy)
9. [Postman MCP Integration](#postman-mcp-integration)
10. [Performance & Optimization](#performance--optimization)
11. [Observability](#observability)
12. [Deployment](#deployment)

---

## Project Architecture

### Current Structure

```
rust_api/
├── src/
│   └── main.rs           # Application entry point and routes
├── Cargo.toml            # Dependencies and project metadata
├── Dockerfile            # Container build instructions
├── docker-compose.yml    # Local development orchestration
├── CLAUDE.md             # Root-level quick reference
└── memory/api/CLAUDE.md  # This comprehensive guide
```

### Recommended Production Structure

```
rust_api/
├── src/
│   ├── main.rs           # Entry point, minimal bootstrap
│   ├── lib.rs            # Library root for testing
│   ├── config.rs         # Configuration management
│   ├── routes/
│   │   ├── mod.rs        # Route aggregation
│   │   ├── health.rs     # Health check endpoints
│   │   └── colors.rs     # Color endpoints
│   ├── handlers/         # Request handlers (thin layer)
│   ├── services/         # Business logic
│   ├── models/           # Data structures
│   ├── repositories/     # Data access layer
│   ├── middleware/       # Custom middleware
│   ├── extractors/       # Custom Axum extractors
│   └── error.rs          # Centralized error handling
├── tests/
│   ├── integration/      # Integration tests
│   └── common/           # Shared test utilities
├── migrations/           # Database migrations (if applicable)
└── benches/              # Performance benchmarks
```

---

## Rust Backend Best Practices

### Ownership & Lifetimes in Web Contexts

```rust
// GOOD: Clone when needed for async boundaries
async fn handler(State(db): State<Arc<DbPool>>) -> impl IntoResponse {
    let db = db.clone(); // Clone Arc, not the pool
    // Use db...
}

// GOOD: Use references when possible within sync code
fn process_request(data: &RequestData) -> Result<Response, Error> {
    // Borrow, don't own
}

// AVOID: Unnecessary cloning
async fn bad_handler(data: String) -> impl IntoResponse {
    let cloned = data.clone(); // Why clone if you own it?
}
```

### Async Best Practices

```rust
// GOOD: Use tokio::spawn for CPU-bound work
async fn heavy_computation(data: Data) -> Result<Output, Error> {
    tokio::task::spawn_blocking(move || {
        // CPU-intensive work here
        compute_something(data)
    }).await?
}

// GOOD: Concurrent operations with join
async fn fetch_multiple(ids: Vec<i32>) -> Vec<Result<Item, Error>> {
    let futures: Vec<_> = ids.iter()
        .map(|id| fetch_item(*id))
        .collect();
    futures::future::join_all(futures).await
}

// AVOID: Sequential when parallel is possible
async fn bad_fetch(ids: Vec<i32>) -> Vec<Item> {
    let mut results = vec![];
    for id in ids {
        results.push(fetch_item(id).await); // Sequential!
    }
    results
}
```

### Type Safety

```rust
// GOOD: Newtype pattern for type safety
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserId(pub i64);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HexColor(String);

impl HexColor {
    pub fn new(color: &str) -> Result<Self, ColorError> {
        let color = color.trim_start_matches('#');
        if color.len() != 6 || !color.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(ColorError::InvalidFormat);
        }
        Ok(Self(format!("#{}", color)))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

// AVOID: Stringly-typed APIs
fn bad_get_user(id: String) -> User { /* ... */ }
```

### Memory Efficiency

```rust
// GOOD: Use Cow for flexible ownership
use std::borrow::Cow;

fn process_name(name: Cow<'_, str>) -> String {
    if name.contains(' ') {
        name.replace(' ', "_")
    } else {
        name.into_owned()
    }
}

// GOOD: SmallVec for small collections
use smallvec::SmallVec;
type Headers = SmallVec<[(String, String); 8]>;

// GOOD: Use &str in function signatures when possible
fn validate_email(email: &str) -> bool { /* ... */ }
```

---

## Axum Framework Mastery

### Router Patterns

```rust
use axum::{
    Router,
    routing::{get, post, put, delete},
    middleware,
};

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Group related routes
        .nest("/api/v1", api_v1_routes())
        // Apply middleware to specific routes
        .route_layer(middleware::from_fn(auth_middleware))
        // Shared state
        .with_state(state)
}

fn api_v1_routes() -> Router<AppState> {
    Router::new()
        .nest("/users", user_routes())
        .nest("/colors", color_routes())
        .route("/health", get(health_check))
}

fn color_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_colors).post(create_color))
        .route("/:id", get(get_color).put(update_color).delete(delete_color))
}
```

### Extractors

```rust
use axum::{
    extract::{Path, Query, State, Json, Request},
    http::StatusCode,
};

// Path parameters
async fn get_color(Path(hex): Path<String>) -> impl IntoResponse { /* ... */ }

// Multiple path parameters
async fn get_user_post(
    Path((user_id, post_id)): Path<(i64, i64)>
) -> impl IntoResponse { /* ... */ }

// Query parameters
#[derive(Deserialize)]
struct Pagination {
    #[serde(default = "default_page")]
    page: u32,
    #[serde(default = "default_limit")]
    limit: u32,
}

fn default_page() -> u32 { 1 }
fn default_limit() -> u32 { 20 }

async fn list_items(Query(pagination): Query<Pagination>) -> impl IntoResponse { /* ... */ }

// JSON body with validation
#[derive(Deserialize, Validate)]
struct CreateUser {
    #[validate(email)]
    email: String,
    #[validate(length(min = 8))]
    password: String,
}

async fn create_user(
    State(db): State<DbPool>,
    Json(payload): Json<CreateUser>,
) -> Result<Json<User>, AppError> { /* ... */ }

// Custom extractor
#[derive(Debug)]
struct AuthUser {
    id: UserId,
    roles: Vec<Role>,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = parts.headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        validate_token(token).await
    }
}
```

### Response Types

```rust
use axum::{
    response::{IntoResponse, Response, Json, Html},
    http::{StatusCode, header},
};

// JSON response
async fn json_response() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

// Custom status code
async fn created() -> (StatusCode, Json<Item>) {
    (StatusCode::CREATED, Json(item))
}

// Headers + body
async fn with_headers() -> impl IntoResponse {
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/json")],
        Json(data),
    )
}

// HTML response
async fn html_page() -> Html<String> {
    Html("<h1>Hello</h1>".to_string())
}

// Streaming response
async fn stream() -> impl IntoResponse {
    let stream = tokio_stream::iter(vec![
        Ok::<_, std::io::Error>("chunk1"),
        Ok("chunk2"),
    ]);
    axum::body::Body::from_stream(stream)
}

// Empty response
async fn no_content() -> StatusCode {
    StatusCode::NO_CONTENT
}
```

### Middleware

```rust
use axum::{
    middleware::{self, Next},
    extract::Request,
    response::Response,
};
use std::time::Instant;

// Function middleware
async fn logging_middleware(request: Request, next: Next) -> Response {
    let method = request.method().clone();
    let uri = request.uri().clone();
    let start = Instant::now();

    let response = next.run(request).await;

    let duration = start.elapsed();
    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration_ms = %duration.as_millis(),
        "Request completed"
    );

    response
}

// Apply middleware
let app = Router::new()
    .route("/", get(handler))
    .layer(middleware::from_fn(logging_middleware));

// Tower layer middleware
use tower_http::{
    cors::CorsLayer,
    compression::CompressionLayer,
    timeout::TimeoutLayer,
    trace::TraceLayer,
};

let app = Router::new()
    .route("/", get(handler))
    .layer(CompressionLayer::new())
    .layer(TimeoutLayer::new(Duration::from_secs(30)))
    .layer(CorsLayer::permissive())
    .layer(TraceLayer::new_for_http());
```

### State Management

```rust
use std::sync::Arc;
use tokio::sync::RwLock;

// Shared immutable state
#[derive(Clone)]
struct AppState {
    db: Arc<DbPool>,
    config: Arc<Config>,
    cache: Arc<Cache>,
}

// Shared mutable state (use sparingly)
#[derive(Clone)]
struct MutableState {
    counter: Arc<RwLock<u64>>,
}

async fn increment(State(state): State<MutableState>) -> String {
    let mut counter = state.counter.write().await;
    *counter += 1;
    counter.to_string()
}

// Extension-based state for request-scoped data
async fn handler(Extension(user): Extension<AuthUser>) -> impl IntoResponse {
    // user was added by middleware
}
```

---

## Error Handling Patterns

### Centralized Error Type

```rust
use axum::{
    response::{IntoResponse, Response},
    http::StatusCode,
    Json,
};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal server error")]
    Internal(#[from] anyhow::Error),

    #[error("Database error")]
    Database(#[from] sqlx::Error),

    #[error("Invalid hex color: {0}")]
    InvalidColor(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone()),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized".into()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "FORBIDDEN", "Forbidden".into()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg.clone()),
            AppError::InvalidColor(msg) => (StatusCode::BAD_REQUEST, "INVALID_COLOR", msg.clone()),
            AppError::Internal(e) => {
                tracing::error!(error = ?e, "Internal server error");
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Internal server error".into())
            }
            AppError::Database(e) => {
                tracing::error!(error = ?e, "Database error");
                (StatusCode::INTERNAL_SERVER_ERROR, "DATABASE_ERROR", "Database error".into())
            }
        };

        let body = Json(serde_json::json!({
            "error": {
                "code": error_code,
                "message": message,
            }
        }));

        (status, body).into_response()
    }
}

// Result type alias
pub type AppResult<T> = Result<T, AppError>;
```

### Using the Error Type

```rust
async fn get_color(Path(hex): Path<String>) -> AppResult<Html<String>> {
    let color = HexColor::new(&hex)
        .map_err(|_| AppError::InvalidColor(format!("Invalid hex color: {}", hex)))?;

    Ok(Html(format!(
        r#"<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;">
<div style="width:100vw;height:100vh;background-color:{};"></div>
</body>
</html>"#,
        color.as_str()
    )))
}

async fn get_user(
    State(db): State<DbPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<User>> {
    let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&db)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))?;

    Ok(Json(user))
}
```

---

## API Design Standards

### RESTful Conventions

| Operation      | Method | Path           | Status Codes  |
| -------------- | ------ | -------------- | ------------- |
| List           | GET    | /resources     | 200           |
| Create         | POST   | /resources     | 201, 400, 409 |
| Read           | GET    | /resources/:id | 200, 404      |
| Update         | PUT    | /resources/:id | 200, 400, 404 |
| Partial Update | PATCH  | /resources/:id | 200, 400, 404 |
| Delete         | DELETE | /resources/:id | 204, 404      |

### Response Envelope

```rust
#[derive(Serialize)]
struct ApiResponse<T> {
    data: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    meta: Option<Meta>,
}

#[derive(Serialize)]
struct Meta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pagination: Option<Pagination>,
    #[serde(skip_serializing_if = "Option::is_none")]
    request_id: Option<String>,
}

#[derive(Serialize)]
struct Pagination {
    page: u32,
    limit: u32,
    total: u64,
    total_pages: u32,
}

#[derive(Serialize)]
struct ListResponse<T> {
    data: Vec<T>,
    meta: Meta,
}
```

### Versioning

```rust
// URL versioning (recommended)
Router::new()
    .nest("/api/v1", v1_routes())
    .nest("/api/v2", v2_routes())

// Header versioning
async fn version_middleware(request: Request, next: Next) -> Response {
    let version = request.headers()
        .get("Api-Version")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("1");
    // Route based on version
}
```

### Content Negotiation

```rust
use axum::http::header::ACCEPT;

async fn get_color(
    Path(hex): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let accept = headers
        .get(ACCEPT)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("text/html");

    let color = format!("#{}", hex);

    match accept {
        a if a.contains("application/json") => {
            Json(json!({ "color": color })).into_response()
        }
        _ => {
            Html(format!(
                r#"<div style="width:100vw;height:100vh;background-color:{};"></div>"#,
                color
            )).into_response()
        }
    }
}
```

---

## Database Integration

### SQLx Setup

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "migrate"] }
```

```rust
use sqlx::postgres::PgPoolOptions;

async fn setup_database(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .min_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(600))
        .connect(database_url)
        .await
}

// Run migrations
sqlx::migrate!("./migrations")
    .run(&pool)
    .await?;
```

### Repository Pattern

```rust
#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn find_by_id(&self, id: UserId) -> AppResult<Option<User>>;
    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>>;
    async fn create(&self, user: CreateUser) -> AppResult<User>;
    async fn update(&self, id: UserId, user: UpdateUser) -> AppResult<User>;
    async fn delete(&self, id: UserId) -> AppResult<()>;
}

pub struct PostgresUserRepository {
    pool: PgPool,
}

#[async_trait]
impl UserRepository for PostgresUserRepository {
    async fn find_by_id(&self, id: UserId) -> AppResult<Option<User>> {
        sqlx::query_as!(
            User,
            r#"SELECT id, email, created_at, updated_at FROM users WHERE id = $1"#,
            id.0
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(AppError::from)
    }

    // ... other implementations
}
```

---

## Authentication & Security

### JWT Authentication

```rust
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,  // user id
    exp: usize,   // expiration
    iat: usize,   // issued at
    roles: Vec<String>,
}

fn create_token(user_id: &str, roles: Vec<String>, secret: &[u8]) -> Result<String, AppError> {
    let now = chrono::Utc::now();
    let claims = Claims {
        sub: user_id.to_string(),
        exp: (now + chrono::Duration::hours(24)).timestamp() as usize,
        iat: now.timestamp() as usize,
        roles,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(secret))
        .map_err(|e| AppError::Internal(e.into()))
}

fn validate_token(token: &str, secret: &[u8]) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}
```

### Security Headers Middleware

```rust
use tower_http::set_header::SetResponseHeaderLayer;
use axum::http::HeaderValue;

let app = Router::new()
    .route("/", get(handler))
    .layer(SetResponseHeaderLayer::overriding(
        header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    ))
    .layer(SetResponseHeaderLayer::overriding(
        header::CONTENT_SECURITY_POLICY,
        HeaderValue::from_static("default-src 'self'"),
    ));
```

### Input Validation

```rust
use validator::Validate;

#[derive(Deserialize, Validate)]
struct CreateColorRequest {
    #[validate(length(min = 6, max = 6), custom = "validate_hex")]
    hex: String,

    #[validate(length(min = 1, max = 100))]
    name: Option<String>,
}

fn validate_hex(hex: &str) -> Result<(), validator::ValidationError> {
    if hex.chars().all(|c| c.is_ascii_hexdigit()) {
        Ok(())
    } else {
        Err(validator::ValidationError::new("invalid_hex"))
    }
}

// Validated extractor
#[derive(Debug, Clone)]
struct ValidatedJson<T>(pub T);

#[async_trait]
impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state)
            .await
            .map_err(|e| AppError::Validation(e.to_string()))?;

        value.validate()
            .map_err(|e| AppError::Validation(e.to_string()))?;

        Ok(ValidatedJson(value))
    }
}
```

### Rate Limiting

```rust
use governor::{Quota, RateLimiter};
use std::num::NonZeroU32;

// Create rate limiter
let quota = Quota::per_minute(NonZeroU32::new(100).unwrap());
let limiter = Arc::new(RateLimiter::keyed(quota));

// Middleware
async fn rate_limit_middleware(
    State(limiter): State<Arc<RateLimiter<String, _, _>>>,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let key = request
        .headers()
        .get("X-Forwarded-For")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    limiter
        .check_key(&key)
        .map_err(|_| AppError::TooManyRequests)?;

    Ok(next.run(request).await)
}
```

---

## Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_color_valid() {
        assert!(HexColor::new("ff5500").is_ok());
        assert!(HexColor::new("#ff5500").is_ok());
        assert!(HexColor::new("FF5500").is_ok());
    }

    #[test]
    fn test_hex_color_invalid() {
        assert!(HexColor::new("gg5500").is_err());
        assert!(HexColor::new("ff550").is_err());
        assert!(HexColor::new("ff55001").is_err());
    }
}
```

### Integration Tests

```rust
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use tower::ServiceExt;

#[tokio::test]
async fn test_health_check() {
    let app = create_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(json["status"], "ok");
}

#[tokio::test]
async fn test_color_endpoint() {
    let app = create_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/color/ff5500")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let html = String::from_utf8(body.to_vec()).unwrap();

    assert!(html.contains("background-color:#ff5500"));
    assert!(html.contains("100vw"));
    assert!(html.contains("100vh"));
}

#[tokio::test]
async fn test_invalid_color() {
    let app = create_app();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/color/invalid")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}
```

### Test Utilities

```rust
pub struct TestApp {
    pub address: String,
    pub db_pool: PgPool,
    pub api_client: reqwest::Client,
}

impl TestApp {
    pub async fn spawn() -> Self {
        let db_pool = setup_test_database().await;
        let app = create_app(db_pool.clone());

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();

        tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });

        Self {
            address: format!("http://127.0.0.1:{}", port),
            db_pool,
            api_client: reqwest::Client::new(),
        }
    }

    pub async fn get(&self, path: &str) -> reqwest::Response {
        self.api_client
            .get(format!("{}{}", self.address, path))
            .send()
            .await
            .unwrap()
    }
}
```

---

## Postman MCP Integration

### Workspace & Collection Management

The Postman MCP server provides tools for managing API testing infrastructure:

```
Available Postman MCP Tools:
├── Workspaces
│   ├── mcp__postman__getWorkspaces     # List all workspaces
│   ├── mcp__postman__getWorkspace      # Get workspace details
│   ├── mcp__postman__createWorkspace   # Create new workspace
│   └── mcp__postman__updateWorkspace   # Update workspace
├── Collections
│   ├── mcp__postman__getCollections    # List collections in workspace
│   ├── mcp__postman__getCollection     # Get collection details (use model=full for complete data)
│   ├── mcp__postman__createCollection  # Create new collection
│   └── mcp__postman__putCollection     # Update entire collection
├── Requests
│   ├── mcp__postman__createCollectionRequest   # Add request to collection
│   └── mcp__postman__createCollectionResponse  # Add example response
└── Execution
    └── mcp__postman__runCollection     # Execute collection (cloud-based)
```

### Creating a Complete Collection

```javascript
// Collection structure for Postman API
{
  "info": {
    "name": "Rust API",
    "description": "API collection description",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "type": "text/javascript",
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response has correct structure', function () {",
              "    const json = pm.response.json();",
              "    pm.expect(json).to.have.property('status');",
              "    pm.expect(json.status).to.eql('ok');",
              "});"
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

### Test Script Patterns

```javascript
// Status code tests
pm.test('Status code is 200', function () {
  pm.response.to.have.status(200);
});

pm.test('Status code is 2xx', function () {
  pm.response.to.be.success;
});

// Response time
pm.test('Response time is less than 500ms', function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

// Headers
pm.test('Content-Type is JSON', function () {
  pm.expect(pm.response.headers.get('Content-Type')).to.include(
    'application/json',
  );
});

// JSON body validation
pm.test('Response has required fields', function () {
  const json = pm.response.json();
  pm.expect(json).to.have.property('data');
  pm.expect(json.data).to.be.an('array');
});

// Schema validation
const schema = {
  type: 'object',
  required: ['status', 'message'],
  properties: {
    status: { type: 'string' },
    message: { type: 'string' },
  },
};

pm.test('Schema is valid', function () {
  pm.response.to.have.jsonSchema(schema);
});

// HTML response
pm.test('HTML contains expected content', function () {
  pm.expect(pm.response.text()).to.include('background-color');
});

// Store values for later requests
pm.test('Extract and store token', function () {
  const json = pm.response.json();
  pm.collectionVariables.set('authToken', json.token);
});
```

### MCP Limitations

**Important**: The `runCollection` tool executes on Postman's cloud infrastructure. It **cannot** access `localhost` or local network resources. Options:

1. **Use Postman Desktop App** for local testing
2. **Expose API publicly** (ngrok, cloud deployment) for MCP execution
3. **Use MCP for collection management**, local tools for execution

### Environment Management

```javascript
// Create environment for different stages
{
  "name": "Development",
  "values": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "apiKey", "value": "dev-key", "type": "secret" }
  ]
}

{
  "name": "Production",
  "values": [
    { "key": "baseUrl", "value": "https://api.example.com" },
    { "key": "apiKey", "value": "prod-key", "type": "secret" }
  ]
}
```

---

## Performance & Optimization

### Async Optimizations

```rust
// Connection pooling
let pool = PgPoolOptions::new()
    .max_connections(20)
    .min_connections(5)
    .connect(&database_url)
    .await?;

// Response compression
use tower_http::compression::CompressionLayer;
let app = Router::new()
    .route("/", get(handler))
    .layer(CompressionLayer::new());

// Caching with moka
use moka::future::Cache;

let cache: Cache<String, CachedResponse> = Cache::builder()
    .max_capacity(10_000)
    .time_to_live(Duration::from_secs(300))
    .build();
```

### Profiling

```toml
# Cargo.toml for release profiling
[profile.release]
debug = true  # Enable debug symbols for profiling

[profile.bench]
debug = true
```

```bash
# CPU profiling with flamegraph
cargo install flamegraph
cargo flamegraph --bin rust_api

# Memory profiling
cargo install cargo-valgrind
cargo valgrind run
```

### Benchmarks

```rust
// benches/api_bench.rs
use criterion::{criterion_group, criterion_main, Criterion};

fn bench_color_parsing(c: &mut Criterion) {
    c.bench_function("parse hex color", |b| {
        b.iter(|| HexColor::new("ff5500"))
    });
}

criterion_group!(benches, bench_color_parsing);
criterion_main!(benches);
```

---

## Observability

### Structured Logging with Tracing

```rust
use tracing::{info, instrument, Level};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn setup_tracing() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "rust_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();
}

#[instrument(skip(db))]
async fn get_user(
    State(db): State<DbPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<User>> {
    info!(user_id = %id, "Fetching user");
    // ...
}
```

### Metrics with Prometheus

```rust
use metrics::{counter, histogram};
use metrics_exporter_prometheus::PrometheusBuilder;

fn setup_metrics() {
    PrometheusBuilder::new()
        .install()
        .expect("Failed to install Prometheus recorder");
}

async fn metrics_middleware(request: Request, next: Next) -> Response {
    let path = request.uri().path().to_string();
    let method = request.method().to_string();
    let start = Instant::now();

    let response = next.run(request).await;

    let duration = start.elapsed();
    let status = response.status().as_u16().to_string();

    counter!("http_requests_total", "method" => method.clone(), "path" => path.clone(), "status" => status.clone()).increment(1);
    histogram!("http_request_duration_seconds", "method" => method, "path" => path).record(duration.as_secs_f64());

    response
}
```

### Health Checks

```rust
#[derive(Serialize)]
struct HealthResponse {
    status: String,
    version: String,
    checks: HealthChecks,
}

#[derive(Serialize)]
struct HealthChecks {
    database: CheckResult,
    cache: CheckResult,
}

#[derive(Serialize)]
struct CheckResult {
    status: String,
    latency_ms: u64,
}

async fn detailed_health_check(State(state): State<AppState>) -> Json<HealthResponse> {
    let db_check = check_database(&state.db).await;
    let cache_check = check_cache(&state.cache).await;

    let overall_status = if db_check.status == "healthy" && cache_check.status == "healthy" {
        "healthy"
    } else {
        "degraded"
    };

    Json(HealthResponse {
        status: overall_status.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        checks: HealthChecks {
            database: db_check,
            cache: cache_check,
        },
    })
}
```

---

## Deployment

### Docker Best Practices

```dockerfile
# Multi-stage build for minimal image size
FROM rust:1.75 as builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

# Runtime image
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/rust_api /usr/local/bin/
EXPOSE 3000
CMD ["rust_api"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rust-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rust-api
  template:
    metadata:
      labels:
        app: rust-api
    spec:
      containers:
        - name: rust-api
          image: rust-api:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: '64Mi'
              cpu: '100m'
            limits:
              memory: '256Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: RUST_LOG
              value: 'info'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url
```

### Configuration Management

```rust
use config::{Config, ConfigError, Environment, File};

#[derive(Debug, Deserialize)]
pub struct Settings {
    pub server: ServerSettings,
    pub database: DatabaseSettings,
    pub auth: AuthSettings,
}

#[derive(Debug, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
}

impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let env = std::env::var("RUN_ENV").unwrap_or_else(|_| "development".into());

        Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(File::with_name(&format!("config/{}", env)).required(false))
            .add_source(Environment::with_prefix("APP").separator("__"))
            .build()?
            .try_deserialize()
    }
}
```

---

## Quick Reference

### Essential Cargo Commands

```bash
# Development
cargo run                    # Run debug build
cargo watch -x run           # Auto-reload on changes
cargo clippy                 # Lint
cargo fmt                    # Format code

# Testing
cargo test                   # Run all tests
cargo test -- --nocapture    # Show println! output
cargo test integration_      # Run integration tests only

# Production
cargo build --release        # Optimized build
cargo audit                  # Security audit

# Docker
docker-compose up --build    # Build and run
docker-compose run --rm api cargo test  # Run tests in container
```

### Common Dependencies

```toml
[dependencies]
# Web framework
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "compression", "trace", "timeout"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "migrate"] }

# Validation
validator = { version = "0.16", features = ["derive"] }

# Error handling
thiserror = "1"
anyhow = "1"

# Logging/tracing
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Auth
jsonwebtoken = "9"

# Testing
[dev-dependencies]
reqwest = { version = "0.11", features = ["json"] }
```

---

## Project-Specific Notes

### Current Endpoints

| Endpoint      | Method | Description                                      |
| ------------- | ------ | ------------------------------------------------ |
| `/health`     | GET    | Health check, returns JSON `{ status, message }` |
| `/color/:hex` | GET    | Returns HTML page with full-screen colored div   |

### Postman Collection

- **Workspace**: RustApi (`c10e666d-70f1-47c0-a856-6a95533300ee`)
- **Collection**: Rust API (`27334645-77c0c461-ef62-4edb-8be4-7d4fb65256b3`)

### Development Workflow

1. Make code changes in `src/`
2. Test locally: `docker-compose up --build`
3. Verify with curl: `curl http://localhost:3000/health`
4. Update Postman collection if endpoints change
5. Run tests: `docker-compose run --rm api cargo test`
6. Format and lint: `cargo fmt && cargo clippy`
