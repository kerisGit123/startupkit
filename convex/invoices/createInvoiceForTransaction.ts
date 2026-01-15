import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Create an invoice for a transaction
 * This is called internally after creating a transaction
 */
export const createInvoiceForTransaction = internalMutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, { transactionId }) => {
    console.log("[createInvoiceForTransaction] Starting", { transactionId });
    
    try {
      // 1. Get transaction details
      console.log("[createInvoiceForTransaction] Getting transaction");
      const transaction = await ctx.db.get(transactionId);
      if (!transaction) {
        console.error("[createInvoiceForTransaction] Transaction not found", { transactionId });
        throw new Error("Transaction not found");
      }
      console.log("[createInvoiceForTransaction] Transaction found", { type: transaction.type, amount: transaction.amount });
    
      // 2. Get user/company details for billing
      console.log("[createInvoiceForTransaction] Getting user details");
      const user = transaction.userId 
        ? await ctx.db.get(transaction.userId)
        : null;
      console.log("[createInvoiceForTransaction] User", { userId: transaction.userId, hasUser: !!user });
      
      // 3. Generate invoice number from platform_config
      console.log("[createInvoiceForTransaction] Generating invoice number");
      const { invoiceNumber } = await ctx.runMutation(
        internal.invoiceConfig.getNextInvoiceNumber,
        {}
      );
      const invoiceNo = invoiceNumber;
      console.log("[createInvoiceForTransaction] Invoice number generated", { invoiceNo });
    
    // 4. Determine invoice type
    const invoiceType = transaction.type === "subscription" 
      ? "subscription" 
      : "payment";
    
    // 5. Build invoice items
    const items = [];
    if (transaction.type === "payment" && transaction.tokens) {
      items.push({
        description: `${transaction.tokens} Credits Purchase`,
        quantity: transaction.tokens,
        unitPrice: transaction.amount / transaction.tokens,
        total: transaction.amount,
      });
    } else if (transaction.type === "subscription") {
      const planName = transaction.plan ? 
        (transaction.plan.charAt(0).toUpperCase() + transaction.plan.slice(1)) : "Plan";
      const actionText = transaction.action === "renewed" ? "Renewal" : 
                        transaction.action === "created" ? "Subscription" :
                        transaction.action === "upgraded" ? "Upgrade" : "Payment";
      items.push({
        description: `${planName} - ${actionText}`,
        quantity: 1,
        unitPrice: transaction.amount,
        total: transaction.amount,
      });
    } else if (transaction.type === "credit") {
      items.push({
        description: `Manual Credit: ${transaction.reason || "Admin Credit"}`,
        quantity: transaction.tokens || 0,
        unitPrice: 0,
        total: 0,
      });
    }
    
    // 6. Get company details if available
    let billingName = "Customer";
    let billingEmail = "";
    
    if (user) {
      billingName = user.fullName || user.email || "Customer";
      billingEmail = user.email || "";
    }
    
      // 7. Create invoice
      console.log("[createInvoiceForTransaction] Creating invoice record");
      const invoiceId = await ctx.db.insert("invoices", {
        invoiceNo,
        userId: transaction.userId,
        companyId: transaction.companyId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: "paid",
        invoiceType,
        transactionType: transaction.transactionType,
        transactionId,
        items,
        billingDetails: {
          name: billingName,
          email: billingEmail,
        },
        subtotal: transaction.amount,
        total: transaction.amount,
        stripePaymentIntentId: transaction.stripePaymentIntentId,
        issuedAt: Date.now(),
        paidAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("[createInvoiceForTransaction] Invoice created", { invoiceId, invoiceNo });
      
      console.log("[createInvoiceForTransaction] Success");
      return { invoiceId, invoiceNo };
    } catch (error) {
      console.error("[createInvoiceForTransaction] ERROR", error);
      throw error;
    }
  },
});
