# BooksReader Server Test Script (PowerShell)
# Quick verification of server setup

Write-Host "`n🧪 BooksReader Server Quick Test`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$passed = 0
$failed = 0
$warnings = 0

function Test-Pass {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
    $script:passed++
}

function Test-Fail {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
    $script:failed++
}

function Test-Warn {
    param($message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
    $script:warnings++
}

function Write-Section {
    param($title)
    Write-Host "`n$("=" * 60)" -ForegroundColor Gray
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host ("=" * 60)`n -ForegroundColor Gray
}

# Change to Server directory
Set-Location $PSScriptRoot

# Phase 1: File Structure
Write-Section "Phase 1: File Structure"

$requiredFiles = @(
    "server.js",
    "package.json",
    ".env",
    "config/index.js",
    "config/database.js",
    "config/storage.js",
    "utils/logger.js",
    "middleware/auth.js",
    "middleware/errorHandler.js",
    "middleware/upload.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Test-Pass "File exists: $file"
    } else {
        Test-Fail "Missing file: $file"
    }
}

# Check required directories
$requiredDirs = @("config", "controllers", "services", "routes", "middleware", "utils")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Test-Pass "Directory exists: $dir/"
    } else {
        Test-Fail "Missing directory: $dir/"
    }
}

if (Test-Path "logs") {
    Test-Pass "logs/ directory exists"
} else {
    Test-Warn "logs/ directory not found - will be created on first run"
}

# Phase 2: Environment Variables
Write-Section "Phase 2: Environment Variables"

if (Test-Path ".env") {
    $envContent = Get-Content .env -Raw
    
    $requiredVars = @(
        "PORT",
        "CLIENT_URL",
        "AUTH0_DOMAIN",
        "AUTH0_AUDIENCE",
        "B2_ENDPOINT",
        "B2_KEY_ID",
        "B2_APPLICATION_KEY",
        "B2_BUCKET_NAME",
        "DATABASE_URL"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var\s*=\s*.+") {
            Test-Pass "Environment variable set: $var"
        } else {
            Test-Fail "Missing or empty: $var"
        }
    }
} else {
    Test-Fail ".env file not found"
    Write-Host "  Create .env from .env.example" -ForegroundColor Yellow
}

# Phase 3: Node Modules
Write-Section "Phase 3: Dependencies"

if (Test-Path "node_modules") {
    Test-Pass "node_modules directory exists"
    
    $requiredModules = @(
        "node_modules/express",
        "node_modules/winston",
        "node_modules/dotenv",
        "node_modules/@prisma/client"
    )
    
    foreach ($module in $requiredModules) {
        if (Test-Path $module) {
            Test-Pass "Module installed: $($module.Split('/')[-1])"
        } else {
            Test-Fail "Module missing: $($module.Split('/')[-1])"
        }
    }
} else {
    Test-Fail "node_modules not found - run 'npm install'"
}

# Phase 4: Syntax Check
Write-Section "Phase 4: Syntax Validation"

Write-Host "Testing JavaScript syntax..." -ForegroundColor Gray

# Test services first (NEW!)
$serviceFiles = @(
    "services/upload.service.js",
    "services/books.service.js",
    "services/analytics.service.js",
    "services/collections.service.js",
    "services/bookmarks.service.js"
)

Write-Host "`nChecking services..." -ForegroundColor Gray
foreach ($file in $serviceFiles) {
    if (Test-Path $file) {
        $result = node -c $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            Test-Pass "Service syntax OK: $file"
        } else {
            Test-Fail "Syntax error in $file"
            Write-Host "  $result" -ForegroundColor Red
        }
    } else {
        Test-Fail "Service file missing: $file"
    }
}

# Test controllers
$controllerFiles = @(
    "controllers/upload.controller.js",
    "controllers/books.controller.js",
    "controllers/analytics.controller.js",
    "controllers/collections.controller.js",
    "controllers/bookmarks.controller.js"
)

Write-Host "`nChecking controllers..." -ForegroundColor Gray
foreach ($file in $controllerFiles) {
    if (Test-Path $file) {
        $result = node -c $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            Test-Pass "Controller syntax OK: $file"
        } else {
            Test-Fail "Syntax error in $file"
            Write-Host "  $result" -ForegroundColor Red
        }
    } else {
        Test-Fail "Controller file missing: $file"
    }
}

# Test core files
$testFiles = @(
    "server.js",
    "config/index.js",
    "utils/logger.js"
)

Write-Host "`nChecking core files..." -ForegroundColor Gray
foreach ($file in $testFiles) {
    $result = node -c $file 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Syntax OK: $file"
    } else {
        Test-Fail "Syntax error in $file"
        Write-Host "  $result" -ForegroundColor Red
    }
}

# Phase 5: Module Loading Test
Write-Section "Phase 5: Module Loading"

Write-Host "Testing config module..." -ForegroundColor Gray
$configTest = node -e "try { const {config} = require('./config'); console.log('OK'); } catch(e) { console.error(e.message); process.exit(1); }" 2>&1
if ($LASTEXITCODE -eq 0) {
    Test-Pass "Config module loads successfully"
} else {
    Test-Fail "Config module failed to load"
    Write-Host "  $configTest" -ForegroundColor Red
}

Write-Host "Testing logger module..." -ForegroundColor Gray
$loggerTest = node -e "try { const logger = require('./utils/logger'); console.log('OK'); } catch(e) { console.error(e.message); process.exit(1); }" 2>&1
if ($LASTEXITCODE -eq 0) {
    Test-Pass "Logger module loads successfully"
} else {
    Test-Fail "Logger module failed to load"
    Write-Host "  $loggerTest" -ForegroundColor Red
}

# Summary
Write-Section "Test Summary"

$total = $passed + $failed
Write-Host "Total Tests: $total"
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warnings" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "`n🎉 All tests passed! Server is ready to start.`n" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Start server: npm start"
    Write-Host "  2. Test health: Invoke-RestMethod http://localhost:3001/health"
    Write-Host "  3. View logs: Get-Content logs/combined.log -Wait`n"
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed. Please fix the issues above.`n" -ForegroundColor Yellow
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "  • Missing .env: Copy-Item .env.example .env"
    Write-Host "  • Missing modules: npm install"
    Write-Host "  • Syntax errors: Check the files mentioned above`n"
    exit 1
}
