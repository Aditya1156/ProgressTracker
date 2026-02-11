$env:SUPABASE_ACCESS_TOKEN = "sbp_5d734d591bb11369ea344ec10828044a46c5e8ea"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Pushing migration to add 142 students..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

npx supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "SUCCESS! Students added to database" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "- 142 CS students added"
    Write-Host "- 6th Semester, Section B"
    Write-Host "- Batch: 2023"
    Write-Host "- Default password: student123"
    Write-Host "- Login format: usn@college.edu"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to add students" -ForegroundColor Red
    Write-Host ""
}
