# Rust Color API - Implementation Specification

This document provides detailed specifications for implementing the Rust Color API. Use this alongside `openapi.yaml` when implementing endpoints.

## Project Overview

A REST API for color conversions, previews, and CSS color name lookups built with:

- **Axum 0.7** - Web framework
- **Tokio** - Async runtime
- **Serde** - JSON serialization

## Architecture Principles

1. **Single-file structure** - Keep in `src/main.rs` unless complexity requires splitting
2. **Type-safe handlers** - Use Axum extractors (Path, Query) for validation
3. **Consistent error handling** - Return JSON errors with proper status codes
4. **Derive macros** - Use `#[derive(Serialize)]` for automatic JSON conversion
5. **HTML responses** - Return `Html<String>` for preview endpoints

## Data Structures

### RGB Color

```rust
#[derive(Serialize, Deserialize, Debug, Clone)]
struct RgbColor {
    r: u8,  // 0-255
    g: u8,  // 0-255
    b: u8,  // 0-255
}
```

### Color Response (Conversions)

```rust
#[derive(Serialize)]
struct ColorResponse {
    hex: String,      // Format: "#rrggbb" (always 6 digits with #)
    rgb: RgbColor,
}
```

### Color Name Response (Lookup)

```rust
#[derive(Serialize)]
struct ColorNameResponse {
    name: String,     // Lowercase CSS color name
    hex: String,      // Format: "#rrggbb"
    rgb: RgbColor,
}
```

### Health Response

```rust
#[derive(Serialize)]
struct HealthResponse {
    status: String,   // "ok"
    message: String,  // "API is running"
}
```

### Error Response

```rust
#[derive(Serialize)]
struct ErrorResponse {
    error: String,    // Error code: "invalid_format", "invalid_value", "not_found"
    message: String,  // Human-readable description
}
```

## Endpoint Specifications

### 1. Health Check (✅ Implemented)

**Route**: `GET /health`

**Handler**:

```rust
async fn health_check() -> Json<HealthResponse>
```

**Response**: Always 200 OK

```json
{
  "status": "ok",
  "message": "API is running"
}
```

---

### 2. Color Preview by Hex (✅ Implemented)

**Route**: `GET /color/:hex`

**Handler**:

```rust
async fn preview_color_hex(Path(hex): Path<String>) -> Result<Html<String>, (StatusCode, Json<ErrorResponse>)>
```

**Input**:

- `hex` - Path parameter, accepts:
  - 3-digit hex: `f50` → expands to `ff5500`
  - 6-digit hex: `ff5500`
  - With/without `#` prefix: `#ff5500` or `ff5500`

**Validation**:

- Strip `#` prefix if present
- Validate hex characters: `[0-9a-fA-F]`
- Expand 3-digit to 6-digit: `f50` → `ff5500` (each digit doubles)
- Return 400 if invalid format

**Response**: HTML page

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Color Preview - #ff5500</title>
  </head>
  <body
    style="background-color: #ff5500; margin: 0; padding: 0; height: 100vh;"
  ></body>
</html>
```

**Implementation Notes**:

- Return `Html<String>` from `axum::response::Html`
- Use inline styles for full-screen colored background
- Include color code in page title

---

### 3. Hex to RGB Conversion (⏳ To Implement)

**Route**: `GET /convert/hex-to-rgb/:hex`

**Handler**:

```rust
async fn hex_to_rgb(Path(hex): Path<String>) -> Result<Json<ColorResponse>, (StatusCode, Json<ErrorResponse>)>
```

**Input**:

- Same hex format support as preview endpoint

**Validation**:

- Strip `#` prefix if present
- Validate hex format
- Expand 3-digit to 6-digit if needed

**Conversion Algorithm**:

```rust
// For 6-digit hex "ff5500":
// r = parse hex[0..2] → 255
// g = parse hex[2..4] → 85
// b = parse hex[4..6] → 0

// For 3-digit hex "f50":
// Expand to "ff5500" first, then convert
```

**Response**: 200 OK

```json
{
  "hex": "#ff5500",
  "rgb": {
    "r": 255,
    "g": 85,
    "b": 0
  }
}
```

**Errors**:

- 400 Bad Request - Invalid hex format

```json
{
  "error": "invalid_format",
  "message": "Invalid hex color format. Expected 3 or 6 digit hex code."
}
```

**Implementation Helper**:

```rust
fn parse_hex(hex: &str) -> Result<RgbColor, String> {
    // 1. Strip '#' if present
    // 2. Validate length (3 or 6)
    // 3. Validate hex characters
    // 4. Expand 3 to 6 digits if needed
    // 5. Parse pairs into u8 values
}
```

---

### 4. RGB to Hex Conversion (⏳ To Implement)

**Route**: `GET /convert/rgb-to-hex`

**Handler**:

```rust
#[derive(Deserialize)]
struct RgbQuery {
    r: u8,
    g: u8,
    b: u8,
}

async fn rgb_to_hex(Query(rgb): Query<RgbQuery>) -> Result<Json<ColorResponse>, (StatusCode, Json<ErrorResponse>)>
```

**Input**: Query parameters

