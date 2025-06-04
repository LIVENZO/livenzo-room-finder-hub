
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building Android App Bundle (AAB)...');

try {
  // Build the web app
  console.log('📦 Building web app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Sync with Capacitor
  console.log('🔄 Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  // Check if Android project exists
  if (!fs.existsSync('android')) {
    console.log('📱 Adding Android platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }

  // Build the AAB
  console.log('🏗️ Building AAB...');
  execSync('cd android && ./gradlew bundleRelease', { stdio: 'inherit' });

  console.log('✅ AAB build complete!');
  console.log('📍 Output location: android/app/build/outputs/bundle/release/app-release.aab');
  console.log('🎯 Ready for Play Store upload!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
