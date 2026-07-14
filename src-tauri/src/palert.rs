use serde_json::Value;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, ORIGIN, REFERER};

#[tauri::command]
pub async fn fetch_palert_graphql() -> Result<Value, String> {
    let client = reqwest::Client::new();
    
    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    headers.insert(ORIGIN, HeaderValue::from_static("https://palert.earth.sinica.edu.tw"));
    headers.insert(REFERER, HeaderValue::from_static("https://palert.earth.sinica.edu.tw/realtime"));

    let query = serde_json::json!({
        "query": "query { pgaData: realtimePGA(recordTime: 0, type: 0, token: \"\") { dataVals timestamp } pgvData: realtimePGA(recordTime: 0, type: 1, token: \"\") { dataVals timestamp } }"
    });

    let response = client
        .post("https://palert.earth.sinica.edu.tw/graphql/")
        .headers(headers)
        .json(&query)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json_data = response
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(json_data)
}