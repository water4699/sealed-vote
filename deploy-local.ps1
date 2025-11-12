# Deploy to local network
Write-Host "Deploying to local network..." -ForegroundColor Green
Write-Host ""

Set-Location $PSScriptRoot

# Wait a moment for node to be ready
Start-Sleep -Seconds 2

# Deploy
npm run deploy:local

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the deployed contract address from above" -ForegroundColor White
    Write-Host "2. Update frontend/src/config/contract.ts with the new address" -ForegroundColor White
    Write-Host "3. Run: cd frontend && npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Make sure the local node is running in another terminal" -ForegroundColor Yellow
    Write-Host "Run: .\start-local-node.ps1" -ForegroundColor Yellow
}

