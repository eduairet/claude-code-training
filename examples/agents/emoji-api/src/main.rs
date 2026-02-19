use std::sync::LazyLock;

use axum::{extract::Query, http::StatusCode, response::IntoResponse, Json, Router};
use serde::{Deserialize, Serialize};
use strsim::jaro_winkler;
use utoipa::{IntoParams, OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

// ---------------------------------------------------------------------------
// Emoji map
// ---------------------------------------------------------------------------

static EMOJI_MAP: LazyLock<Vec<(&str, &str)>> = LazyLock::new(|| {
    vec![
        // Food & Drink
        ("taco", "🌮"),
        ("burrito", "🌯"),
        ("pizza", "🍕"),
        ("hamburger", "🍔"),
        ("hotdog", "🌭"),
        ("fries", "🍟"),
        ("popcorn", "🍿"),
        ("sandwich", "🥪"),
        ("bagel", "🥯"),
        ("pretzel", "🥨"),
        ("cheese", "🧀"),
        ("egg", "🥚"),
        ("bacon", "🥓"),
        ("steak", "🥩"),
        ("chicken", "🍗"),
        ("shrimp", "🦐"),
        ("sushi", "🍣"),
        ("ramen", "🍜"),
        ("spaghetti", "🍝"),
        ("rice", "🍚"),
        ("curry", "🍛"),
        ("dumpling", "🥟"),
        ("cookie", "🍪"),
        ("cake", "🎂"),
        ("pie", "🥧"),
        ("chocolate", "🍫"),
        ("candy", "🍬"),
        ("lollipop", "🍭"),
        ("donut", "🍩"),
        ("icecream", "🍦"),
        ("coffee", "☕"),
        ("tea", "🍵"),
        ("beer", "🍺"),
        ("wine", "🍷"),
        ("cocktail", "🍸"),
        ("juice", "🧃"),
        ("milk", "🥛"),
        ("water", "💧"),
        ("apple", "🍎"),
        ("banana", "🍌"),
        ("orange", "🍊"),
        ("lemon", "🍋"),
        ("grape", "🍇"),
        ("watermelon", "🍉"),
        ("strawberry", "🍓"),
        ("peach", "🍑"),
        ("cherry", "🍒"),
        ("pineapple", "🍍"),
        ("coconut", "🥥"),
        ("avocado", "🥑"),
        ("broccoli", "🥦"),
        ("carrot", "🥕"),
        ("corn", "🌽"),
        ("pepper", "🌶️"),
        ("mushroom", "🍄"),
        ("tomato", "🍅"),
        ("potato", "🥔"),
        ("onion", "🧅"),
        ("garlic", "🧄"),
        // Animals
        ("dog", "🐕"),
        ("cat", "🐈"),
        ("mouse", "🐁"),
        ("rabbit", "🐇"),
        ("fox", "🦊"),
        ("bear", "🐻"),
        ("panda", "🐼"),
        ("koala", "🐨"),
        ("tiger", "🐯"),
        ("lion", "🦁"),
        ("cow", "🐄"),
        ("pig", "🐷"),
        ("frog", "🐸"),
        ("monkey", "🐒"),
        ("chicken", "🐔"),
        ("penguin", "🐧"),
        ("bird", "🐦"),
        ("eagle", "🦅"),
        ("owl", "🦉"),
        ("duck", "🦆"),
        ("swan", "🦢"),
        ("parrot", "🦜"),
        ("flamingo", "🦩"),
        ("whale", "🐋"),
        ("dolphin", "🐬"),
        ("shark", "🦈"),
        ("octopus", "🐙"),
        ("fish", "🐟"),
        ("crab", "🦀"),
        ("lobster", "🦞"),
        ("turtle", "🐢"),
        ("snake", "🐍"),
        ("lizard", "🦎"),
        ("crocodile", "🐊"),
        ("dinosaur", "🦕"),
        ("dragon", "🐉"),
        ("butterfly", "🦋"),
        ("bee", "🐝"),
        ("ant", "🐜"),
        ("ladybug", "🐞"),
        ("spider", "🕷️"),
        ("scorpion", "🦂"),
        ("horse", "🐴"),
        ("unicorn", "🦄"),
        ("zebra", "🦓"),
        ("giraffe", "🦒"),
        ("elephant", "🐘"),
        ("rhino", "🦏"),
        ("hippo", "🦛"),
        ("camel", "🐫"),
        ("llama", "🦙"),
        ("gorilla", "🦍"),
        ("sloth", "🦥"),
        ("otter", "🦦"),
        ("skunk", "🦨"),
        ("hedgehog", "🦔"),
        ("bat", "🦇"),
        ("wolf", "🐺"),
        ("deer", "🦌"),
        // Nature & Weather
        ("sun", "☀️"),
        ("moon", "🌙"),
        ("star", "⭐"),
        ("cloud", "☁️"),
        ("rain", "🌧️"),
        ("snow", "❄️"),
        ("lightning", "⚡"),
        ("tornado", "🌪️"),
        ("rainbow", "🌈"),
        ("fire", "🔥"),
        ("volcano", "🌋"),
        ("ocean", "🌊"),
        ("mountain", "🏔️"),
        ("tree", "🌳"),
        ("flower", "🌸"),
        ("rose", "🌹"),
        ("tulip", "🌷"),
        ("sunflower", "🌻"),
        ("cactus", "🌵"),
        ("leaf", "🍃"),
        ("clover", "🍀"),
        ("earth", "🌍"),
        // Emotions & People
        ("smile", "😊"),
        ("laugh", "😂"),
        ("love", "❤️"),
        ("heart", "❤️"),
        ("kiss", "😘"),
        ("wink", "😉"),
        ("cool", "😎"),
        ("cry", "😢"),
        ("angry", "😠"),
        ("sad", "😞"),
        ("fear", "😨"),
        ("surprise", "😲"),
        ("think", "🤔"),
        ("sleep", "😴"),
        ("sick", "🤮"),
        ("clown", "🤡"),
        ("ghost", "👻"),
        ("skull", "💀"),
        ("alien", "👽"),
        ("robot", "🤖"),
        ("poop", "💩"),
        ("thumbsup", "👍"),
        ("thumbsdown", "👎"),
        ("clap", "👏"),
        ("wave", "👋"),
        ("pray", "🙏"),
        ("muscle", "💪"),
        ("brain", "🧠"),
        ("eyes", "👀"),
        ("baby", "👶"),
        // Sports & Activities
        ("soccer", "⚽"),
        ("basketball", "🏀"),
        ("football", "🏈"),
        ("baseball", "⚾"),
        ("tennis", "🎾"),
        ("volleyball", "🏐"),
        ("rugby", "🏉"),
        ("golf", "⛳"),
        ("bowling", "🎳"),
        ("hockey", "🏒"),
        ("skiing", "⛷️"),
        ("surfing", "🏄"),
        ("swimming", "🏊"),
        ("cycling", "🚴"),
        ("running", "🏃"),
        ("boxing", "🥊"),
        ("wrestling", "🤼"),
        ("climbing", "🧗"),
        ("fishing", "🎣"),
        ("camping", "🏕️"),
        // Objects & Symbols
        ("rocket", "🚀"),
        ("airplane", "✈️"),
        ("car", "🚗"),
        ("bus", "🚌"),
        ("train", "🚆"),
        ("bicycle", "🚲"),
        ("boat", "⛵"),
        ("phone", "📱"),
        ("computer", "💻"),
        ("keyboard", "⌨️"),
        ("camera", "📷"),
        ("book", "📚"),
        ("pen", "🖊️"),
        ("clock", "🕐"),
        ("money", "💰"),
        ("gem", "💎"),
        ("trophy", "🏆"),
        ("medal", "🏅"),
        ("crown", "👑"),
        ("gift", "🎁"),
        ("balloon", "🎈"),
        ("party", "🎉"),
        ("music", "🎵"),
        ("guitar", "🎸"),
        ("drum", "🥁"),
        ("dice", "🎲"),
        ("puzzle", "🧩"),
        ("magnet", "🧲"),
        ("lock", "🔒"),
        ("key", "🔑"),
        ("hammer", "🔨"),
        ("shield", "🛡️"),
        ("sword", "⚔️"),
        ("bomb", "💣"),
        ("flag", "🏁"),
        ("warning", "⚠️"),
        ("check", "✅"),
        ("cross", "❌"),
        ("question", "❓"),
        ("exclamation", "❗"),
        ("100", "💯"),
    ]
});

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

#[derive(Deserialize, IntoParams)]
struct EmojiQuery {
    /// Text to match against emoji keywords
    q: Option<String>,
}

#[derive(Serialize, ToSchema)]
struct EmojiResponse {
    /// The matched emoji
    emoji: String,
    /// The keyword that was matched
    matched_keyword: String,
    /// Match confidence score (0.0–1.0)
    score: f64,
}

#[derive(Serialize, ToSchema)]
struct ErrorResponse {
    /// Error description
    error: String,
}

// ---------------------------------------------------------------------------
// Matching logic
// ---------------------------------------------------------------------------

fn find_best_match(query: &str) -> (&str, &str, f64) {
    let query_lower = query.to_lowercase();

    // Pass 1: exact match
    for &(keyword, emoji) in EMOJI_MAP.iter() {
        if keyword == query_lower {
            return (keyword, emoji, 1.0);
        }
    }

    // Pass 2: substring containment
    for &(keyword, emoji) in EMOJI_MAP.iter() {
        if keyword.contains(&query_lower) || query_lower.contains(keyword) {
            return (keyword, emoji, 0.9);
        }
    }

    // Pass 3: Jaro-Winkler similarity
    let mut best = ("", "", 0.0_f64);
    for &(keyword, emoji) in EMOJI_MAP.iter() {
        let score = jaro_winkler(&query_lower, keyword);
        if score > best.2 {
            best = (keyword, emoji, score);
        }
    }

    best
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

#[utoipa::path(
    get,
    path = "/emoji",
    params(EmojiQuery),
    responses(
        (status = 200, description = "Matched emoji", body = EmojiResponse),
        (status = 400, description = "Missing query", body = ErrorResponse),
    )
)]
async fn get_emoji(Query(params): Query<EmojiQuery>) -> impl IntoResponse {
    let query = match params.q {
        Some(q) if !q.trim().is_empty() => q,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"error": "query parameter `q` is required"})),
            )
                .into_response();
        }
    };

    let (keyword, emoji, score) = find_best_match(&query);

    Json(EmojiResponse {
        emoji: emoji.to_string(),
        matched_keyword: keyword.to_string(),
        score: (score * 1000.0).round() / 1000.0,
    })
    .into_response()
}

// ---------------------------------------------------------------------------
// OpenAPI + main
// ---------------------------------------------------------------------------

#[derive(OpenApi)]
#[openapi(
    paths(get_emoji),
    components(schemas(EmojiResponse, ErrorResponse))
)]
struct ApiDoc;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/emoji", axum::routing::get(get_emoji))
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("Emoji API running on http://localhost:3000");
    println!("Swagger UI at http://localhost:3000/swagger-ui");
    axum::serve(listener, app).await.unwrap();
}
