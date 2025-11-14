<#  Simple Server Test Script- self-contained smoke test that starts the server and runs a few HTTP checks. #>

# Simple Server Test Script
Write-Host "Starting BooksReader Server..." -ForegroundColor Cyan

# Start server in background job
$job = Start-Job -ScriptBlock {
    Set-Location "d:\Projects\BooksReader\Server"
    node server.js
}

Write-Host "Waiting for server to start (10 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`nRunning tests...`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "1. Health Check: " -NoNewline
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "PASS" -ForegroundColor Green
        Write-Host "   Uptime: $($health.uptime)s" -ForegroundColor Gray
    } else {
        Write-Host "FAIL" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Security Headers
Write-Host "2. Security Headers: " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    $hasHeaders = $response.Headers["X-Content-Type-Options"] -and $response.Headers["X-Response-Time"]
    if ($hasHeaders) {
        Write-Host "PASS" -ForegroundColor Green
        Write-Host "   X-Response-Time: $($response.Headers['X-Response-Time'])" -ForegroundColor Gray
    } else {
        Write-Host "FAIL - Missing headers" -ForegroundColor Red
    }
} catch {
    Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Authentication
Write-Host "3. Authentication Required: " -NoNewline
try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/books" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "FAIL - Should require auth" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "PASS" -ForegroundColor Green
    } else {
        Write-Host "FAIL - Wrong status code" -ForegroundColor Red
    }
}

# Test 4: Response Time
Write-Host "4. Response Time Test: " -NoNewline
try {
    $times = @()
    for ($i = 1; $i -le 5; $i++) {
        $start = Get-Date
        Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5 | Out-Null
        $end = Get-Date
        $times += ($end - $start).TotalMilliseconds
    }
    $avg = [math]::Round(($times | Measure-Object -Average).Average, 2)
    Write-Host "PASS" -ForegroundColor Green
    Write-Host "   Average: ${avg}ms" -ForegroundColor Gray
} catch {
    Write-Host "FAIL - $($_.Exception.Message)" -ForegroundColor Red
}

# Cleanup
Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Job $job
Remove-Job $job

Write-Host "`nTests complete!" -ForegroundColor Green
