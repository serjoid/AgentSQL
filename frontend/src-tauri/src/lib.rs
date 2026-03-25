#[cfg(debug_assertions)]
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

/// Returns the backend API base URL.
/// Used by the frontend via Tauri invoke when it cannot infer the URL from env.
#[tauri::command]
fn get_backend_url() -> String {
    "http://localhost:8000".to_string()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // In release builds the Python backend is bundled as a sidecar.
            // In debug/dev mode the backend is started separately by the developer.
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    let sidecar_command = handle
                        .shell()
                        .sidecar("backend")
                        .expect("backend sidecar not found — run scripts/build_sidecar.py first");

                    let (_rx, _child) = sidecar_command
                        .spawn()
                        .expect("failed to spawn backend sidecar");
                });
            }

            // Open DevTools automatically in debug mode
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_backend_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
