const path = require('path');
const { makeUniversalApp } = require('@electron/universal');

(async () => {
  const x64AppPath = path.resolve(__dirname, 'dist/Plant Buddy-darwin-x64/Plant Buddy.app');
  const arm64AppPath = path.resolve(__dirname, 'dist/Plant Buddy-darwin-arm64/Plant Buddy.app');
  const outAppPath = path.resolve(__dirname, 'dist/Plant Buddy-darwin-universal/Plant Buddy.app');

  const archSpecificFile = '**/Electron Framework.framework/Electron Framework';

  try {
    await makeUniversalApp({
      x64AppPath,
      arm64AppPath,
      outAppPath,
      x64ArchFiles: [archSpecificFile],
      arm64ArchFiles: [archSpecificFile]
    });
    console.log('Universal app created at:', outAppPath);
  } catch (err) {
    console.error('Failed to create universal app:', err);
    process.exit(1);
  }
})(); 