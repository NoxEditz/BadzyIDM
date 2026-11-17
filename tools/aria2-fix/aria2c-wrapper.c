/*
 * Badzy torrent fix: a stand-in for tools\aria2c.exe.
 *
 * Badzy starts "aria2c.exe" for its torrents. This program takes that name,
 * starts the real aria2 (renamed aria2c-real.exe, in the same folder) with the
 * very same arguments, and adds options that make torrents work on networks
 * where aria2's own defaults get stuck at "receiving" with no data:
 *   - normal (system) name lookup instead of aria2's own resolver, which
 *     fails on many Windows / VPN / router DNS setups, so no tracker and no
 *     DHT node is ever found
 *   - IPv4 only, a list of public trackers, shorter tracker time-outs
 *   - a common client name, as some peers refuse "aria2"
 * It also writes aria2's own log to aria2-fix.log next to this file, so a
 * problem that is left can be read. When Badzy closes this program, the real
 * aria2 is closed with it (job object).
 *
 * Build: x86_64-w64-mingw32-gcc -O2 -s -static -municode -o aria2c.exe aria2c-wrapper.c
 */
#define _WIN32_WINNT 0x0601
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <wchar.h>

static const wchar_t *EXTRA_OPTIONS =
    L" --async-dns=false"
    L" --disable-ipv6=true"
    L" --enable-dht6=false"
    L" --bt-tracker-connect-timeout=10"
    L" --bt-tracker-timeout=20"
    L" --peer-id-prefix=-qB4650-"
    L" --peer-agent=qBittorrent/4.6.5"
    L" --dht-entry-point=dht.libtorrent.org:25401"
    L" --bt-tracker="
    L"udp://tracker.opentrackr.org:1337/announce,"
    L"udp://open.demonii.com:1337/announce,"
    L"udp://tracker.torrent.eu.org:451/announce,"
    L"udp://open.stealth.si:80/announce,"
    L"udp://exodus.desync.com:6969/announce,"
    L"udp://tracker.openbittorrent.com:6969/announce,"
    L"udp://explodie.org:6969/announce,"
    L"udp://tracker.tiny-vps.com:6969/announce,"
    L"udp://open.tracker.cl:1337/announce,"
    L"udp://opentracker.i2p.rocks:6969/announce,"
    L"udp://tracker.dler.org:6969/announce,"
    L"udp://tracker.moeking.me:6969/announce,"
    L"https://tracker.tamersunion.org:443/announce";

static void log_line(const wchar_t *log, const wchar_t *what, const wchar_t *text)
{
    FILE *f = _wfopen(log, L"a");
    if (!f) return;
    SYSTEMTIME t;
    GetLocalTime(&t);
    fprintf(f, "[%04d-%02d-%02d %02d:%02d:%02d] %ls %ls\n", t.wYear, t.wMonth, t.wDay, t.wHour, t.wMinute, t.wSecond, what, text);
    fclose(f);
}

/* a log file that can be written: next to this program, else in %TEMP% */
static void pick_log(const wchar_t *dir, wchar_t *log, size_t n)
{
    swprintf(log, n, L"%ls\\aria2-fix.log", dir);
    /* never let it grow without end */
    WIN32_FILE_ATTRIBUTE_DATA info;
    if (GetFileAttributesExW(log, GetFileExInfoStandard, &info) && info.nFileSizeLow > (4u << 20)) DeleteFileW(log);
    FILE *f = _wfopen(log, L"a");
    if (f) {
        fclose(f);
        return;
    }
    wchar_t tmp[MAX_PATH];
    DWORD len = GetTempPathW(MAX_PATH, tmp);
    if (len > 0 && len < MAX_PATH) swprintf(log, n, L"%lsbadzy-aria2-fix.log", tmp);
}

int wmain(void)
{
    wchar_t self[MAX_PATH * 2], dir[MAX_PATH * 2], real[MAX_PATH * 2], log[MAX_PATH * 2];
    DWORD got = GetModuleFileNameW(NULL, self, MAX_PATH * 2);
    if (got == 0 || got >= MAX_PATH * 2) return 3;
    wcscpy(dir, self);
    wchar_t *slash = wcsrchr(dir, L'\\');
    if (!slash) return 3;
    *slash = 0;
    swprintf(real, MAX_PATH * 2, L"%ls\\aria2c-real.exe", dir);
    pick_log(dir, log, MAX_PATH * 2);

    if (GetFileAttributesW(real) == INVALID_FILE_ATTRIBUTES) {
        log_line(log, L"ERROR", L"aria2c-real.exe is missing next to this file: run install-torrent-fix.bat again");
        fputs("aria2c-real.exe is missing next to this file\n", stderr);
        return 2;
    }

    /* the arguments exactly as they came: everything after the program name */
    const wchar_t *cl = GetCommandLineW();
    const wchar_t *rest = cl;
    if (*rest == L'"') {
        rest++;
        while (*rest && *rest != L'"') rest++;
        if (*rest) rest++;
    } else {
        while (*rest && *rest != L' ' && *rest != L'\t') rest++;
    }
    /* a plain question ("--version", "--help") is answered by the real one, unchanged */
    int plain = wcsstr(rest, L"--version") != NULL || wcsstr(rest, L"--help") != NULL;

    size_t cap = wcslen(real) + wcslen(rest) + wcslen(EXTRA_OPTIONS) + wcslen(log) + 128;
    wchar_t *line = (wchar_t *)calloc(cap, sizeof(wchar_t));
    if (!line) return 3;
    if (plain) {
        swprintf(line, cap, L"\"%ls\"%ls", real, rest);
    } else {
        swprintf(line, cap, L"\"%ls\"%ls%ls \"--log=%ls\" --log-level=notice", real, rest, EXTRA_OPTIONS, log);
    }
    log_line(log, L"START", plain ? L"(plain question, no extra options)" : L"aria2 started with the extra options");

    HANDLE job = CreateJobObjectW(NULL, NULL);
    if (job) {
        JOBOBJECT_EXTENDED_LIMIT_INFORMATION lim;
        ZeroMemory(&lim, sizeof lim);
        lim.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        SetInformationJobObject(job, JobObjectExtendedLimitInformation, &lim, sizeof lim);
    }

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof si);
    si.cb = sizeof si;
    ZeroMemory(&pi, sizeof pi);
    if (!CreateProcessW(real, line, NULL, NULL, TRUE, CREATE_NO_WINDOW | CREATE_SUSPENDED, NULL, dir, &si, &pi)) {
        wchar_t why[64];
        swprintf(why, 64, L"CreateProcess failed, error %lu", GetLastError());
        log_line(log, L"ERROR", why);
        free(line);
        return 4;
    }
    if (job) AssignProcessToJobObject(job, pi.hProcess);
    ResumeThread(pi.hThread);
    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD code = 1;
    GetExitCodeProcess(pi.hProcess, &code);
    wchar_t done[64];
    swprintf(done, 64, L"aria2 ended with code %lu", code);
    log_line(log, L"END", done);
    CloseHandle(pi.hThread);
    CloseHandle(pi.hProcess);
    free(line);
    return (int)code;
}
