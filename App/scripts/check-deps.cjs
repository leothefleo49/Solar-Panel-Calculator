#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const platform = os.platform();
const checkRustOnly = process.argv[2] === 'rust';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function execCommand(cmd) {
  try {
    execSync(cmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkRust() {
  log('\n🔍 Checking for Rust...', 'cyan');
  
  if (execCommand('cargo --version')) {
    log('✅ Rust is installed!', 'green');
    return true;
  }

  log('❌ Rust not found. Installing...', 'yellow');
  
  try {
    if (platform === 'win32') {
      log('\n📥 Downloading Rust installer for Windows...', 'cyan');
      log('⚠️  This will open the installer. Please follow the prompts.', 'yellow');
      log('⚠️  After installation completes, restart your terminal and run this command again.\n', 'yellow');
      
      // Download and run rustup-init.exe
      execSync('powershell -Command "Invoke-WebRequest -Uri https://win.rustup.rs/x86_64 -OutFile $env:TEMP\\rustup-init.exe; Start-Process $env:TEMP\\rustup-init.exe -Wait"', { stdio: 'inherit' });
      
      log('\n✨ Rust installation started!', 'green');
      log('⚠️  Please restart your terminal and run the command again.', 'yellow');
      process.exit(0);
      
    } else if (platform === 'darwin' || platform === 'linux') {
      log('\n📥 Installing Rust via rustup...', 'cyan');
      
      // Run rustup installer
      execSync('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y', { stdio: 'inherit' });
      
      // Source the cargo env
      const cargoEnv = path.join(os.homedir(), '.cargo', 'env');
      if (fs.existsSync(cargoEnv)) {
        log('\n✨ Rust installed successfully!', 'green');
        log('⚠️  Please restart your terminal and run the command again.', 'yellow');
        process.exit(0);
      }
    }
  } catch {
    log('\n❌ Automatic installation failed.', 'red');
    log('\n📖 Please install Rust manually:', 'yellow');
    log('   Windows: https://win.rustup.rs/', 'cyan');
    log('   Mac/Linux: https://rustup.rs/', 'cyan');
    log('\n   After installation, restart your terminal and try again.', 'yellow');
    process.exit(1);
  }
}

function checkSystemDeps() {
  // Skip system dependency checks in CI environments
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    log('\n⏩ Skipping system dependency check in CI environment', 'cyan');
    return;
  }

  if (platform === 'linux') {
    log('\n🔍 Checking Linux system dependencies...', 'cyan');
    
    const requiredPackages = [
      'libgtk-3-dev',
      'libwebkit2gtk-4.1-dev',
      'libayatana-appindicator3-dev',
      'librsvg2-dev'
    ];
    
    let missingPackages = [];
    
    for (const pkg of requiredPackages) {
      if (!execCommand(`dpkg -s ${pkg}`)) {
        missingPackages.push(pkg);
      }
    }
    
    if (missingPackages.length > 0) {
      log('❌ Missing system packages:', 'yellow');
      missingPackages.forEach(pkg => log(`   - ${pkg}`, 'red'));
      log('\n📖 Install them with:', 'cyan');
      log(`   sudo apt-get update && sudo apt-get install -y ${missingPackages.join(' ')}`, 'bold');
      log('\n   Then run this command again.', 'yellow');
      process.exit(1);
    }
    
    log('✅ All system dependencies installed!', 'green');
  }
}

function main() {
  log(`\n${colors.bold}═══════════════════════════════════════${colors.reset}`, 'cyan');
  log(`${colors.bold}  Solar Panel Calculator - Dependency Check${colors.reset}`, 'cyan');
  log(`${colors.bold}═══════════════════════════════════════${colors.reset}\n`, 'cyan');
  
  if (checkRustOnly) {
    checkRust();
  } else {
    // Check Rust first
    checkRust();
    
    // Then check system-specific dependencies
    if (platform !== 'win32') {
      checkSystemDeps();
    }
  }
  
  log('\n✨ All dependencies are ready!', 'green');
  log('🚀 You can now run: npm run tauri:dev\n', 'cyan');
}

main();
