@echo off
echo ============================================
echo ByteChat Test Cases (Table Format) - PDF Conversion
echo ============================================
echo.

REM Check if markdown file exists
if exist "BYTECHAT_TEST_CASES_TABLE_FORMAT.md" (
    echo [SUCCESS] Found table format markdown file
    echo.
    echo CONVERTING TO PDF - Choose a method:
    echo.
    echo METHOD 1 - Online Converter (EASIEST):
    echo   1. Go to: https://www.markdowntopdf.com/
    echo   2. Upload: BYTECHAT_TEST_CASES_TABLE_FORMAT.md
    echo   3. Click "Convert to PDF"
    echo   4. Download your PDF
    echo.
    echo METHOD 2 - Microsoft Word:
    echo   1. Open Microsoft Word
    echo   2. File -^> Open -^> Select BYTECHAT_TEST_CASES_TABLE_FORMAT.md
    echo   3. File -^> Save As -^> Choose PDF
    echo.
    echo METHOD 3 - Google Docs:
    echo   1. Go to docs.google.com
    echo   2. Upload BYTECHAT_TEST_CASES_TABLE_FORMAT.md
    echo   3. File -^> Download -^> PDF Document
    echo.
    echo Opening online converter in browser...
    echo.
    
    REM Open the online converter
    start "" "https://www.markdowntopdf.com/"
    
    echo Browser opened! Upload the file: BYTECHAT_TEST_CASES_TABLE_FORMAT.md
    echo.
) else (
    echo [ERROR] Markdown file not found!
    echo Please make sure BYTECHAT_TEST_CASES_TABLE_FORMAT.md exists in this folder.
    echo.
)

echo Press any key to exit...
pause >nul
