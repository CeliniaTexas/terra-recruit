#define WIN32_LEAN_AND_MEAN

#include <windows.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <shellapi.h>
#include <wininet.h>

#include <string>
#include <vector>

#include "resource.h"

#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "advapi32.lib")

namespace {

struct EmbeddedFile {
  int resourceId;
  const wchar_t* fileName;
};

const EmbeddedFile kEmbeddedFiles[] = {
  {IDR_INDEX_HTML, L"index.html"},
  {IDR_STYLES_CSS, L"styles.css"},
  {IDR_DATA_JS, L"data.js"},
  {IDR_ENGINE_JS, L"engine.js"},
  {IDR_APP_JS, L"app.js"},
  {IDR_MANIFEST, L"manifest.webmanifest"},
  {IDR_ICON_192, L"icon-192.png"},
  {IDR_ICON_512, L"icon-512.png"}
};

bool ReadResource(HINSTANCE instance, int resourceId, std::vector<BYTE>& bytes) {
  HRSRC resource = FindResourceW(instance, MAKEINTRESOURCEW(resourceId), RT_RCDATA);
  if (resource == nullptr) {
    return false;
  }

  DWORD size = SizeofResource(instance, resource);
  HGLOBAL loaded = LoadResource(instance, resource);
  if (loaded == nullptr || size == 0) {
    return false;
  }

  const BYTE* data = static_cast<const BYTE*>(LockResource(loaded));
  if (data == nullptr) {
    return false;
  }

  bytes.assign(data, data + size);
  return true;
}

bool WriteFileBytes(const std::wstring& path, const std::vector<BYTE>& bytes) {
  HANDLE file = CreateFileW(
    path.c_str(),
    GENERIC_WRITE,
    FILE_SHARE_READ,
    nullptr,
    CREATE_ALWAYS,
    FILE_ATTRIBUTE_NORMAL,
    nullptr
  );
  if (file == INVALID_HANDLE_VALUE) {
    return false;
  }

  DWORD written = 0;
  bool success = WriteFile(
    file,
    bytes.data(),
    static_cast<DWORD>(bytes.size()),
    &written,
    nullptr
  ) != FALSE && written == bytes.size();

  CloseHandle(file);
  return success;
}

std::wstring JoinPath(const std::wstring& left, const std::wstring& right) {
  return left + L"\\" + right;
}

std::wstring GetLocalAppDataPath() {
  PWSTR path = nullptr;
  if (FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppData, KF_FLAG_CREATE, nullptr, &path))) {
    return L"";
  }

  std::wstring result(path);
  CoTaskMemFree(path);
  return result;
}

std::wstring ReadEnvironmentPath(const wchar_t* name) {
  DWORD size = GetEnvironmentVariableW(name, nullptr, 0);
  if (size == 0) {
    return L"";
  }

  std::wstring value(size, L'\0');
  DWORD written = GetEnvironmentVariableW(name, value.data(), size);
  if (written == 0 || written >= size) {
    return L"";
  }

  value.resize(written);
  return value;
}

std::wstring FindEdgePath() {
  const wchar_t* relativePath = L"Microsoft\\Edge\\Application\\msedge.exe";
  const wchar_t* environmentNames[] = {L"ProgramFiles(x86)", L"ProgramFiles", L"LocalAppData"};

  for (const wchar_t* environmentName : environmentNames) {
    std::wstring base = ReadEnvironmentPath(environmentName);
    if (!base.empty()) {
      std::wstring candidate = JoinPath(base, relativePath);
      if (PathFileExistsW(candidate.c_str())) {
        return candidate;
      }
    }
  }

  return L"";
}

bool LaunchEdge(
  const std::wstring& edgePath,
  const std::wstring& url,
  const std::wstring& profilePath,
  const std::wstring& workingDirectory
) {
  std::wstring command =
    L"\"" + edgePath + L"\" --app=\"" + url +
    L"\" --window-size=1440,960 --no-first-run --user-data-dir=\"" +
    profilePath + L"\"";

  STARTUPINFOW startup{};
  startup.cb = sizeof(startup);
  PROCESS_INFORMATION process{};

  BOOL created = CreateProcessW(
    edgePath.c_str(),
    command.data(),
    nullptr,
    nullptr,
    FALSE,
    CREATE_UNICODE_ENVIRONMENT,
    nullptr,
    workingDirectory.c_str(),
    &startup,
    &process
  );

  if (!created) {
    return false;
  }

  CloseHandle(process.hThread);
  CloseHandle(process.hProcess);
  return true;
}

void ShowError(const std::wstring& detail) {
  std::wstring message =
    L"\u542f\u52a8\u5931\u8d25\u3002\n\n" + detail;
  MessageBoxW(
    nullptr,
    message.c_str(),
    L"\u6cf0\u62c9\u5f81\u52df",
    MB_OK | MB_ICONERROR
  );
}

}  // namespace

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int) {
  const std::wstring localAppData = GetLocalAppDataPath();
  if (localAppData.empty()) {
    ShowError(L"Unable to locate the local application data directory.");
    return 1;
  }

  const std::wstring appDirectory = JoinPath(
    JoinPath(localAppData, L"TerraRecruit"),
    L"1.0.0"
  );
  const int createResult = SHCreateDirectoryExW(nullptr, appDirectory.c_str(), nullptr);
  if (createResult != ERROR_SUCCESS && createResult != ERROR_ALREADY_EXISTS) {
    ShowError(L"Unable to create the application data directory.");
    return 2;
  }

  for (const EmbeddedFile& file : kEmbeddedFiles) {
    std::vector<BYTE> bytes;
    if (!ReadResource(instance, file.resourceId, bytes)) {
      ShowError(std::wstring(L"Missing embedded resource: ") + file.fileName);
      return 3;
    }

    std::wstring outputPath = JoinPath(appDirectory, file.fileName);
    if (!WriteFileBytes(outputPath, bytes)) {
      ShowError(std::wstring(L"Unable to write: ") + outputPath);
      return 4;
    }
  }

  const std::wstring indexPath = JoinPath(appDirectory, L"index.html");
  wchar_t url[INTERNET_MAX_URL_LENGTH] = {};
  DWORD urlLength = INTERNET_MAX_URL_LENGTH;
  if (FAILED(UrlCreateFromPathW(indexPath.c_str(), url, &urlLength, 0))) {
    ShowError(L"Unable to prepare the application URL.");
    return 5;
  }

  const std::wstring profileDirectory = JoinPath(appDirectory, L"browser-profile");
  const std::wstring edgePath = FindEdgePath();
  if (!edgePath.empty() && LaunchEdge(edgePath, url, profileDirectory, appDirectory)) {
    return 0;
  }

  HINSTANCE shellResult = ShellExecuteW(
    nullptr,
    L"open",
    indexPath.c_str(),
    nullptr,
    appDirectory.c_str(),
    SW_SHOWNORMAL
  );

  if (reinterpret_cast<INT_PTR>(shellResult) <= 32) {
    ShowError(L"Microsoft Edge and the default browser could not be started.");
    return 6;
  }

  return 0;
}
