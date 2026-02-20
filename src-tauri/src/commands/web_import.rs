use reqwest::{Client, Url};
use serde::Serialize;
use std::process::Command;
use std::time::Duration;
use tauri::command;

const USER_AGENT: &str = "UnfoldReaderImport/1.0 (+https://github.com/mathangik/unfold)";
const MAX_RESPONSE_BYTES: usize = 2 * 1024 * 1024;

#[derive(Debug, Serialize)]
pub struct WebsiteHtmlResponse {
    pub html: String,
    pub final_url: String,
}

fn normalize_and_validate_url(input: &str) -> Result<Url, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("URL is required.".to_string());
    }

    let candidate = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        trimmed.to_string()
    } else {
        format!("https://{}", trimmed)
    };

    let parsed = Url::parse(&candidate).map_err(|_| "Invalid URL format.".to_string())?;

    match parsed.scheme() {
        "http" | "https" => Ok(parsed),
        _ => Err("Only http:// and https:// URLs are supported.".to_string()),
    }
}

fn normalize_and_validate_external_url(input: &str) -> Result<String, String> {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return Err("URL is required.".to_string());
    }

    let candidate = if trimmed.starts_with("http://")
        || trimmed.starts_with("https://")
        || trimmed.starts_with("mailto:")
        || trimmed.starts_with("tel:")
    {
        trimmed.to_string()
    } else {
        format!("https://{}", trimmed)
    };

    let parsed = Url::parse(&candidate).map_err(|_| "Invalid URL format.".to_string())?;

    match parsed.scheme() {
        "http" | "https" | "mailto" | "tel" => Ok(parsed.to_string()),
        _ => Err("Only http(s), mailto, and tel URLs are supported.".to_string()),
    }
}

#[command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    let sanitized_url = normalize_and_validate_external_url(&url)?;

    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = Command::new("open");
        cmd.arg(&sanitized_url);
        cmd
    };

    #[cfg(target_os = "linux")]
    let mut command = {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(&sanitized_url);
        cmd
    };

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = Command::new("cmd");
        cmd.args(["/C", "start", "", &sanitized_url]);
        cmd
    };

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    return Err("Opening external links is not supported on this platform.".to_string());

    command
        .spawn()
        .map_err(|error| format!("Failed to open URL: {error}"))?;

    Ok(())
}

#[command]
pub async fn fetch_website_html(url: String) -> Result<WebsiteHtmlResponse, String> {
    let parsed_url = normalize_and_validate_url(&url)?;

    let client = Client::builder()
        .timeout(Duration::from_secs(20))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|error| format!("Failed to initialize HTTP client: {error}"))?;

    let response = client
        .get(parsed_url)
        .header(reqwest::header::USER_AGENT, USER_AGENT)
        .header(
            reqwest::header::ACCEPT,
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        )
        .header(reqwest::header::ACCEPT_LANGUAGE, "en-US,en;q=0.9")
        .send()
        .await
        .map_err(|error| format!("Failed to fetch website: {error}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "Website responded with HTTP status {}.",
            response.status()
        ));
    }

    if let Some(content_length) = response.content_length() {
        if content_length as usize > MAX_RESPONSE_BYTES {
            return Err(format!(
                "Website is too large to import (max {} MB).",
                MAX_RESPONSE_BYTES / (1024 * 1024)
            ));
        }
    }

    let final_url = response.url().to_string();
    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read website response body: {error}"))?;

    if bytes.len() > MAX_RESPONSE_BYTES {
        return Err(format!(
            "Website is too large to import (max {} MB).",
            MAX_RESPONSE_BYTES / (1024 * 1024)
        ));
    }

    let html = String::from_utf8_lossy(&bytes).to_string();

    if html.trim().is_empty() {
        return Err("Website returned empty content.".to_string());
    }

    Ok(WebsiteHtmlResponse { html, final_url })
}
