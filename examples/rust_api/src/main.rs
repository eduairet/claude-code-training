use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::{Html, IntoResponse, Response},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::LazyLock;

// Data Structures
#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RgbColor {
    r: u8,
    g: u8,
    b: u8,
}

#[derive(Serialize)]
struct ColorResponse {
    hex: String,
    rgb: RgbColor,
}

#[derive(Serialize)]
struct ColorNameResponse {
    name: String,
    hex: String,
    rgb: RgbColor,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
}

#[derive(Deserialize)]
struct RgbQuery {
    r: u8,
    g: u8,
    b: u8,
}

// CSS Colors Database using LazyLock
static CSS_COLORS: LazyLock<HashMap<&str, (u8, u8, u8)>> = LazyLock::new(|| {
    HashMap::from([
        ("aliceblue", (240, 248, 255)),
        ("antiquewhite", (250, 235, 215)),
        ("aqua", (0, 255, 255)),
        ("aquamarine", (127, 255, 212)),
        ("azure", (240, 255, 255)),
        ("beige", (245, 245, 220)),
        ("bisque", (255, 228, 196)),
        ("black", (0, 0, 0)),
        ("blanchedalmond", (255, 235, 205)),
        ("blue", (0, 0, 255)),
        ("blueviolet", (138, 43, 226)),
        ("brown", (165, 42, 42)),
        ("burlywood", (222, 184, 135)),
        ("cadetblue", (95, 158, 160)),
        ("chartreuse", (127, 255, 0)),
        ("chocolate", (210, 105, 30)),
        ("coral", (255, 127, 80)),
        ("cornflowerblue", (100, 149, 237)),
        ("cornsilk", (255, 248, 220)),
        ("crimson", (220, 20, 60)),
        ("cyan", (0, 255, 255)),
        ("darkblue", (0, 0, 139)),
        ("darkcyan", (0, 139, 139)),
        ("darkgoldenrod", (184, 134, 11)),
        ("darkgray", (169, 169, 169)),
        ("darkgrey", (169, 169, 169)),
        ("darkgreen", (0, 100, 0)),
        ("darkkhaki", (189, 183, 107)),
        ("darkmagenta", (139, 0, 139)),
        ("darkolivegreen", (85, 107, 47)),
        ("darkorange", (255, 140, 0)),
        ("darkorchid", (153, 50, 204)),
        ("darkred", (139, 0, 0)),
        ("darksalmon", (233, 150, 122)),
        ("darkseagreen", (143, 188, 143)),
        ("darkslateblue", (72, 61, 139)),
        ("darkslategray", (47, 79, 79)),
        ("darkslategrey", (47, 79, 79)),
        ("darkturquoise", (0, 206, 209)),
        ("darkviolet", (148, 0, 211)),
        ("deeppink", (255, 20, 147)),
        ("deepskyblue", (0, 191, 255)),
        ("dimgray", (105, 105, 105)),
        ("dimgrey", (105, 105, 105)),
        ("dodgerblue", (30, 144, 255)),
        ("firebrick", (178, 34, 34)),
        ("floralwhite", (255, 250, 240)),
        ("forestgreen", (34, 139, 34)),
        ("fuchsia", (255, 0, 255)),
        ("gainsboro", (220, 220, 220)),
        ("ghostwhite", (248, 248, 255)),
        ("gold", (255, 215, 0)),
        ("goldenrod", (218, 165, 32)),
        ("gray", (128, 128, 128)),
        ("grey", (128, 128, 128)),
        ("green", (0, 128, 0)),
        ("greenyellow", (173, 255, 47)),
        ("honeydew", (240, 255, 240)),
        ("hotpink", (255, 105, 180)),
        ("indianred", (205, 92, 92)),
        ("indigo", (75, 0, 130)),
        ("ivory", (255, 255, 240)),
        ("khaki", (240, 230, 140)),
        ("lavender", (230, 230, 250)),
        ("lavenderblush", (255, 240, 245)),
        ("lawngreen", (124, 252, 0)),
        ("lemonchiffon", (255, 250, 205)),
        ("lightblue", (173, 216, 230)),
        ("lightcoral", (240, 128, 128)),
        ("lightcyan", (224, 255, 255)),
        ("lightgoldenrodyellow", (250, 250, 210)),
        ("lightgray", (211, 211, 211)),
        ("lightgrey", (211, 211, 211)),
        ("lightgreen", (144, 238, 144)),
        ("lightpink", (255, 182, 193)),
        ("lightsalmon", (255, 160, 122)),
        ("lightseagreen", (32, 178, 170)),
        ("lightskyblue", (135, 206, 250)),
        ("lightslategray", (119, 136, 153)),
        ("lightslategrey", (119, 136, 153)),
        ("lightsteelblue", (176, 196, 222)),
        ("lightyellow", (255, 255, 224)),
        ("lime", (0, 255, 0)),
        ("limegreen", (50, 205, 50)),
        ("linen", (250, 240, 230)),
        ("magenta", (255, 0, 255)),
        ("maroon", (128, 0, 0)),
        ("mediumaquamarine", (102, 205, 170)),
        ("mediumblue", (0, 0, 205)),
        ("mediumorchid", (186, 85, 211)),
        ("mediumpurple", (147, 112, 219)),
        ("mediumseagreen", (60, 179, 113)),
        ("mediumslateblue", (123, 104, 238)),
        ("mediumspringgreen", (0, 250, 154)),
        ("mediumturquoise", (72, 209, 204)),
        ("mediumvioletred", (199, 21, 133)),
        ("midnightblue", (25, 25, 112)),
        ("mintcream", (245, 255, 250)),
        ("mistyrose", (255, 228, 225)),
        ("moccasin", (255, 228, 181)),
        ("navajowhite", (255, 222, 173)),
        ("navy", (0, 0, 128)),
        ("oldlace", (253, 245, 230)),
        ("olive", (128, 128, 0)),
        ("olivedrab", (107, 142, 35)),
        ("orange", (255, 165, 0)),
        ("orangered", (255, 69, 0)),
        ("orchid", (218, 112, 214)),
        ("palegoldenrod", (238, 232, 170)),
        ("palegreen", (152, 251, 152)),
        ("paleturquoise", (175, 238, 238)),
        ("palevioletred", (219, 112, 147)),
        ("papayawhip", (255, 239, 213)),
        ("peachpuff", (255, 218, 185)),
        ("peru", (205, 133, 63)),
        ("pink", (255, 192, 203)),
        ("plum", (221, 160, 221)),
        ("powderblue", (176, 224, 230)),
        ("purple", (128, 0, 128)),
        ("rebeccapurple", (102, 51, 153)),
        ("red", (255, 0, 0)),
        ("rosybrown", (188, 143, 143)),
        ("royalblue", (65, 105, 225)),
        ("saddlebrown", (139, 69, 19)),
        ("salmon", (250, 128, 114)),
        ("sandybrown", (244, 164, 96)),
        ("seagreen", (46, 139, 87)),
        ("seashell", (255, 245, 238)),
        ("sienna", (160, 82, 45)),
        ("silver", (192, 192, 192)),
        ("skyblue", (135, 206, 235)),
        ("slateblue", (106, 90, 205)),
        ("slategray", (112, 128, 144)),
        ("slategrey", (112, 128, 144)),
        ("snow", (255, 250, 250)),
        ("springgreen", (0, 255, 127)),
        ("steelblue", (70, 130, 180)),
        ("tan", (210, 180, 140)),
        ("teal", (0, 128, 128)),
        ("thistle", (216, 191, 216)),
        ("tomato", (255, 99, 71)),
        ("turquoise", (64, 224, 208)),
        ("violet", (238, 130, 238)),
        ("wheat", (245, 222, 179)),
        ("white", (255, 255, 255)),
        ("whitesmoke", (245, 245, 245)),
        ("yellow", (255, 255, 0)),
        ("yellowgreen", (154, 205, 50)),
    ])
});

