# PowerShell Script to Convert Markdown to PDF
# This script opens the HTML file in your default browser for PDF conversion

Write-Host "ByteChat Test Cases - PDF Conversion Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the current directory
$currentDir = Get-Location

# Check if HTML file exists
$htmlFile = Join-Path $currentDir "BYTECHAT_100_TEST_CASES.html"

if (Test-Path $htmlFile) {
    Write-Host "Found HTML file: $htmlFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening in your default browser..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To convert to PDF:" -ForegroundColor Cyan
    Write-Host "1. Wait for the page to load completely" -ForegroundColor White
    Write-Host "2. Press Ctrl+P (or Cmd+P on Mac)" -ForegroundColor White
    Write-Host "3. Select 'Save as PDF' or 'Microsoft Print to PDF'" -ForegroundColor White
    Write-Host "4. Click 'Save' and choose location" -ForegroundColor White
    Write-Host ""
    Write-Host "Recommended PDF Settings:" -ForegroundColor Cyan
    Write-Host "- Layout: Portrait" -ForegroundColor White
    Write-Host "- Paper size: A4" -ForegroundColor White
    Write-Host "- Margins: Default" -ForegroundColor White
    Write-Host "- Scale: 100%" -ForegroundColor White
    Write-Host "- Background graphics: ON" -ForegroundColor White
    Write-Host ""
    
    # Open the HTML file in default browser
    Start-Process $htmlFile
    
    Write-Host "Browser opened successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "If the browser didn't open, manually open:" -ForegroundColor Yellow
    Write-Host $htmlFile -ForegroundColor White
} else {
    Write-Host "ERROR: HTML file not found!" -ForegroundColor Red
    Write-Host "Expected location: $htmlFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please make sure BYTECHAT_100_TEST_CASES.html exists in the current directory." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
