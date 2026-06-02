@echo off
echo Killing all Node.js processes...
tasklist | find /i "node.exe"
if %errorlevel%==0 (
  taskkill /F /IM node.exe
  timeout /t 2 /nobreak >nul
)

echo Cleaning .next folder...
if exist .next (
  rmdir /s /q .next
  echo .next deleted
)

echo Starting dev server...
npm run dev

pause
