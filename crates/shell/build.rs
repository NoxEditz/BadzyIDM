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
    println!("cargo:rerun-if-env-changed=GITHUB_SHA");
    // Icon, full version information and a standard manifest for
    // Badzy.exe. Antivirus programs trust a program more when it says
    // clearly who made it, what it is and that it runs without admin rights.
    #[cfg(windows)]
    {
        let version = env!("CARGO_PKG_VERSION");
        let mut res = winresource::WindowsResource::new();
        res.set_icon("icon.ico");
        res.set("ProductName", "Badzy");
        res.set("FileDescription", "Badzy");
        res.set("CompanyName", "Badzy");
        res.set("LegalCopyright", "Copyright (C) 2026 Badzy");
        res.set("OriginalFilename", "Badzy.exe");
        res.set("InternalName", "Badzy");
        res.set("ProductVersion", version);
        res.set("FileVersion", version);
        res.set_manifest(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity type="win32" name="Badzy.Badzy" version="1.0.0.0" processorArchitecture="*"/>
  <description>Badzy - download manager</description>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
    </application>
  </compatibility>
  <dependency>
    <dependentAssembly>
      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
    </dependentAssembly>
  </dependency>
</assembly>
"#,
        );
        if let Err(e) = res.compile() {
            println!("cargo:warning=could not embed the Windows icon: {e}");
        }
    }
}
