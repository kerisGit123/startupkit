import { internalMutation } from "../_generated/server";

/**
 * Migration Script: Consolidate Financial Data to financial_ledger
 * 
 * This script migrates data from three legacy tables into the unified financial_ledger:
 * 1. transactions
 * 2. subscription_transactions
 * 3. credits_ledger
 * 
 * Run this migration ONCE after deploying the new schema.
 * 
 * Usage:
 * 1. Deploy the new schema with financial_ledger table
 * 2. Run this migration via Convex dashboard or CLI
 * 3. Verify data in financial_ledger
 * 4. Update application code to use financial_ledger
 * 5. Archive old tables (don't delete immediately)
 */

export const runFullMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting financial ledger migration...");
    
    const startTime = Date.now();
    let totalMigrated = 0;
    const errors: string[] = [];

    // Step 1: Migrate from transactions table
    try {
      console.log("Step 1: Migrating from transactions table...");
      const transactions = await ctx.db.query("transactions").collect();
      
      for (const txn of transactions) {
        try {
          // Check if already migrated
          const existing = await ctx.db
            .query("financial_ledger")
            .filter((q) => q.eq(q.field("legacyTransactionId"), txn._id))
            .first();

          if (existing) {
            console.log(`Skipping transaction ${txn._id} - already migrated`);
            continue;
          }

          // Map transaction type to ledger type
          let ledgerType: "subscription_charge" | "subscription_refund" | "one_time_payment" | "credit_purchase" | "refund" | "chargeback" | "adjustment" = "one_time_payment";
          if (txn.type === "subscription") {
            ledgerType = "subscription_charge";
          } else if (txn.type === "credit") {
            ledgerType = "credit_purchase";
          } else if (txn.type === "refund") {
            ledgerType = "refund";
          }

          // Map source
          let revenueSource: "stripe_subscription" | "stripe_payment" | "manual" | "referral_bonus" | "credit_adjustment" = "manual";
          if (txn.stripeSubscriptionId) {
            revenueSource = "stripe_subscription";
          } else if (txn.stripePaymentIntentId) {
            revenueSource = "stripe_payment";
          } else if (txn.type === "referral") {
            revenueSource = "referral_bonus";
          }

          // Generate ledger ID
          const year = new Date(txn.createdAt).getFullYear();
          const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          const ledgerId = `TXN-${year}-${random}`;

          await ctx.db.insert("financial_ledger", {
            ledgerId,
            amount: txn.amount,
            currency: txn.currency,
            type: ledgerType,
            revenueSource: revenueSource,
            description: txn.reason || `Migrated from transactions: ${txn.type}`,
            userId: txn.userId,
            companyId: txn.companyId,
            invoiceId: txn.invoiceId,
            stripePaymentIntentId: txn.stripePaymentIntentId,
            stripeSubscriptionId: txn.stripeSubscriptionId,
            stripeCustomerId: txn.stripeCustomerId,
            subscriptionPlan: txn.plan,
            tokensAmount: txn.tokens,
            transactionDate: txn.createdAt,
            recordedAt: Date.now(),
            isReconciled: true,
            reconciledAt: Date.now(),
            reconciledBy: "system_migration",
            legacyTransactionId: txn._id,
            createdAt: txn.createdAt,
            updatedAt: Date.now(),
          });

          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating transaction ${txn._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 1 complete: Migrated ${totalMigrated} transactions`);
    } catch (error) {
      console.error("Step 1 failed:", error);
      errors.push(`Step 1 failed: ${error}`);
    }

    // Step 2: Migrate from subscription_transactions table
    try {
      console.log("Step 2: Migrating from subscription_transactions table...");
      const subTransactions = await ctx.db.query("subscription_transactions").collect();
      let subMigrated = 0;
      
      for (const txn of subTransactions) {
        try {
          // Check if already migrated
          const existing = await ctx.db
            .query("financial_ledger")
            .filter((q) => q.eq(q.field("legacySubscriptionTransactionId"), txn._id))
            .first();

          if (existing) {
            console.log(`Skipping subscription transaction ${txn._id} - already migrated`);
            continue;
          }

          // Only migrate if there's an amount (actual financial transaction)
          if (!txn.amount) {
            console.log(`Skipping subscription transaction ${txn._id} - no amount`);
            continue;
          }

          const year = new Date(txn.createdAt).getFullYear();
          const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          const ledgerId = `TXN-${year}-${random}`;

          await ctx.db.insert("financial_ledger", {
            ledgerId,
            amount: txn.amount,
            currency: txn.currency || "USD",
            type: "subscription_charge",
            revenueSource: "stripe_subscription",
            description: `Subscription ${txn.action}: ${txn.plan || "Unknown Plan"}`,
            companyId: txn.companyId,
            stripeSubscriptionId: txn.stripeSubscriptionId,
            stripeCustomerId: txn.stripeCustomerId,
            subscriptionPlan: txn.plan,
            subscriptionPeriodEnd: txn.currentPeriodEnd,
            transactionDate: txn.createdAt,
            recordedAt: Date.now(),
            isReconciled: true,
            reconciledAt: Date.now(),
            reconciledBy: "system_migration",
            legacySubscriptionTransactionId: txn._id,
            createdAt: txn.createdAt,
            updatedAt: Date.now(),
          });

          subMigrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating subscription transaction ${txn._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 2 complete: Migrated ${subMigrated} subscription transactions`);
    } catch (error) {
      console.error("Step 2 failed:", error);
      errors.push(`Step 2 failed: ${error}`);
    }

    // Step 3: Migrate from credits_ledger table
    try {
      console.log("Step 3: Migrating from credits_ledger table...");
      const creditEntries = await ctx.db.query("credits_ledger").collect();
      let creditMigrated = 0;
      
      for (const credit of creditEntries) {
        try {
          // Check if already migrated
          const existing = await ctx.db
            .query("financial_ledger")
            .filter((q) => q.eq(q.field("legacyCreditLedgerId"), credit._id))
            .first();

          if (existing) {
            console.log(`Skipping credit entry ${credit._id} - already migrated`);
            continue;
          }

          const year = new Date(credit.createdAt).getFullYear();
          const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
          const ledgerId = `TXN-${year}-${random}`;

          await ctx.db.insert("financial_ledger", {
            ledgerId,
            amount: credit.amountPaid || 0,
            currency: credit.currency || "USD",
            type: "credit_purchase",
            revenueSource: credit.stripePaymentIntentId ? "stripe_payment" : "manual",
            description: credit.reason || `Credit purchase: ${credit.tokens} tokens`,
            companyId: credit.companyId,
            invoiceId: credit.invoiceId,
            stripePaymentIntentId: credit.stripePaymentIntentId,
            tokensAmount: credit.tokens,
            transactionDate: credit.createdAt,
            recordedAt: Date.now(),
            isReconciled: true,
            reconciledAt: Date.now(),
            reconciledBy: "system_migration",
            legacyCreditLedgerId: credit._id,
            createdAt: credit.createdAt,
            updatedAt: Date.now(),
          });

          creditMigrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating credit entry ${credit._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 3 complete: Migrated ${creditMigrated} credit entries`);
    } catch (error) {
      console.error("Step 3 failed:", error);
      errors.push(`Step 3 failed: ${error}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total records migrated: ${totalMigrated}`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log("\nErrors encountered:");
      errors.forEach((err, idx) => console.log(`${idx + 1}. ${err}`));
    }

    return {
      success: errors.length === 0,
      totalMigrated,
      duration,
      errors,
    };
  },
});

// Verify migration results
export const verifyMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Verifying migration...");

    const ledgerEntries = await ctx.db.query("financial_ledger").collect();
    const transactions = await ctx.db.query("transactions").collect();
    const subTransactions = await ctx.db.query("subscription_transactions").collect();
    const credits = await ctx.db.query("credits_ledger").collect();

    // Count migrated entries
    const migratedFromTransactions = ledgerEntries.filter(e => e.legacyTransactionId).length;
    const migratedFromSubTransactions = ledgerEntries.filter(e => e.legacySubscriptionTransactionId).length;
    const migratedFromCredits = ledgerEntries.filter(e => e.legacyCreditLedgerId).length;

    // Count entries with amounts in subscription_transactions
    const subTransactionsWithAmount = subTransactions.filter(t => t.amount).length;

    console.log("=".repeat(60));
    console.log("MIGRATION VERIFICATION");
    console.log("=".repeat(60));
    console.log(`Financial Ledger Entries: ${ledgerEntries.length}`);
    console.log(`  - From transactions: ${migratedFromTransactions} / ${transactions.length}`);
    console.log(`  - From subscription_transactions: ${migratedFromSubTransactions} / ${subTransactionsWithAmount}`);
    console.log(`  - From credits_ledger: ${migratedFromCredits} / ${credits.length}`);
    console.log("=".repeat(60));

    return {
      ledgerTotal: ledgerEntries.length,
      legacy: {
        transactions: {
          total: transactions.length,
          migrated: migratedFromTransactions,
          missing: transactions.length - migratedFromTransactions,
        },
        subscriptionTransactions: {
          total: subTransactions.length,
          withAmount: subTransactionsWithAmount,
          migrated: migratedFromSubTransactions,
          missing: subTransactionsWithAmount - migratedFromSubTransactions,
        },
        creditsLedger: {
          total: credits.length,
          migrated: migratedFromCredits,
          missing: credits.length - migratedFromCredits,
        },
      },
    };
  },
});
