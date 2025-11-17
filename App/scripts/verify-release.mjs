#!/usr/bin/env node
/* eslint-env node */
 

/**
 * Production Release Checklist & Verification Script
 * Ensures all files are properly configured for v1.4.8 release
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');

const CHECKS = {
  PASSED: '✅',
  FAILED: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️'
};

const TARGET_VERSION = '1.4.8';
let allPassed = true;

console.log('\n🚀 Solar Panel Calculator - Production Release Verification\n');
console.log(`Target Version: ${TARGET_VERSION}\n`);
console.log('━'.repeat(60));

// Check 1: package.json
console.log('\n📦 Package Configuration:');
try {
  const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf-8'));
  
  if (pkg.version === TARGET_VERSION) {
    console.log(`${CHECKS.PASSED} Version: ${pkg.version}`);
  } else {
    console.log(`${CHECKS.FAILED} Version mismatch: ${pkg.version} !== ${TARGET_VERSION}`);
    allPassed = false;
  }
  
  if (!pkg.private) {
    console.log(`${CHECKS.PASSED} Package is public`);
  } else {
    console.log(`${CHECKS.WARNING} Package is private (may limit npm publishing)`);
  }
  
  if (pkg.description && pkg.description.length > 50) {
    console.log(`${CHECKS.PASSED} Description: ${pkg.description.substring(0, 60)}...`);
  } else {
    console.log(`${CHECKS.FAILED} Description too short or missing`);
    allPassed = false;
  }
  
  if (pkg.keywords && pkg.keywords.length >= 5) {
    console.log(`${CHECKS.PASSED} Keywords: ${pkg.keywords.length} defined`);
  } else {
    console.log(`${CHECKS.WARNING} Few keywords (${pkg.keywords?.length || 0})`);
  }
  
  if (pkg.repository && pkg.repository.url) {
    console.log(`${CHECKS.PASSED} Repository: ${pkg.repository.url}`);
  } else {
    console.log(`${CHECKS.FAILED} Repository URL missing`);
    allPassed = false;
  }
  
  if (pkg.license === 'MIT') {
    console.log(`${CHECKS.PASSED} License: MIT`);
  } else {
    console.log(`${CHECKS.WARNING} License: ${pkg.license || 'Not specified'}`);
  }
} catch (err) {
  console.log(`${CHECKS.FAILED} Failed to read package.json: ${err.message}`);
  allPassed = false;
}

// Check 2: Tauri config
console.log('\n🖥️  Desktop Configuration (Tauri):');
try {
  const tauriConfig = JSON.parse(readFileSync(join(appRoot, 'src-tauri', 'tauri.conf.json'), 'utf-8'));
  
  if (tauriConfig.version === TARGET_VERSION) {
    console.log(`${CHECKS.PASSED} Tauri version: ${tauriConfig.version}`);
  } else {
    console.log(`${CHECKS.FAILED} Tauri version mismatch: ${tauriConfig.version} !== ${TARGET_VERSION}`);
    allPassed = false;
  }
  
  if (tauriConfig.productName) {
    console.log(`${CHECKS.PASSED} Product name: ${tauriConfig.productName}`);
  }
  
  if (tauriConfig.bundle && tauriConfig.bundle.targets) {
    console.log(`${CHECKS.PASSED} Bundle targets: ${tauriConfig.bundle.targets.join(', ')}`);
  }
} catch (err) {
  console.log(`${CHECKS.FAILED} Failed to read tauri.conf.json: ${err.message}`);
  allPassed = false;
}

// Check 3: Android config
console.log('\n📱 Mobile Configuration (Android):');
try {
  const buildGradle = readFileSync(join(appRoot, 'android', 'app', 'build.gradle'), 'utf-8');
  
  const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
  const versionNameMatch = buildGradle.match(/versionName\s+"([^"]+)"/);
  
  if (versionCodeMatch) {
    console.log(`${CHECKS.PASSED} Version code: ${versionCodeMatch[1]}`);
  } else {
    console.log(`${CHECKS.FAILED} Version code not found`);
    allPassed = false;
  }
  
  if (versionNameMatch && versionNameMatch[1] === TARGET_VERSION) {
    console.log(`${CHECKS.PASSED} Version name: ${versionNameMatch[1]}`);
  } else {
    console.log(`${CHECKS.FAILED} Version name mismatch: ${versionNameMatch?.[1]} !== ${TARGET_VERSION}`);
    allPassed = false;
  }
  
  if (buildGradle.includes('universalApk true')) {
    console.log(`${CHECKS.PASSED} Universal APK enabled`);
  } else {
    console.log(`${CHECKS.WARNING} Universal APK not enabled`);
  }
} catch (err) {
  console.log(`${CHECKS.FAILED} Failed to read build.gradle: ${err.message}`);
  allPassed = false;
}

// Check 4: Documentation
console.log('\n📚 Documentation:');
const docs = ['README.md', 'CHANGELOG.md', 'LICENSE', 'INSTALLATION.md'];
docs.forEach(doc => {
  const path = join(appRoot, doc);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    const size = (content.length / 1024).toFixed(1);
    console.log(`${CHECKS.PASSED} ${doc} (${size} KB)`);
    
    if (doc === 'CHANGELOG.md' && !content.includes(TARGET_VERSION)) {
      console.log(`${CHECKS.WARNING}   ↳ Version ${TARGET_VERSION} not found in CHANGELOG`);
    }
  } else {
    console.log(`${CHECKS.FAILED} ${doc} missing`);
    allPassed = false;
  }
});

// Check 5: Build output
console.log('\n🏗️  Build Status:');
const distPath = join(appRoot, 'dist');
if (existsSync(distPath)) {
  console.log(`${CHECKS.PASSED} dist/ directory exists`);
  
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    console.log(`${CHECKS.PASSED} dist/index.html exists`);
  } else {
    console.log(`${CHECKS.WARNING} dist/index.html missing (run build first)`);
  }
} else {
  console.log(`${CHECKS.WARNING} dist/ directory missing (run build first)`);
}

// Check 6: Git status
console.log('\n📝 Repository Status:');
try {
  const { execSync } = await import('child_process');
  
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  console.log(`${CHECKS.INFO} Current branch: ${branch}`);
  
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim() === '') {
    console.log(`${CHECKS.PASSED} Working directory clean`);
  } else {
    console.log(`${CHECKS.WARNING} Uncommitted changes detected`);
    const lines = status.trim().split('\n').slice(0, 5);
    lines.forEach(line => console.log(`  ${line}`));
    if (status.trim().split('\n').length > 5) {
      console.log(`  ... and ${status.trim().split('\n').length - 5} more`);
    }
  }
  
  const tags = execSync('git tag -l', { encoding: 'utf-8' });
  if (tags.includes(`v${TARGET_VERSION}`)) {
    console.log(`${CHECKS.WARNING} Tag v${TARGET_VERSION} already exists`);
  } else {
    console.log(`${CHECKS.INFO} Tag v${TARGET_VERSION} not yet created`);
  }
} catch (err) {
  console.log(`${CHECKS.WARNING} Git status check failed: ${err.message}`);
}

// Summary
console.log('\n' + '━'.repeat(60));
if (allPassed) {
  console.log(`\n${CHECKS.PASSED} All critical checks passed!`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review changes: git status && git diff');
  console.log('   2. Commit: git add -A && git commit -m "Release v1.4.8"');
  console.log('   3. Tag: git tag v1.4.8');
  console.log('   4. Push: git push origin main --tags');
  console.log('   5. GitHub Actions will automatically build and release\n');
} else {
  console.log(`\n${CHECKS.FAILED} Some checks failed. Please fix issues before releasing.\n`);
  process.exit(1);
}
