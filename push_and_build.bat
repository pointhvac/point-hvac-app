@echo off
chcp 65001 >nul
title Point HVAC - Push & Build APK

echo ============================================
echo   Point HVAC - Otomatik Push ve APK Build
echo ============================================
echo.

cd /d "%~dp0"

:: Git durumu kontrol
echo [1/4] Degisiklikler kontrol ediliyor...
git status --short
echo.

:: Stage + Commit
echo [2/4] Commit olusturuluyor...
git add -A
set /p MSG="Commit mesaji (Enter = 'update'): "
if "%MSG%"=="" set MSG=update
git commit -m "%MSG%"
echo.

:: Push
echo [3/4] GitHub'a push ediliyor...
git push origin main
echo.

:: Sonuc
echo [4/4] TAMAM!
echo.
echo ============================================
echo   GitHub Actions simdi APK olusturacak.
echo   Bekleyin: ~3-5 dakika
echo.
echo   APK indirme linki:
echo   https://github.com/pointhvac/point-hvac-app/actions
echo.
echo   Repo:
echo   https://github.com/pointhvac/point-hvac-app
echo ============================================
echo.
pause
