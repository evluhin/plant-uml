#!/usr/bin/env node

/**
 * Verification script to ensure the PlantUML Confluence app is ready for deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Verifying PlantUML Confluence App Setup');
console.log('==========================================');

const checks = [
  {
    name: 'Dependencies installed',
    test: () => fs.existsSync('node_modules') && fs.existsSync('apps/forge-plantuml/package.json') && fs.existsSync('services/renderer/package.json'),
    fix: 'Run: npm install'
  },
  {
    name: 'TypeScript compilation',
    test: () => {
      try {
        execSync('npm run build', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'Check TypeScript errors and fix them'
  },
  {
    name: 'Unit tests passing',
    test: () => {
      try {
        execSync('npm run test', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'Fix failing tests'
  },
  {
    name: 'Manifest file exists',
    test: () => fs.existsSync('apps/forge-plantuml/manifest.yml'),
    fix: 'Ensure manifest.yml is present'
  },
  {
    name: 'SAM template exists',
    test: () => fs.existsSync('services/renderer/template.yaml'),
    fix: 'Ensure SAM template.yaml is present'
  }
];

let allPassed = true;

for (const check of checks) {
  process.stdout.write(`${check.name}... `);
  
  try {
    if (check.test()) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL');
      console.log(`   Fix: ${check.fix}`);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   Error: ${error.message}`);
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(40));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Install Forge CLI: npm install -g @forge/cli');
  console.log('2. Install AWS SAM CLI');
  console.log('3. Configure AWS credentials: aws configure');
  console.log('4. Deploy renderer: cd services/renderer && sam deploy --guided');
  console.log('5. Deploy Forge app: cd apps/forge-plantuml && forge deploy');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}