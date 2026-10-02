@echo off
rem ---------------------------------------------------------------
rem  Launch the pseudo2sb3 desktop app (Windows).
rem  Double-click this file, or run:  start.cmd
rem
rem  Two environment quirks are handled here:
rem   1) ELECTRON_RUN_AS_NODE must be cleared. Some shells (agent
rem      terminals, some IDEs) export it, which makes electron.exe
rem      behave like plain node: require('electron') then returns a
rem      path string and dialog/app are undefined.
rem   2) Hardware acceleration is disabled inside electron/main.cjs
rem      (set PSB_GPU=1 before launching to turn it back on).
rem ---------------------------------------------------------------
setlocal
cd /d "%~dp0"
set "ELECTRON_RUN_AS_NODE="

if not exist "node_modules\electron" (
  echo [start] node_modules is missing. Run "npm install" first.
  pause
  exit /b 1
)

if exist "node_modules\.bin\electron.cmd" (
  call "node_modules\.bin\electron.cmd" .
) else (
  call npx electron .
)

endlocal
