# Start local Hardhat node
Write-Host "Starting Hardhat node on http://127.0.0.1:8545..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the node" -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
npx hardhat node

