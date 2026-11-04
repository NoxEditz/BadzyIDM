fn main() {
    slint_build::compile("ui/setup.slint").expect("Slint UI failed to compile");
    #[cfg(windows)]
    {
        let mut res = winresource::WindowsResource::new();
        res.set_icon("../app/icon.ico");
        res.set("ProductName", "Badzy Setup (preview)");
        res.set("FileDescription", "Badzy Setup design preview - installs nothing");
        res.set("CompanyName", "Badzy");
        let _ = res.compile();
    }
}