// Utility Functions

// Helper function for consistent error responses
fn error_response(
    status: StatusCode,
    error: &str,
    message: &str,
) -> (StatusCode, Json<ErrorResponse>) {
    (
        status,
        Json(ErrorResponse {
            error: error.to_string(),
            message: message.to_string(),
        }),
    )
}

// Normalize hex: strip # and expand 3-digit to 6-digit
fn normalize_hex(hex: &str) -> String {
    let hex = hex.trim_start_matches('#');

    if hex.len() == 3 {
        let r = &hex[0..1];
        let g = &hex[1..2];
        let b = &hex[2..3];
        format!("{}{}{}{}{}{}", r, r, g, g, b, b)
    } else {
        hex.to_string()
    }
}

// Parse hex string to RgbColor
fn parse_hex(hex: &str) -> Result<RgbColor, (StatusCode, Json<ErrorResponse>)> {
    let hex = normalize_hex(hex);

    if hex.len() != 6 || !hex.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "invalid_format",
            "Invalid hex color format. Expected 3 or 6 digit hex code.",
        ));
    }

    let r = u8::from_str_radix(&hex[0..2], 16).unwrap();
    let g = u8::from_str_radix(&hex[2..4], 16).unwrap();
    let b = u8::from_str_radix(&hex[4..6], 16).unwrap();

    Ok(RgbColor { r, g, b })
}

