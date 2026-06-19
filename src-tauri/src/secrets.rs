use keyring::Entry;

const SERVICE_NAME: &str = "com.coolify.monitor";

fn account_name(instance_id: &str) -> String {
  format!("instance-token:{instance_id}")
}

fn open_entry(instance_id: &str) -> Result<Entry, String> {
  Entry::new(SERVICE_NAME, &account_name(instance_id)).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_instance_token(instance_id: String, token: String) -> Result<(), String> {
  open_entry(&instance_id)?
    .set_password(&token)
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_instance_token(instance_id: String) -> Result<String, String> {
  open_entry(&instance_id)?
    .get_password()
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn delete_instance_token(instance_id: String) -> Result<(), String> {
  open_entry(&instance_id)?
    .delete_credential()
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn has_instance_token(instance_id: String) -> Result<bool, String> {
  match open_entry(&instance_id)?.get_password() {
    Ok(password) => Ok(!password.is_empty()),
    Err(keyring::Error::NoEntry) => Ok(false),
    Err(error) => Err(error.to_string()),
  }
}
