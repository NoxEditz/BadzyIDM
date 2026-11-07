use std::{fs, path::Path};

fn main() {
    // The web UI is built by `npm run build:native` in design/prototype (CI does this first).
    // Without it the shell still compiles and shows a short hint instead of the UI.
    let dist = Path::new("../../design/prototype/native/dist");
    let _ = fs::create_dir_all(dist);
    if !dist.join("index.html").exists() {
        let _ = fs::write(
            dist.join("index.html"),
            "<!doctype html><body style='background:#08090f;color:#f4eff7;font:16px sans-serif;padding:40px'>\
             The Badzy UI was not built. Run <code>npm run build:native</code> in design/prototype.</body>",
        );
    }
    println!("cargo:rerun-if-changed=../../design/prototype/native/dist");
    #[cfg(windows)]
    {
        let mut res = winresource::WindowsResource::new();
        res.set_icon("../app/icon.ico");
        res.set("ProductName", "Badzy");
        res.set("FileDescription", "Badzy");
        res.set("CompanyName", "Badzy");
        let _ = res.compile();
    }
}
