use axum::{
    extract::Path,
    http::header,
    response::{Html, IntoResponse},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::net::SocketAddr;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    message: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".to_string(),
        message: "API is running".to_string(),
    })
}

async fn color(Path(hex): Path<String>) -> Html<String> {
    let hex_color = if hex.starts_with('#') {
        hex
    } else {
        format!("#{}", hex)
    };

    Html(format!(
        r#"<!DOCTYPE html>
<html>
<head><title>Color: {}</title></head>
<body style="margin:0;padding:0;">
<div style="width:100vw;height:100vh;background-color:{};"></div>
</body>
</html>"#,
        hex_color, hex_color
    ))
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/color/:hex", get(color));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
