#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start BooksReader Client and Docker Server together

.DESCRIPTION
    This script starts both the Next.js client and Docker server in separate terminal windows
    
.EXAMPLE
    .\start-local-dev.ps1
#>

# Colors for output
$Green = @{ ForegroundColor = 'Green' }
$Yellow = @{ ForegroundColor = 'Yellow' }
$Red = @{ ForegroundColor = 'Red' }

Write-Host "🚀 Starting BooksReader Local Development Environment" @Yellow
Write-Host ""

# Check Docker
Write-Host "✓ Checking Docker..." @Yellow
if (!(docker --version)) {
    Write-Host "❌ Docker is not installed or not in PATH" @Red
    exit 1
}
Write-Host "✓ Docker found: $(docker --version)" @Green

# Check Node
Write-Host "✓ Checking Node.js..." @Yellow
if (!(node --version)) {
    Write-Host "❌ Node.js is not installed or not in PATH" @Red
    exit 1
}
Write-Host "✓ Node.js found: $(node --version)" @Green

# Check if Docker image exists
Write-Host "✓ Checking Docker image..." @Yellow
$imageExists = docker images --format "{{.Repository}}:{{.Tag}}" | Select-String "booksreader-server:test"
if (!$imageExists) {
    Write-Host "❌ Docker image 'booksreader-server:test' not found" @Red
    Write-Host "   Run: cd D:\Projects\BooksReader\Server" @Yellow
    Write-Host "        docker build -t booksreader-server:test ." @Yellow
    exit 1
}
Write-Host "✓ Docker image found: booksreader-server:test" @Green

# Check env files
Write-Host "✓ Checking environment files..." @Yellow
if (!(Test-Path "D:\Projects\BooksReader\Server\.env.production")) {
    Write-Host "❌ Server/.env.production not found" @Red
    exit 1
}
Write-Host "✓ Server/.env.production exists" @Green

if (!(Test-Path "D:\Projects\BooksReader\Client\.env.local")) {
    Write-Host "⚠️  Client/.env.local not found. Creating from .env.example..." @Yellow
    Copy-Item "D:\Projects\BooksReader\Client\.env.example" "D:\Projects\BooksReader\Client\.env.local"
    Write-Host "⚠️  Please edit D:\Projects\BooksReader\Client\.env.local with your credentials" @Yellow
    Write-Host "   Then run this script again" @Yellow
    exit 1
}
Write-Host "✓ Client/.env.local exists" @Green

Write-Host ""
Write-Host "✅ All checks passed!" @Green
Write-Host ""

# Ask user if they want to proceed
$proceed = Read-Host "Start Docker Server and Next.js Client? (y/n)"
if ($proceed -ne "y" -and $proceed -ne "Y") {
    Write-Host "Cancelled" @Red
    exit 0
}

Write-Host ""
Write-Host "📦 Starting Docker Server..." @Yellow
Write-Host "   Port: 5000" @Yellow
Write-Host "   Press Ctrl+C in the server window to stop" @Yellow
Write-Host ""

# Start Docker server in new window
Start-Process powershell -ArgumentList @"
    cd D:\Projects\BooksReader\Server
    Write-Host "🐳 Docker Server Starting..." -ForegroundColor Green
    Write-Host ""
    docker run -it --rm -p 5000:5000 --env-file .env.production booksreader-server:test
    Read-Host "Press Enter to close this window"
"@

Start-Sleep -Seconds 2

Write-Host "🎨 Starting Next.js Client..." @Yellow
Write-Host "   Port: 3000" @Yellow
Write-Host "   Press Ctrl+C in the client window to stop" @Yellow
Write-Host ""

# Start Next.js in new window
Start-Process powershell -ArgumentList @"
    cd D:\Projects\BooksReader\Client
    Write-Host "⚡ Next.js Client Starting..." -ForegroundColor Green
    Write-Host ""
    npm run dev
    Read-Host "Press Enter to close this window"
"@

Write-Host ""
Write-Host "✅ Services are starting!" @Green
Write-Host ""
Write-Host "📍 Access the application:" @Green
Write-Host "   Frontend: http://localhost:3000" @Green
Write-Host "   Backend:  http://localhost:5000" @Green
Write-Host ""
Write-Host "💡 Tips:" @Yellow
Write-Host "   - Check logs in the new terminal windows" @Yellow
Write-Host "   - Both windows will stay open while services run" @Yellow
Write-Host "   - Close windows to stop the services" @Yellow
Write-Host ""
