use keyring::Entry;
use std::fs;
use std::path::PathBuf;

const SERVICE_NAME: &str = "com.coolify.monitor";

fn account_name(instance_id: &str) -> String {
    format!("instance-token:{instance_id}")
}

fn open_entry(instance_id: &str) -> Result<Entry, String> {
    Entry::new(SERVICE_NAME, &account_name(instance_id)).map_err(|error| error.to_string())
}

#[cfg(all(debug_assertions, target_os = "macos"))]
fn dev_token_path(instance_id: &str) -> Result<PathBuf, String> {
    let home = std::env::var("HOME").map_err(|error| error.to_string())?;
    Ok(PathBuf::from(home)
        .join(".coolify-monitor")
        .join("dev-secrets")
        .join(format!("{instance_id}.token")))
}

#[cfg(all(debug_assertions, target_os = "macos"))]
fn read_dev_token(instance_id: &str) -> Result<String, String> {
    let path = dev_token_path(instance_id)?;
    if path.exists() {
        return fs::read_to_string(path).map_err(|error| error.to_string());
    }

    // One-time migration from keychain for existing local dev setups.
    match open_entry(instance_id)?.get_password() {
        Ok(token) if !token.is_empty() => {
            write_dev_token(instance_id, &token)?;
            Ok(token)
        }
        Ok(_) => Err("NoEntry".to_string()),
        Err(keyring::Error::NoEntry) => Err("NoEntry".to_string()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(all(debug_assertions, target_os = "macos"))]
fn write_dev_token(instance_id: &str, token: &str) -> Result<(), String> {
    let path = dev_token_path(instance_id)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(path, token).map_err(|error| error.to_string())
}

#[cfg(all(debug_assertions, target_os = "macos"))]
fn delete_dev_token(instance_id: &str) -> Result<(), String> {
    let path = dev_token_path(instance_id)?;
    if !path.exists() {
        return Ok(());
    }

    fs::remove_file(path).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_instance_token(instance_id: String, token: String) -> Result<(), String> {
    #[cfg(all(debug_assertions, target_os = "macos"))]
    {
        return write_dev_token(&instance_id, &token);
    }

    #[cfg(not(all(debug_assertions, target_os = "macos")))]
    {
        open_entry(&instance_id)?
            .set_password(&token)
            .map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn get_instance_token(instance_id: String) -> Result<String, String> {
    #[cfg(all(debug_assertions, target_os = "macos"))]
    {
        return read_dev_token(&instance_id);
    }

    #[cfg(not(all(debug_assertions, target_os = "macos")))]
    {
        open_entry(&instance_id)?
            .get_password()
            .map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn delete_instance_token(instance_id: String) -> Result<(), String> {
    #[cfg(all(debug_assertions, target_os = "macos"))]
    {
        return delete_dev_token(&instance_id);
    }

    #[cfg(not(all(debug_assertions, target_os = "macos")))]
    {
        open_entry(&instance_id)?
            .delete_credential()
            .map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn has_instance_token(instance_id: String) -> Result<bool, String> {
    #[cfg(all(debug_assertions, target_os = "macos"))]
    {
        match read_dev_token(&instance_id) {
            Ok(password) => Ok(!password.is_empty()),
            Err(error) if error == "NoEntry" => Ok(false),
            Err(error) => Err(error),
        }
    }

    #[cfg(not(all(debug_assertions, target_os = "macos")))]
    {
        match open_entry(&instance_id)?.get_password() {
            Ok(password) => Ok(!password.is_empty()),
            Err(keyring::Error::NoEntry) => Ok(false),
            Err(error) => Err(error.to_string()),
        }
    }
}