- `r` - Required, integer 0-255
- `g` - Required, integer 0-255
- `b` - Required, integer 0-255

**Validation**:

- Axum automatically validates u8 range (0-255)
- Returns 400 if parameters missing or invalid

**Conversion Algorithm**:

```rust
fn rgb_to_hex_string(r: u8, g: u8, b: u8) -> String {
    format!("#{:02x}{:02x}{:02x}", r, g, b)
}
```

**Response**: 200 OK

```json
{
  "hex": "#ff5500",
  "rgb": {
    "r": 255,
    "g": 85,
    "b": 0
  }
}
```

**Errors**:

- 400 Bad Request - Missing or invalid parameters

```json
{
  "error": "invalid_value",
  "message": "RGB values must be between 0 and 255"
}
```

---

### 5. Color Preview by RGB (⏳ To Implement)

**Route**: `GET /color/rgb`

**Handler**:

```rust
async fn preview_color_rgb(Query(rgb): Query<RgbQuery>) -> Result<Html<String>, (StatusCode, Json<ErrorResponse>)>
```

**Input**: Query parameters (same as rgb-to-hex)

- `r`, `g`, `b` - Required, 0-255

**Response**: HTML page with RGB background

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Color Preview - rgb(255, 85, 0)</title>
  </head>
  <body
    style="background-color: rgb(255, 85, 0); margin: 0; padding: 0; height: 100vh;"
  ></body>
</html>
```

**Implementation Notes**:

- Similar to hex preview but use `rgb(r, g, b)` format in CSS
- Include RGB values in page title

---

### 6. Color Lookup by Name (⏳ To Implement)

**Route**: `GET /colors/:name`

**Handler**:

```rust
async fn lookup_color_name(Path(name): Path<String>) -> Result<Json<ColorNameResponse>, (StatusCode, Json<ErrorResponse>)>
```

**Input**:

- `name` - Path parameter, CSS color name (case-insensitive)

**Validation**:

- Convert to lowercase for lookup
- Check against CSS color name map
- Return 404 if not found

**Response**: 200 OK

```json
{
  "name": "orange",
  "hex": "#ffa500",
  "rgb": {
    "r": 255,
    "g": 165,
    "b": 0
  }
}
```

**Errors**:

- 404 Not Found - Color name not recognized

```json
{
  "error": "not_found",
  "message": "Color name 'xyz' not recognized. Must be a valid CSS color name."
}
```

**Implementation**:

Option 1: Use a static HashMap (recommended)

```rust
use std::sync::LazyLock;
use std::collections::HashMap;

static CSS_COLORS: LazyLock<HashMap<&str, (u8, u8, u8)>> = LazyLock::new(|| {
    HashMap::from([
        ("red", (255, 0, 0)),
        ("orange", (255, 165, 0)),
        ("yellow", (255, 255, 0)),
        ("green", (0, 128, 0)),
        ("blue", (0, 0, 255)),
        // ... add all 140 CSS colors
    ])
});
```

Option 2: Use match statement for common colors

```rust
fn get_css_color(name: &str) -> Option<(u8, u8, u8)> {
    match name.to_lowercase().as_str() {
        "red" => Some((255, 0, 0)),
        "orange" => Some((255, 165, 0)),
        // ... etc
        _ => None,
    }
}
```

---

## Error Handling

### Error Response Pattern

```rust
use axum::http::StatusCode;

// Helper function for consistent errors
fn error_response(status: StatusCode, error: &str, message: &str) -> (StatusCode, Json<ErrorResponse>) {
    (
        status,
        Json(ErrorResponse {
            error: error.to_string(),
            message: message.to_string(),
        })
    )
}

// Usage in handlers
return Err(error_response(
    StatusCode::BAD_REQUEST,
    "invalid_format",
    "Invalid hex color format"
));
```

### Error Types

- **400 Bad Request**: `invalid_format`, `invalid_value`, `missing_parameter`
- **404 Not Found**: `not_found`
- **500 Internal Server Error**: Should not happen with proper validation

---

## Router Configuration

```rust
let app = Router::new()
    // Health
    .route("/health", get(health_check))

    // Preview endpoints
    .route("/color/:hex", get(preview_color_hex))
    .route("/color/rgb", get(preview_color_rgb))

    // Conversion endpoints
    .route("/convert/hex-to-rgb/:hex", get(hex_to_rgb))
    .route("/convert/rgb-to-hex", get(rgb_to_hex))

    // Lookup endpoints
    .route("/colors/:name", get(lookup_color_name));
```

**Important**: Routes are matched in order. More specific routes should come before less specific ones.

---

## Testing Strategy

### Manual Testing with curl

```bash
# Health check
curl http://localhost:3000/health

# Hex preview (open in browser)
curl http://localhost:3000/color/ff5500
curl http://localhost:3000/color/%23ff5500  # With # (URL encoded)

# Hex to RGB conversion
curl http://localhost:3000/convert/hex-to-rgb/ff5500
curl http://localhost:3000/convert/hex-to-rgb/f50

# RGB to Hex conversion
curl "http://localhost:3000/convert/rgb-to-hex?r=255&g=85&b=0"

