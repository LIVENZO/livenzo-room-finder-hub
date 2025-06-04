
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Android App Bundle (AAB)...');

try {
  // Build the web app
  console.log('📦 Building web app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if android directory exists and remove it if corrupted
  if (fs.existsSync('android')) {
    console.log('🗑️ Removing existing Android project...');
    fs.rmSync('android', { recursive: true, force: true });
  }

  // Add Android platform
  console.log('📱 Adding Android platform...');
  execSync('npx cap add android', { stdio: 'inherit' });

  // Sync with Capacitor
  console.log('🔄 Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  // Build the AAB
  console.log('🏗️ Building AAB...');
  if (process.platform === 'win32') {
    execSync('cd android && .\\gradlew bundleRelease', { stdio: 'inherit' });
  } else {
    execSync('cd android && ./gradlew bundleRelease', { stdio: 'inherit' });
  }

  console.log('✅ AAB build complete!');
  console.log('📍 Output location: android/app/build/outputs/bundle/release/app-release.aab');
  console.log('🎯 Ready for Play Store upload!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you have Android Studio installed');
  console.log('2. Make sure you have Java JDK 11 or higher installed');
  console.log('3. Try running: npx cap doctor');
  process.exit(1);
}
