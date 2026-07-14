use std::sync::OnceLock;
use reqwest::Client;
use tauri::ipc::Response;

static CLIENT: OnceLock<Client> = OnceLock::new();

fn client() -> &'static Client {
    CLIENT.get_or_init(|| {
        Client::builder()
            .pool_max_idle_per_host(0)
            .build()
            .expect("failed to build kmoni http client")
    })
}

#[tauri::command]
pub async fn fetch_kmoni_bytes(url: String) -> Result<Response, String> {
    let response = client()
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("kmoni request returned {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    Ok(Response::new(bytes.to_vec()))
}
