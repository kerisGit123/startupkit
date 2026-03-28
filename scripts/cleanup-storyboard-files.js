#!/usr/bin/env node

/**
 * Cleanup Script for Storyboard Files
 * Fixes mismatch between R2 storage and Convex storyboard_files table
 */

const { ConvexHttpClient } = require("convex/browser");
const { execSync } = require("child_process");

// Configuration
const CONVEX_URL = "https://watchful-ferret-363.convex.site";
const COMPANY_ID = "user_37rq5r2Xe93qxMYkvr629sqGb8a";

async function main() {
  console.log("🧹 Starting Storyboard Files Cleanup...\n");
  
  try {
    // Initialize Convex client
    const convex = new ConvexHttpClient(CONVEX_URL);
    
    // Step 1: Get all files for this company
    console.log("📋 Step 1: Fetching files from Convex...");
    const files = await convex.query("storyboard:listByCompany", { 
      companyId: COMPANY_ID 
    });
    
    console.log(`Found ${files.length} files in Convex for company: ${COMPANY_ID}`);
    
    // Step 2: Identify broken files (r2Key starts with "undefined/")
    console.log("\n🔍 Step 2: Identifying broken files...");
    const brokenFiles = files.filter(file => file.r2Key.startsWith("undefined/"));
    console.log(`Found ${brokenFiles.length} broken files with r2Key starting with 'undefined/'`);
    
    if (brokenFiles.length > 0) {
      console.log("\nBroken files:");
      brokenFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.filename} (r2Key: ${file.r2Key})`);
      });
      
      // Step 3: Clean up broken files
      console.log("\n🗑️  Step 3: Cleaning up broken files...");
      for (const file of brokenFiles) {
        try {
          // Option A: Delete from Convex only (keeps R2 file)
          console.log(`   Removing from Convex: ${file.filename}`);
          await convex.mutation("storyboard:removeFile", { id: file._id });
          console.log(`   ✅ Removed from Convex: ${file.filename}`);
        } catch (error) {
          console.log(`   ❌ Failed to remove ${file.filename}: ${error.message}`);
        }
      }
    }
    
    // Step 4: Check for remaining files
    console.log("\n📊 Step 4: Checking remaining files...");
    const remainingFiles = await convex.query("storyboard:listByCompany", { 
      companyId: COMPANY_ID 
    });
    console.log(`Remaining files in Convex: ${remainingFiles.length}`);
    
    remainingFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.filename} (category: ${file.category}, r2Key: ${file.r2Key})`);
    });
    
    // Step 5: R2 sync check (manual step)
    console.log("\n🔄 Step 5: R2 Sync Check");
    console.log("⚠️  Manual check required:");
    console.log("   1. Check your R2 bucket for files in folder:");
    console.log(`      ${COMPANY_ID}/uploads/`);
    console.log("   2. Compare with the list above");
    console.log("   3. If you find extra files in R2, re-upload them through FileBrowser");
    
    console.log("\n✅ Cleanup completed!");
    console.log("\nNext steps:");
    console.log("1. Refresh your FileBrowser - it should now show correct files");
    console.log("2. Test uploading a new file");
    console.log("3. If you still see missing files, re-upload them through FileBrowser");
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  }
}

// Helper function to run convex commands
function runConvexCommand(command) {
  try {
    const result = execSync(`npx convex ${command}`, { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    return result.trim();
  } catch (error) {
    throw new Error(`Convex command failed: ${error.message}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
