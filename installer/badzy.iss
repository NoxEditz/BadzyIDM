; Badzy — Windows installer (Inno Setup 6)
; Built automatically by BUILD.bat -> dist\Badzy-Setup.exe
;
; Installs for the current user (no admin needed) into
;   %LOCALAPPDATA%\Programs\Badzy
; so yt-dlp can update itself. Adds a Start Menu folder, an optional desktop
; shortcut, "start with Windows", and a normal uninstaller.

#define MyAppName "Badzy"
#define MyAppExe "Badzy.exe"
; BUILD.bat passes the version of Cargo.toml: /DMyAppVersion=1.0.1
; the files that go into the setup (gathered by BUILD.bat / the CI)
#ifndef Stage
  #define Stage "..\build-cache\stage"
#endif
#ifndef MyAppVersion
  #define MyAppVersion "1.0.0"
#endif

[Setup]
AppId={{00055EF1-53F3-49BD-B049-C5D98F88FF41}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher=Badzy
DefaultDirName={localappdata}\Programs\Badzy
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=Badzy-Setup
#ifndef NoIcon
SetupIconFile=..\crates\shell\icon.ico
#endif
UninstallDisplayIcon={app}\{#MyAppExe}
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany=Badzy
VersionInfoDescription=Badzy Setup
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}
VersionInfoCopyright=Copyright (C) 2026 Badzy
; AppPublisherURL=
UninstallDisplayName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
; Badzy look: dark/red banner on the left, logo in the page corner
WizardImageFile=wizard-large-100.bmp,wizard-large-150.bmp,wizard-large-200.bmp
WizardSmallImageFile=wizard-small-55.bmp,wizard-small-83.bmp,wizard-small-110.bmp
DisableWelcomePage=no
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel1=Meet Badzy
WelcomeLabel2=Faster downloads, videos that just work, and a window that feels good to use.%n%nBadzy splits every file into several connections, resumes broken downloads, grabs videos from the web (with ffmpeg built in) and catches downloads from your browser.%n%nThis setup installs Badzy for your Windows account only. No administrator rights are needed.
SelectDirLabel3=Badzy will be installed in this folder.
SelectDirBrowseLabel=Click Next to continue, or Browse to pick another folder.
SelectTasksLabel2=Pick the extras you want, then click Next.
ReadyLabel1=Everything is ready.
ReadyLabel2a=Click Install to put Badzy on your computer.
ReadyLabel2b=Click Install to put Badzy on your computer with these choices:
InstallingLabel=Setting Badzy up, one moment...
FinishedHeadingLabel=Badzy is ready
FinishedLabel=Badzy has been installed.%n%nOpen it, then add the browser extension from the first screen so your browser hands downloads to Badzy.
ButtonInstall=&Install
ButtonFinish=&Finish

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"
Name: "autostart"; Description: "Start Badzy when Windows starts (recommended)"; GroupDescription: "Startup:"

[Files]
Source: "{#Stage}\{#MyAppExe}"; DestDir: "{app}"; Flags: ignoreversion
Source: "{#Stage}\THIRD-PARTY-NOTICES.txt"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
; the helpers go into {app}\tools; the app updates them there by itself
Source: "{#Stage}\tools\*"; DestDir: "{app}\tools"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#Stage}\extension\*"; DestDir: "{app}\extension"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#Stage}\extension-firefox\*"; DestDir: "{app}\extension-firefox"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#Stage}\badzy-firefox.xpi"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
; system runtime files, installed only when they are missing (see [Code])
#ifexist "..\build-cache\redist\vc_redist.x64.exe"
  #define HaveRedist
Source: "..\build-cache\redist\vc_redist.x64.exe"; DestDir: "{tmp}"; Flags: dontcopy
#endif

[InstallDelete]
; older versions kept the helpers next to the program
Type: files; Name: "{app}\yt-dlp.exe"
Type: files; Name: "{app}\ffmpeg.exe"

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
Name: "{group}\Browser extension folder"; Filename: "{app}\extension"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Registry]
; tells the app the installer already decided about "start with Windows"
Root: HKCU; Subkey: "Software\Badzy\Badzy"; ValueType: string; ValueName: "Installed"; ValueData: "1"; Flags: uninsdeletekey
; start in the background (next to the clock) when the user signs in
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "Badzy"; ValueData: """{app}\{#MyAppExe}"" --background"; Flags: uninsdeletevalue; Tasks: autostart
; "Open Badzy" in the browser add-in (badzy://open). The
; address given by the browser is never passed to the program.
Root: HKCU; Subkey: "Software\Classes\badzy"; ValueType: string; ValueName: ""; ValueData: "URL:Badzy"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\Classes\badzy"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""
Root: HKCU; Subkey: "Software\Classes\badzy\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExe},0"
Root: HKCU; Subkey: "Software\Classes\badzy\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExe}"" --from-browser"

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "Open Badzy now"; Flags: nowait postinstall skipifsilent
; after an automatic update: start the new version again
Filename: "{app}\{#MyAppExe}"; Flags: nowait; Check: IsAutoUpdate


[UninstallRun]
Filename: "{cmd}"; Parameters: "/C taskkill /IM {#MyAppExe} /F"; Flags: runhidden; RunOnceId: "StopBadzy"

[UninstallDelete]
Type: filesandordirs; Name: "{app}\extension"
Type: filesandordirs; Name: "{app}\extension-firefox"
Type: filesandordirs; Name: "{app}\tools"

[Code]
function IsAutoUpdate: Boolean;
begin
  Result := ExpandConstant('{param:AUTOUPDATE|0}') = '1';
end;

{ the Visual C++ 2015-2022 runtime (vcruntime140.dll) }
function RuntimeMissing: Boolean;
var
  Installed: Cardinal;
begin
  Result := True;
  if RegQueryDWordValue(HKLM64, 'SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64', 'Installed', Installed) and (Installed = 1)
     and FileExists(ExpandConstant('{sys}\vcruntime140.dll'))
     and FileExists(ExpandConstant('{sys}\vcruntime140_1.dll'))
     and FileExists(ExpandConstant('{sys}\msvcp140.dll')) then
    Result := False;
end;

procedure InstallRuntime;
var
  Code: Integer;
begin
#ifdef HaveRedist
  if not RuntimeMissing then exit;
  { an automatic update must not show any window }
  if WizardSilent then exit;
  try
    ExtractTemporaryFile('vc_redist.x64.exe');
  except
    exit;
  end;
  WizardForm.StatusLabel.Caption := 'Installing required system files...';
  { needs administrator rights: Windows asks once. If that is refused the
    program still works, it carries its own copy of these files. }
  ShellExec('runas', ExpandConstant('{tmp}\vc_redist.x64.exe'), '/install /quiet /norestart', '', SW_HIDE, ewWaitUntilTerminated, Code);
#endif
end;

{ the wizard in the colours of the program: near-black with red accents }
procedure Recolor(Parent: TWinControl);
var
  i: Integer;
  C: TControl;
begin
  for i := 0 to Parent.ControlCount - 1 do
  begin
    C := Parent.Controls[i];
    if C is TNewStaticText then
      TNewStaticText(C).Font.Color := $F7EFF4;
    if C is TNewCheckBox then
      TNewCheckBox(C).Font.Color := $F7EFF4;
    if C is TNewRadioButton then
      TNewRadioButton(C).Font.Color := $F7EFF4;
    if C is TPanel then
      TPanel(C).Color := $0F0908;
    if C is TWinControl then
      Recolor(TWinControl(C));
  end;
end;

procedure InitializeWizard;
begin
  WizardForm.Color := $0F0908;
  WizardForm.InnerPage.Color := $0F0908;
  WizardForm.MainPanel.Color := $181812;
  WizardForm.WelcomePage.Color := $0F0908;
  WizardForm.FinishedPage.Color := $0F0908;
  WizardForm.PageNameLabel.Font.Color := $F7EFF4;
  WizardForm.PageDescriptionLabel.Font.Color := $AA9AA1;
  WizardForm.PageNameLabel.Font.Style := [fsBold];
  WizardForm.WelcomeLabel1.Font.Size := 20;
  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.FinishedHeadingLabel.Font.Size := 20;
  WizardForm.FinishedHeadingLabel.Font.Style := [fsBold];
  Recolor(WizardForm);
  WizardForm.WelcomeLabel1.Font.Color := $360BF2;
  WizardForm.FinishedHeadingLabel.Font.Color := $360BF2;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    InstallRuntime;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  Code: Integer;
begin
  { the running program locks its files: close it (it saves everything and
    the downloads go on after the update) }
  Exec(ExpandConstant('{cmd}'), '/C taskkill /IM {#MyAppExe} >nul 2>&1', '', SW_HIDE, ewWaitUntilTerminated, Code);
  Sleep(2000);
  Exec(ExpandConstant('{cmd}'), '/C taskkill /F /IM {#MyAppExe} >nul 2>&1', '', SW_HIDE, ewWaitUntilTerminated, Code);
  Sleep(500);
  Result := '';
end;

