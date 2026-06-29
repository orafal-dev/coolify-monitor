use tauri::{AppHandle, Runtime};

#[tauri::command]
pub fn is_system_notification_granted() -> Result<bool, String> {
    platform::is_granted().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn request_system_notification_permission() -> Result<bool, String> {
    platform::request().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn send_system_notification<R: Runtime>(
    app: AppHandle<R>,
    title: String,
    body: String,
) -> Result<(), String> {
    platform::send(&app, &title, &body).map_err(|error| error.to_string())
}

mod platform {
    use tauri::{AppHandle, Runtime};

    pub fn is_granted() -> Result<bool, Box<dyn std::error::Error>> {
        imp::is_granted()
    }

    pub fn request() -> Result<bool, Box<dyn std::error::Error>> {
        imp::request()
    }

    pub fn send<R: Runtime>(
        app: &AppHandle<R>,
        title: &str,
        body: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        imp::send(app, title, body)
    }

    #[cfg(target_os = "macos")]
    mod imp {
        use super::*;
        use mac_usernotifications::{
            block_on_main, blocking, check_bundle, get_notification_settings,
            AuthorizationStatus, Notification,
        };

        fn ensure_bundle() -> Result<(), Box<dyn std::error::Error>> {
            check_bundle().map_err(|error| -> Box<dyn std::error::Error> { error.into() })
        }

        fn read_settings(
        ) -> Result<mac_usernotifications::NotificationSettings, Box<dyn std::error::Error>> {
            ensure_bundle()?;
            Ok(block_on_main(get_notification_settings())?)
        }

        pub fn is_granted() -> Result<bool, Box<dyn std::error::Error>> {
            let settings = read_settings()?;
            Ok(matches!(
                settings.authorization_status,
                AuthorizationStatus::Authorized | AuthorizationStatus::Provisional
            ))
        }

        pub fn request() -> Result<bool, Box<dyn std::error::Error>> {
            ensure_bundle()?;
            Ok(blocking::request_auth()?)
        }

        pub fn send<R: Runtime>(
            _app: &AppHandle<R>,
            title: &str,
            body: &str,
        ) -> Result<(), Box<dyn std::error::Error>> {
            if !is_granted()? {
                return Err("Notification permission not granted".into());
            }

            Notification::new()
                .title(title)
                .message(body)
                .send_blocking()?;

            Ok(())
        }
    }

    #[cfg(not(target_os = "macos"))]
    mod imp {
        use super::*;
        use tauri_plugin_notification::NotificationExt;

        pub fn is_granted() -> Result<bool, Box<dyn std::error::Error>> {
            Ok(true)
        }

        pub fn request() -> Result<bool, Box<dyn std::error::Error>> {
            Ok(true)
        }

        pub fn send<R: Runtime>(
            app: &AppHandle<R>,
            title: &str,
            body: &str,
        ) -> Result<(), Box<dyn std::error::Error>> {
            app.notification()
                .builder()
                .title(title)
                .body(body)
                .show()
                .map_err(|error| -> Box<dyn std::error::Error> { error.into() })?;

            Ok(())
        }
    }
}
