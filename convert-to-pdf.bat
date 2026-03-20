@echo off
echo ============================================
echo ByteChat Test Cases - PDF Conversion
echo ============================================
echo.

REM Check if HTML file exists
if exist "BYTECHAT_100_TEST_CASES.html" (
    echo [SUCCESS] Found HTML file
    echo.
    echo Opening in your default browser...
    echo.
    echo TO CONVERT TO PDF:
    echo 1. Wait for the page to load completely
    echo 2. Press Ctrl+P
    echo 3. Select 'Save as PDF' or 'Microsoft Print to PDF'
    echo 4. Click 'Save' and choose location
    echo.
    echo RECOMMENDED SETTINGS:
    echo - Layout: Portrait
    echo - Paper size: A4
    echo - Margins: Default
    echo - Scale: 100%%
    echo - Background graphics: ON
    echo.
    
    REM Open the HTML file
    start "" "BYTECHAT_100_TEST_CASES.html"
    
    echo Browser opened successfully!
    echo.
) else (
    echo [ERROR] HTML file not found!
    echo Please make sure BYTECHAT_100_TEST_CASES.html exists in this folder.
    echo.
)

echo Press any key to exit...
pause >nul
