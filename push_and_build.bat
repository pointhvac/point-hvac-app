@echo off
chcp 65001 >nul
title Point HVAC - Push and Build APK

echo ============================================
echo   Point HVAC - Otomatik Push ve APK Build
echo ============================================
echo.

cd /d "%~dp0"

:: PDF teklif dosyalari kontrol (fontlar + logo)
echo [0/5] PDF teklif varliklari kontrol ediliyor...
set "MISSING="
if not exist "www\fonts\tahoma.ttf"                     set "MISSING=%MISSING% www\fonts\tahoma.ttf"
if not exist "www\fonts\tahomabd.ttf"                   set "MISSING=%MISSING% www\fonts\tahomabd.ttf"
if not exist "www\assets\logos\logo_siyah.png"          set "MISSING=%MISSING% www\assets\logos\logo_siyah.png"
if not exist "www\js\pdf-export.js"                     set "MISSING=%MISSING% www\js\pdf-export.js"
if defined MISSING (
    echo.
    echo UYARI: Asagidaki PDF teklif varliklari eksik:
    for %%f in (%MISSING%) do echo   - %%f
    echo PDF olusturmada sorun yasanabilir.
    echo.
    set /p CONT="Yine de devam edilsin mi? (E/H): "
    if /i not "%CONT%"=="E" (
        echo Iptal edildi.
        pause
        exit /b 1
    )
) else (
    echo   OK: Tahoma fontlari + logo_siyah.png + pdf-export.js mevcut.
)
echo.

:: Git durumu kontrol
echo [1/5] Degisiklikler kontrol ediliyor...
git status --short
echo.

:: Stage + Commit
echo [2/5] Commit olusturuluyor...
git add -A
set /p MSG="Commit mesaji (Enter = 'update'): "
if "%MSG%"=="" set MSG=update
git commit -m "%MSG%"
echo.

:: Remote'tan once cek (rebase) - reddedilmeyi onler
echo [3/5] Remote'tan son degisiklikler cekiliyor (rebase)...
git pull --rebase origin main
if errorlevel 1 (
    echo.
    echo HATA: git pull --rebase basarisiz oldu.
    echo Catismalari elle cozun, sonra: git rebase --continue
    echo Iptal icin: git rebase --abort
    echo.
    pause
    exit /b 1
)
echo.

:: Push
echo [4/5] GitHub'a push ediliyor...
git push origin main
if errorlevel 1 (
    echo.
    echo HATA: git push basarisiz oldu.
    echo.
    pause
    exit /b 1
)
echo.

:: Sonuc
echo [5/5] TAMAM!
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
