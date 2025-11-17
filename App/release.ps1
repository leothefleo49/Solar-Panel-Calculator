# Solar Panel Calculator v1.4.9 - Quick Release Script
# Run this after reviewing all changes

param(
    [switch]$DryRun,
    [switch]$SkipBuild,
    [switch]$Help
)

$VERSION = "1.4.9"
$ErrorActionPreference = "Stop"

function Write-Step {
    param($Message)
    Write-Host "`n✨ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

if ($Help) {
    Write-Host @"
🚀 Solar Panel Calculator - Release Script v1.4.0

Usage:
  .\release.ps1                    # Full release process
  .\release.ps1 -DryRun           # Preview without making changes
  .\release.ps1 -SkipBuild        # Skip build verification step
  .\release.ps1 -Help             # Show this help

Steps performed:
  1. Verify git repository status
  2. Run production build (unless -SkipBuild)
  3. Run release verification checks
  4. Show git diff summary
  5. Commit changes
  6. Create git tag
  7. Push to remote (with confirmation)

"@ -ForegroundColor White
    exit 0
}

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🌞 Solar Panel Calculator v$VERSION Release           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Step 1: Check git status
Write-Step "Checking git repository status..."
try {
    $branch = git rev-parse --abbrev-ref HEAD
    if ($branch -ne "main") {
        Write-Warning "Current branch is '$branch', not 'main'"
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y") { exit 1 }
    }
    Write-Success "On branch: $branch"
} catch {
    Write-Error "Not a git repository or git not available"
    exit 1
}

# Step 2: Build verification
if (-not $SkipBuild) {
    Write-Step "Running production build..."
    try {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would run: npm run build:prod" -ForegroundColor Yellow
        } else {
            npm run build:prod
            if ($LASTEXITCODE -ne 0) { throw "Build failed" }
            Write-Success "Build completed successfully"
        }
    } catch {
        Write-Error "Build failed: $_"
        exit 1
    }
} else {
    Write-Warning "Skipping build verification"
}

# Step 3: Run verification script
Write-Step "Running release verification checks..."
try {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: node scripts/verify-release.mjs" -ForegroundColor Yellow
    } else {
        node scripts/verify-release.mjs
        if ($LASTEXITCODE -ne 0) { throw "Verification failed" }
    }
} catch {
    Write-Error "Verification checks failed"
    exit 1
}

# Step 4: Show changes
Write-Step "Changes to be committed:"
git status --short
Write-Host ""

Write-Host "📝 Detailed changes:" -ForegroundColor Cyan
$changedFiles = git diff --name-only
if ($changedFiles) {
    foreach ($file in $changedFiles) {
        Write-Host "  • $file" -ForegroundColor White
    }
} else {
    Write-Warning "No changes detected"
}

# Step 5: Confirmation
if (-not $DryRun) {
    Write-Host "`n" -NoNewline
    $confirm = Read-Host "Proceed with commit and tag? (y/N)"
    if ($confirm -ne "y") {
        Write-Warning "Release cancelled by user"
        exit 0
    }
}

# Step 6: Commit
Write-Step "Committing changes..."
$commitMessage = "chore(release): v$VERSION - accurate product search & adaptive API pricing`n`n- Fixed product search to use literal queries for UPC, ASIN, EAN, model numbers`n- Styled category dropdown to match app theme`n- Updated API pricing info to reflect actual current rates and free tiers`n- Added explanations for RPM, TPM, RPD limits and regional variations`n- Improved search accuracy by respecting exact matches and product codes"

try {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: git add -A" -ForegroundColor Yellow
        Write-Host "  [DRY RUN] Would commit with message:" -ForegroundColor Yellow
        Write-Host "  $commitMessage" -ForegroundColor Gray
    } else {
        git add -A
        git commit -m $commitMessage
        Write-Success "Changes committed"
    }
} catch {
    Write-Error "Failed to commit: $_"
    exit 1
}

# Step 7: Create tag
Write-Step "Creating git tag v$VERSION..."
try {
    $tagExists = git tag -l "v$VERSION"
    if ($tagExists) {
        Write-Warning "Tag v$VERSION already exists"
        $overwrite = Read-Host "Delete and recreate? (y/N)"
        if ($overwrite -eq "y") {
            if ($DryRun) {
                Write-Host "  [DRY RUN] Would run: git tag -d v$VERSION" -ForegroundColor Yellow
            } else {
                git tag -d "v$VERSION"
            }
        } else {
            Write-Warning "Skipping tag creation"
            exit 0
        }
    }
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would run: git tag v$VERSION" -ForegroundColor Yellow
    } else {
        git tag "v$VERSION"
        Write-Success "Tag v$VERSION created"
    }
} catch {
    Write-Error "Failed to create tag: $_"
    exit 1
}

# Step 8: Push
Write-Step "Ready to push to remote..."
Write-Host @"

The following will be pushed:
  • Branch: $branch
  • Commit: $(git rev-parse --short HEAD)
  • Tag: v$VERSION

This will trigger GitHub Actions to build and release:
  - Windows (MSI + EXE)
  - macOS (DMG)
  - Linux (AppImage + DEB)
  - Android (APK)

"@ -ForegroundColor White

if (-not $DryRun) {
    $pushConfirm = Read-Host "Push to origin? (y/N)"
    if ($pushConfirm -eq "y") {
        try {
            git push origin $branch --tags
            Write-Success "Pushed to origin successfully!"
            
            Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎉 Release v$VERSION initiated successfully!         ║
║                                                            ║
║   Check GitHub Actions for build progress:                ║
║   https://github.com/leothefleo49/Solar-Panel-Calculator  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green
        } catch {
            Write-Error "Failed to push: $_"
            Write-Warning "You can manually push with: git push origin $branch --tags"
            exit 1
        }
    } else {
        Write-Warning "Push cancelled. Run manually: git push origin $branch --tags"
    }
} else {
    Write-Host "`n[DRY RUN] Would run: git push origin $branch --tags" -ForegroundColor Yellow
    Write-Host "`n✅ Dry run completed successfully!" -ForegroundColor Green
}
