import { internalMutation } from "../_generated/server";

/**
 * Migration Script: Consolidate Customer Data to unified contacts table
 * 
 * This script migrates data from four legacy tables into the unified contacts:
 * 1. saas_customers
 * 2. leads
 * 3. clients (booking system)
 * 4. chatbot_conversations (lead capture)
 * 
 * Run this migration ONCE after deploying the schema.
 * 
 * Usage:
 * 1. Deploy the schema with contacts table
 * 2. Run this migration via Convex dashboard or CLI
 * 3. Verify data in contacts
 * 4. Update application code to use contacts
 * 5. Archive old tables (don't delete immediately)
 */

export const runFullMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting contacts migration...");
    
    const startTime = Date.now();
    let totalMigrated = 0;
    const errors: string[] = [];

    // Step 1: Migrate from saas_customers table
    try {
      console.log("Step 1: Migrating from saas_customers table...");
      const saasCustomers = await ctx.db.query("saas_customers").collect();
      let migrated = 0;
      
      for (const customer of saasCustomers) {
        try {
          // Check if already migrated
          const existing = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", customer.customerEmail || ""))
            .first();

          if (existing && existing.legacyCustomerId === customer._id) {
            console.log(`Skipping saas_customer ${customer._id} - already migrated`);
            continue;
          }

          // Skip if no email
          if (!customer.customerEmail) {
            console.log(`Skipping saas_customer ${customer._id} - no email`);
            continue;
          }

          await ctx.db.insert("contacts", {
            name: customer.customerName,
            email: customer.customerEmail,
            phone: customer.customerPhone,
            company: customer.customerName, // Use customer name as company
            type: "customer",
            lifecycleStage: "customer",
            status: "active",
            companyRegistrationNo: customer.companyRegistrationNo,
            taxId: customer.taxId,
            industry: customer.industry,
            website: customer.website,
            address: customer.customerAddress,
            contactPersonName: customer.contactPersonName,
            contactPersonEmail: customer.contactPersonEmail,
            contactPersonPhone: customer.contactPersonPhone,
            tags: [],
            labels: [],
            companyId: customer.companyId,
            legacyCustomerId: customer._id,
            createdAt: customer.createdAt || Date.now(),
            updatedAt: Date.now(),
          });

          migrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating saas_customer ${customer._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 1 complete: Migrated ${migrated} saas_customers`);
    } catch (error) {
      console.error("Step 1 failed:", error);
      errors.push(`Step 1 failed: ${error}`);
    }

    // Step 2: Migrate from leads table
    try {
      console.log("Step 2: Migrating from leads table...");
      const leads = await ctx.db.query("leads").collect();
      let migrated = 0;
      
      for (const lead of leads) {
        try {
          // Check if already migrated
          const existing = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", lead.email))
            .first();

          if (existing && existing.legacyLeadId === lead._id) {
            console.log(`Skipping lead ${lead._id} - already migrated`);
            continue;
          }

          // If contact exists from saas_customers, update it instead
          if (existing && existing.legacyCustomerId) {
            console.log(`Updating existing contact for lead ${lead._id}`);
            await ctx.db.patch(existing._id, {
              legacyLeadId: lead._id,
              leadSource: lead.source,
              notes: existing.notes 
                ? `${existing.notes}\n\nLead message: ${lead.message || ""}` 
                : lead.message,
              updatedAt: Date.now(),
            });
            migrated++;
            totalMigrated++;
            continue;
          }

          // Determine lifecycle stage based on lead status
          let lifecycleStage: "prospect" | "qualified" | "customer" | "at_risk" | "churned" = "prospect";
          if (lead.status === "qualified" || lead.status === "contacted") {
            lifecycleStage = "qualified";
          } else if (lead.status === "converted") {
            lifecycleStage = "customer";
          } else if (lead.status === "lost") {
            lifecycleStage = "churned";
          }

          await ctx.db.insert("contacts", {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            type: lead.status === "converted" ? "customer" : "lead",
            lifecycleStage: lifecycleStage,
            status: lead.status === "lost" ? "inactive" : "active",
            leadSource: lead.source,
            notes: lead.message,
            tags: [],
            labels: [],
            legacyLeadId: lead._id,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt,
          });

          migrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating lead ${lead._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 2 complete: Migrated ${migrated} leads`);
    } catch (error) {
      console.error("Step 2 failed:", error);
      errors.push(`Step 2 failed: ${error}`);
    }

    // Step 3: Migrate from clients table (booking system)
    try {
      console.log("Step 3: Migrating from clients table...");
      const clients = await ctx.db.query("clients").collect();
      let migrated = 0;
      
      for (const client of clients) {
        try {
          // Check if already migrated by email
          const existing = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", client.email))
            .first();

          if (existing) {
            console.log(`Contact exists for client ${client._id} - updating with booking data`);
            // Update existing contact with booking stats
            await ctx.db.patch(existing._id, {
              phone: existing.phone || client.phone,
              company: existing.company || client.company,
              tags: [...new Set([...existing.tags, ...client.tags])],
              notes: existing.notes 
                ? `${existing.notes}\n\nBooking notes: ${client.notes || ""}` 
                : client.notes,
              updatedAt: Date.now(),
            });
            migrated++;
            continue;
          }

          // Create new contact from client
          await ctx.db.insert("contacts", {
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            type: "customer",
            lifecycleStage: "customer",
            status: "active",
            tags: client.tags,
            labels: [],
            notes: client.notes,
            customerSince: client.firstBookedAt,
            lastContactedAt: client.lastBookedAt,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
          });

          migrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating client ${client._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 3 complete: Migrated ${migrated} clients`);
    } catch (error) {
      console.error("Step 3 failed:", error);
      errors.push(`Step 3 failed: ${error}`);
    }

    // Step 4: Migrate from chatbot_conversations (lead capture)
    try {
      console.log("Step 4: Migrating from chatbot_conversations (lead capture)...");
      const conversations = await ctx.db
        .query("chatbot_conversations")
        .withIndex("by_lead_captured", (q) => q.eq("leadCaptured", true))
        .collect();
      let migrated = 0;
      
      for (const conv of conversations) {
        try {
          // Skip if no email
          if (!conv.userEmail) {
            continue;
          }

          // Check if already migrated
          const existing = await ctx.db
            .query("contacts")
            .withIndex("by_email", (q) => q.eq("email", conv.userEmail!))
            .first();

          if (existing) {
            console.log(`Contact exists for chatbot lead ${conv._id} - updating`);
            // Update with chatbot data
            await ctx.db.patch(existing._id, {
              phone: existing.phone || conv.userPhone,
              company: existing.company || conv.userCompany,
              leadSource: existing.leadSource || "chatbot",
              updatedAt: Date.now(),
            });
            migrated++;
            continue;
          }

          // Create new contact from chatbot lead
          await ctx.db.insert("contacts", {
            name: conv.userName || "Chatbot Lead",
            email: conv.userEmail,
            phone: conv.userPhone,
            company: conv.userCompany,
            type: "lead",
            lifecycleStage: "prospect",
            status: "active",
            leadSource: "chatbot",
            tags: [],
            labels: [],
            createdAt: conv.leadCapturedAt || conv.createdAt,
            updatedAt: Date.now(),
          });

          migrated++;
          totalMigrated++;
        } catch (error) {
          const errorMsg = `Error migrating chatbot lead ${conv._id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
      
      console.log(`Step 4 complete: Migrated ${migrated} chatbot leads`);
    } catch (error) {
      console.error("Step 4 failed:", error);
      errors.push(`Step 4 failed: ${error}`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total contacts migrated: ${totalMigrated}`);
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
    console.log("Verifying contacts migration...");

    const contacts = await ctx.db.query("contacts").collect();
    const saasCustomers = await ctx.db.query("saas_customers").collect();
    const leads = await ctx.db.query("leads").collect();
    const clients = await ctx.db.query("clients").collect();
    const chatbotLeads = await ctx.db
      .query("chatbot_conversations")
      .withIndex("by_lead_captured", (q) => q.eq("leadCaptured", true))
      .collect();

    // Count migrated entries
    const migratedFromSaasCustomers = contacts.filter(c => c.legacyCustomerId).length;
    const migratedFromLeads = contacts.filter(c => c.legacyLeadId).length;
    
    // Count by type
    const leadContacts = contacts.filter(c => c.type === "lead").length;
    const customerContacts = contacts.filter(c => c.type === "customer").length;
    const partnerContacts = contacts.filter(c => c.type === "partner").length;

    console.log("=".repeat(60));
    console.log("MIGRATION VERIFICATION");
    console.log("=".repeat(60));
    console.log(`Total Contacts: ${contacts.length}`);
    console.log(`  - Leads: ${leadContacts}`);
    console.log(`  - Customers: ${customerContacts}`);
    console.log(`  - Partners: ${partnerContacts}`);
    console.log("");
    console.log("Migration Sources:");
    console.log(`  - From saas_customers: ${migratedFromSaasCustomers} / ${saasCustomers.length}`);
    console.log(`  - From leads: ${migratedFromLeads} / ${leads.length}`);
    console.log(`  - From clients: ${clients.length} (merged with existing)`);
    console.log(`  - From chatbot: ${chatbotLeads.length} (merged with existing)`);
    console.log("=".repeat(60));

    return {
      totalContacts: contacts.length,
      byType: {
        leads: leadContacts,
        customers: customerContacts,
        partners: partnerContacts,
      },
      legacy: {
        saasCustomers: {
          total: saasCustomers.length,
          migrated: migratedFromSaasCustomers,
        },
        leads: {
          total: leads.length,
          migrated: migratedFromLeads,
        },
        clients: {
          total: clients.length,
        },
        chatbotLeads: {
          total: chatbotLeads.length,
        },
      },
    };
  },
});
