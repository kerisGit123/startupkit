#!/usr/bin/env node

/**
 * StartupKit Setup Script
 * Automated setup for new SaaS projects
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  log('\n🚀 StartupKit Setup Wizard\n', colors.bright + colors.blue);
  log('This script will help you set up your SaaS application.\n');

  // Step 1: Install dependencies
  log('📦 Step 1: Installing dependencies...', colors.yellow);
  try {
    execSync('npm install', { stdio: 'inherit' });
    log('✅ Dependencies installed\n', colors.green);
  } catch (error) {
    log('❌ Failed to install dependencies', colors.red);
    process.exit(1);
  }

  // Step 2: Setup Convex
  log('🗄️  Step 2: Setting up Convex database...', colors.yellow);
  const setupConvex = await question('Do you want to initialize Convex? (y/n): ');
  
  if (setupConvex.toLowerCase() === 'y') {
    try {
      log('Running: npx convex dev --once', colors.blue);
      execSync('npx convex dev --once', { stdio: 'inherit' });
      log('✅ Convex initialized\n', colors.green);
      
      // Seed database with default data
      log('🌱 Seeding database with default data...', colors.yellow);
      try {
        execSync('npx convex run setup/seedDatabase:seedDatabase', { stdio: 'inherit' });
        log('✅ Database seeded successfully\n', colors.green);
      } catch (error) {
        log('⚠️  Database seeding skipped. Run manually: npx convex run setup/seedDatabase:seedDatabase', colors.yellow);
      }
    } catch (error) {
      log('⚠️  Convex setup incomplete. Run manually: npx convex dev', colors.yellow);
    }
  }

  // Step 3: Create .env.local template
  log('📝 Step 3: Creating environment variables template...', colors.yellow);
  
  const envTemplate = `# Convex Database
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Stripe Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Stripe Price IDs
STARTER_MONTHLY_PRICE_ID=
STARTER_YEARLY_PRICE_ID=
PRO_MONTHLY_PRICE_ID=
PRO_YEARLY_PRICE_ID=

# Credit Pricing (Optional)
NEXT_PUBLIC_CREDIT_SMALL_AMOUNT=100
NEXT_PUBLIC_CREDIT_SMALL_PRICE_CENTS=1000
NEXT_PUBLIC_CREDIT_MEDIUM_AMOUNT=500
NEXT_PUBLIC_CREDIT_MEDIUM_PRICE_CENTS=4000
NEXT_PUBLIC_CREDIT_LARGE_AMOUNT=1000
NEXT_PUBLIC_CREDIT_LARGE_PRICE_CENTS=7000

# Support Configuration (Optional)
EMAIL_SUPPORT=
N8N_SUPPORT_WEBHOOK_PATH=
`;

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      log('⏭️  Skipping .env.local creation\n', colors.yellow);
    } else {
      fs.writeFileSync(envPath, envTemplate);
      log('✅ .env.local template created\n', colors.green);
    }
  } else {
    fs.writeFileSync(envPath, envTemplate);
    log('✅ .env.local template created\n', colors.green);
  }

  // Step 4: Instructions
  log('📋 Next Steps:\n', colors.bright + colors.blue);
  log('1. Configure Clerk:', colors.yellow);
  log('   - Go to https://dashboard.clerk.com');
  log('   - Create application and enable Organizations');
  log('   - Copy API keys to .env.local\n');
  
  log('2. Configure Stripe:', colors.yellow);
  log('   - Go to https://dashboard.stripe.com');
  log('   - Get API keys (Test mode)');
  log('   - Create products and prices');
  log('   - Copy price IDs to .env.local\n');
  
  log('3. Start development:', colors.yellow);
  log('   - Run: npm run dev');
  log('   - Visit: http://localhost:3000\n');
  
  log('4. Read full documentation:', colors.yellow);
  log('   - See: STARTUPKIT_SETUP.md\n');

  log('✨ Setup complete! Happy coding!\n', colors.bright + colors.green);
  
  rl.close();
}

main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});