// Convert RGB to hex string
fn rgb_to_hex_string(r: u8, g: u8, b: u8) -> String {
    format!("#{:02x}{:02x}{:02x}", r, g, b)
}

// Handlers

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "API is running".to_string(),
    })
}

async fn preview_color_hex(
    Path(hex): Path<String>,
) -> Result<Html<String>, (StatusCode, Json<ErrorResponse>)> {
    let normalized = normalize_hex(&hex);

    // Validate hex format
    if normalized.len() != 6 || !normalized.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "invalid_format",
            "Invalid hex color format",
        ));
    }

    let hex_color = format!("#{}", normalized);

    Ok(Html(format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Color Preview - {}</title>
</head>
<body style="background-color: {}; margin: 0; padding: 0; height: 100vh;"></body>
</html>"#,
        hex_color, hex_color
    )))
}

async fn hex_to_rgb(
    Path(hex): Path<String>,
) -> Result<Json<ColorResponse>, (StatusCode, Json<ErrorResponse>)> {
    let rgb = parse_hex(&hex)?;
    let normalized = normalize_hex(&hex);
    let hex_color = format!("#{}", normalized);

    Ok(Json(ColorResponse {
        hex: hex_color,
        rgb,
    }))
}

async fn rgb_to_hex(Query(params): Query<RgbQuery>) -> Json<ColorResponse> {
    let hex = rgb_to_hex_string(params.r, params.g, params.b);

    Json(ColorResponse {
        hex,
        rgb: RgbColor {
            r: params.r,
            g: params.g,
            b: params.b,
        },
    })
}

async fn preview_color_rgb(Query(params): Query<RgbQuery>) -> Html<String> {
    Html(format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Color Preview - rgb({}, {}, {})</title>
</head>
<body style="background-color: rgb({}, {}, {}); margin: 0; padding: 0; height: 100vh;"></body>
</html>"#,
        params.r, params.g, params.b, params.r, params.g, params.b
    ))
}

async fn lookup_color_name(Path(name): Path<String>) -> Result<Json<ColorNameResponse>, Response> {
    let name_lower = name.to_lowercase();

    if let Some(&(r, g, b)) = CSS_COLORS.get(name_lower.as_str()) {
        let hex = rgb_to_hex_string(r, g, b);
        Ok(Json(ColorNameResponse {
            name: name_lower,
            hex,
            rgb: RgbColor { r, g, b },
        }))
    } else {
        Err(error_response(
            StatusCode::NOT_FOUND,
            "not_found",
            "Color name not recognized. Must be a valid CSS color name.",
        )
        .into_response())
    }
}

#[tokio::main]
async fn main() {
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

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
