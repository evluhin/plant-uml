#!/usr/bin/env node

/**
 * Test installation script to verify dependencies work
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing PlantUML Confluence App Installation');
console.log('================================================');

// Test root installation
console.log('\n📦 Testing root dependencies...');
try {
  execSync('pnpm install --frozen-lockfile', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Root dependencies installed successfully');
} catch (error) {
  console.error('❌ Root installation failed:', error.message);
  process.exit(1);
}

// Test TypeScript compilation
console.log('\n🔧 Testing TypeScript compilation...');
try {
  execSync('pnpm -r build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Test linting
console.log('\n🔍 Testing linting...');
try {
  execSync('pnpm lint', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Linting passed');
} catch (error) {
  console.error('❌ Linting failed:', error.message);
  process.exit(1);
}

// Test unit tests
console.log('\n🧪 Testing unit tests...');
try {
  execSync('pnpm test', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Unit tests passed');
} catch (error) {
  console.error('❌ Unit tests failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 All tests passed! Installation is working correctly.');
console.log('\nNext steps:');
console.log('1. Configure AWS CLI: aws configure');
console.log('2. Install Forge CLI: npm install -g @forge/cli');
console.log('3. Deploy renderer: cd services/renderer && sam build && sam deploy --guided');
console.log('4. Deploy Forge app: cd apps/forge-plantuml && forge deploy');