# RGB preview (open in browser)
curl "http://localhost:3000/color/rgb?r=255&g=85&b=0"

# Color name lookup
curl http://localhost:3000/colors/orange
curl http://localhost:3000/colors/dodgerblue

# Error cases
curl http://localhost:3000/convert/hex-to-rgb/zzz  # Invalid hex
curl http://localhost:3000/colors/notacolor         # Invalid name
curl "http://localhost:3000/convert/rgb-to-hex?r=300&g=0&b=0"  # Out of range
```

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hex_6_digit() {
        let rgb = parse_hex("ff5500").unwrap();
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 85);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_parse_hex_3_digit() {
        let rgb = parse_hex("f50").unwrap();
        assert_eq!(rgb.r, 255);
        assert_eq!(rgb.g, 85);
        assert_eq!(rgb.b, 0);
    }

    #[test]
    fn test_rgb_to_hex() {
        let hex = rgb_to_hex_string(255, 85, 0);
        assert_eq!(hex, "#ff5500");
    }

    #[test]
    fn test_css_color_lookup() {
        let color = get_css_color("orange").unwrap();
        assert_eq!(color, (255, 165, 0));
    }

    #[test]
    fn test_css_color_case_insensitive() {
        assert_eq!(get_css_color("ORANGE"), get_css_color("orange"));
    }
}
```

---

## CSS Color Names Reference

Implement all 140 standard CSS color names. Here are the most common ones:

### Basic Colors

- `red` - #ff0000 (255, 0, 0)
- `green` - #008000 (0, 128, 0)
- `blue` - #0000ff (0, 0, 255)
- `yellow` - #ffff00 (255, 255, 0)
- `orange` - #ffa500 (255, 165, 0)
- `purple` - #800080 (128, 0, 128)
- `pink` - #ffc0cb (255, 192, 203)
- `brown` - #a52a2a (165, 42, 42)
- `black` - #000000 (0, 0, 0)
- `white` - #ffffff (255, 255, 255)
- `gray` - #808080 (128, 128, 128)

### Extended Colors (Sample)

- `aliceblue` - #f0f8ff (240, 248, 255)
- `aqua` - #00ffff (0, 255, 255)
- `coral` - #ff7f50 (255, 127, 80)
- `crimson` - #dc143c (220, 20, 60)
- `cyan` - #00ffff (0, 255, 255)
- `dodgerblue` - #1e90ff (30, 144, 255)
- `gold` - #ffd700 (255, 215, 0)
- `hotpink` - #ff69b4 (255, 105, 180)
- `indigo` - #4b0082 (75, 0, 130)
- `lime` - #00ff00 (0, 255, 0)
- `magenta` - #ff00ff (255, 0, 255)
- `navy` - #000080 (0, 0, 128)
- `olive` - #808000 (128, 128, 0)
- `salmon` - #fa8072 (250, 128, 114)
- `silver` - #c0c0c0 (192, 192, 192)
- `teal` - #008080 (0, 128, 128)
- `turquoise` - #40e0d0 (64, 224, 208)
- `violet` - #ee82ee (238, 130, 238)

**Full list**: See [MDN Web Docs - CSS Color Names](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color)

---

## Implementation Order

Recommended implementation sequence:

1. ✅ **Health check** - Already implemented
2. ✅ **Hex preview** - Already implemented
3. ⏳ **Hex to RGB conversion** - Core functionality, reusable
4. ⏳ **RGB to Hex conversion** - Core functionality, completes conversions
5. ⏳ **RGB preview** - Uses RGB to Hex conversion
6. ⏳ **Color name lookup** - Most complex (requires color database)

---

## Dependencies Required

Current `Cargo.toml` dependencies are sufficient:

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Optional additions for color name lookup:

```toml
# If using a color names crate instead of manual mapping
[dependencies]
# css-color-parser = "0.1"  # Alternative approach
```

---

## Common Pitfalls

1. **Hex parsing**: Remember to handle both 3-digit and 6-digit formats
2. **Case sensitivity**: Color names should be case-insensitive
3. **URL encoding**: `#` in URLs must be encoded as `%23`
4. **Error responses**: Always return JSON for API endpoints (except HTML previews)
5. **RGB range**: Use `u8` type for automatic 0-255 validation
6. **Response format**: Always include `#` prefix in hex responses

---

## OpenAPI Spec Reference

The complete API specification is in `openapi.yaml` at the project root. Use it for:

- Exact request/response formats
- Parameter validation rules
- Error response structures
- Example requests

---

## Development Workflow

```bash
# Start development server
docker-compose up --build

# Test endpoints
curl http://localhost:3000/health

# Run tests
docker-compose run --rm api cargo test

# Format code
docker-compose run --rm api cargo fmt

# Check for issues
docker-compose run --rm api cargo clippy
```

---

## Next Steps

After implementing all endpoints:

1. Add comprehensive unit tests
2. Add integration tests for full request/response cycles
3. Consider adding rate limiting
4. Add CORS support if needed for web frontends
5. Add request logging middleware
6. Consider OpenAPI UI integration (Swagger UI)
