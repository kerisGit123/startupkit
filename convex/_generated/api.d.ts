/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityDashboard from "../activityDashboard.js";
import type * as admin from "../admin.js";
import type * as adminAnalytics from "../adminAnalytics.js";
import type * as adminDashboard from "../adminDashboard.js";
import type * as adminLogs from "../adminLogs.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as adminNotificationsForceFix from "../adminNotificationsForceFix.js";
import type * as adminPurchases from "../adminPurchases.js";
import type * as adminSubscriptions from "../adminSubscriptions.js";
import type * as adminTickets from "../adminTickets.js";
import type * as adminUserManagement from "../adminUserManagement.js";
import type * as adminUsers from "../adminUsers.js";
import type * as alerts from "../alerts.js";
import type * as analytics from "../analytics.js";
import type * as bookingMutations from "../bookingMutations.js";
import type * as bookingQueries from "../bookingQueries.js";
import type * as bookingTools from "../bookingTools.js";
import type * as bookings from "../bookings.js";
import type * as campaignTemplates from "../campaignTemplates.js";
import type * as chatbot from "../chatbot.js";
import type * as companySettings from "../companySettings.js";
import type * as contacts from "../contacts.js";
import type * as credits from "../credits.js";
import type * as debugNotifications from "../debugNotifications.js";
import type * as defaultSettings from "../defaultSettings.js";
import type * as emailCampaigns from "../emailCampaigns.js";
import type * as emailSettings from "../emailSettings.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emails_analytics from "../emails/analytics.js";
import type * as emails_campaigns from "../emails/campaigns.js";
import type * as emails_defaultCustomTemplates from "../emails/defaultCustomTemplates.js";
import type * as emails_defaultTemplates from "../emails/defaultTemplates.js";
import type * as emails_emailLogs from "../emails/emailLogs.js";
import type * as emails_fixTemplates from "../emails/fixTemplates.js";
import type * as emails_generateAllTemplates from "../emails/generateAllTemplates.js";
import type * as emails_sendEmailWithVariables from "../emails/sendEmailWithVariables.js";
import type * as emails_systemEmailLogger from "../emails/systemEmailLogger.js";
import type * as emails_systemTemplates from "../emails/systemTemplates.js";
import type * as emails_templates from "../emails/templates.js";
import type * as emails_testEmail from "../emails/testEmail.js";
import type * as emails_tracking from "../emails/tracking.js";
import type * as emails_variableMapping from "../emails/variableMapping.js";
import type * as emails_variables from "../emails/variables.js";
import type * as financialLedger from "../financialLedger.js";
import type * as fixNotifications from "../fixNotifications.js";
import type * as forceFixAll from "../forceFixAll.js";
import type * as forceFixNotifications from "../forceFixNotifications.js";
import type * as http from "../http.js";
import type * as httpRoutes from "../httpRoutes.js";
import type * as inbox from "../inbox.js";
import type * as inboxCleanup from "../inboxCleanup.js";
import type * as initializeBookingSystem from "../initializeBookingSystem.js";
import type * as invoiceConfig from "../invoiceConfig.js";
import type * as invoicePOConfig from "../invoicePOConfig.js";
import type * as invoices_createInvoiceForTransaction from "../invoices/createInvoiceForTransaction.js";
import type * as invoices_getInvoiceById from "../invoices/getInvoiceById.js";
import type * as invoices_invoiceSystem from "../invoices/invoiceSystem.js";
import type * as invoices_queries from "../invoices/queries.js";
import type * as invoices_userQueries from "../invoices/userQueries.js";
import type * as ipBlocking from "../ipBlocking.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as leads from "../leads.js";
import type * as migrateAppointments from "../migrateAppointments.js";
import type * as migrations_addIsActiveToCampaigns from "../migrations/addIsActiveToCampaigns.js";
import type * as migrations_deleteDraftCampaign from "../migrations/deleteDraftCampaign.js";
import type * as migrations_migrateToContacts from "../migrations/migrateToContacts.js";
import type * as migrations_migrateToFinancialLedger from "../migrations/migrateToFinancialLedger.js";
import type * as migrations_syncTicketsToInbox from "../migrations/syncTicketsToInbox.js";
import type * as platformConfig from "../platformConfig.js";
import type * as poConfig from "../poConfig.js";
import type * as purchaseOrders_canConvertPO from "../purchaseOrders/canConvertPO.js";
import type * as purchaseOrders_config from "../purchaseOrders/config.js";
import type * as purchaseOrders_convertPOToInvoice from "../purchaseOrders/convertPOToInvoice.js";
import type * as purchaseOrders_createShareLink from "../purchaseOrders/createShareLink.js";
import type * as purchaseOrders_getConversionPreview from "../purchaseOrders/getConversionPreview.js";
import type * as purchaseOrders_mutations from "../purchaseOrders/mutations.js";
import type * as purchaseOrders_queries from "../purchaseOrders/queries.js";
import type * as purchaseOrders_updatePurchaseOrder from "../purchaseOrders/updatePurchaseOrder.js";
import type * as referrals from "../referrals.js";
import type * as reportLogo from "../reportLogo.js";
import type * as saasCustomers_mutations from "../saasCustomers/mutations.js";
import type * as saasCustomers_queries from "../saasCustomers/queries.js";
import type * as seedKnowledgeBase from "../seedKnowledgeBase.js";
import type * as settings from "../settings.js";
import type * as setup_seedDatabase from "../setup/seedDatabase.js";
import type * as smtpConfig from "../smtpConfig.js";
import type * as subscriptions from "../subscriptions.js";
import type * as syncUserData from "../syncUserData.js";
import type * as tickets from "../tickets.js";
import type * as transactions_createTransaction from "../transactions/createTransaction.js";
import type * as transactions_queries from "../transactions/queries.js";
import type * as userActivity from "../userActivity.js";
import type * as users from "../users.js";
import type * as users_deleteUser from "../users/deleteUser.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityDashboard: typeof activityDashboard;
  admin: typeof admin;
  adminAnalytics: typeof adminAnalytics;
  adminDashboard: typeof adminDashboard;
  adminLogs: typeof adminLogs;
  adminNotifications: typeof adminNotifications;
  adminNotificationsForceFix: typeof adminNotificationsForceFix;
  adminPurchases: typeof adminPurchases;
  adminSubscriptions: typeof adminSubscriptions;
  adminTickets: typeof adminTickets;
  adminUserManagement: typeof adminUserManagement;
  adminUsers: typeof adminUsers;
  alerts: typeof alerts;
  analytics: typeof analytics;
  bookingMutations: typeof bookingMutations;
  bookingQueries: typeof bookingQueries;
  bookingTools: typeof bookingTools;
  bookings: typeof bookings;
  campaignTemplates: typeof campaignTemplates;
  chatbot: typeof chatbot;
  companySettings: typeof companySettings;
  contacts: typeof contacts;
  credits: typeof credits;
  debugNotifications: typeof debugNotifications;
  defaultSettings: typeof defaultSettings;
  emailCampaigns: typeof emailCampaigns;
  emailSettings: typeof emailSettings;
  emailTemplates: typeof emailTemplates;
  "emails/analytics": typeof emails_analytics;
  "emails/campaigns": typeof emails_campaigns;
  "emails/defaultCustomTemplates": typeof emails_defaultCustomTemplates;
  "emails/defaultTemplates": typeof emails_defaultTemplates;
  "emails/emailLogs": typeof emails_emailLogs;
  "emails/fixTemplates": typeof emails_fixTemplates;
  "emails/generateAllTemplates": typeof emails_generateAllTemplates;
  "emails/sendEmailWithVariables": typeof emails_sendEmailWithVariables;
  "emails/systemEmailLogger": typeof emails_systemEmailLogger;
  "emails/systemTemplates": typeof emails_systemTemplates;
  "emails/templates": typeof emails_templates;
  "emails/testEmail": typeof emails_testEmail;
  "emails/tracking": typeof emails_tracking;
  "emails/variableMapping": typeof emails_variableMapping;
  "emails/variables": typeof emails_variables;
  financialLedger: typeof financialLedger;
  fixNotifications: typeof fixNotifications;
  forceFixAll: typeof forceFixAll;
  forceFixNotifications: typeof forceFixNotifications;
  http: typeof http;
  httpRoutes: typeof httpRoutes;
  inbox: typeof inbox;
  inboxCleanup: typeof inboxCleanup;
  initializeBookingSystem: typeof initializeBookingSystem;
  invoiceConfig: typeof invoiceConfig;
  invoicePOConfig: typeof invoicePOConfig;
  "invoices/createInvoiceForTransaction": typeof invoices_createInvoiceForTransaction;
  "invoices/getInvoiceById": typeof invoices_getInvoiceById;
  "invoices/invoiceSystem": typeof invoices_invoiceSystem;
  "invoices/queries": typeof invoices_queries;
  "invoices/userQueries": typeof invoices_userQueries;
  ipBlocking: typeof ipBlocking;
  knowledgeBase: typeof knowledgeBase;
  leads: typeof leads;
  migrateAppointments: typeof migrateAppointments;
  "migrations/addIsActiveToCampaigns": typeof migrations_addIsActiveToCampaigns;
  "migrations/deleteDraftCampaign": typeof migrations_deleteDraftCampaign;
  "migrations/migrateToContacts": typeof migrations_migrateToContacts;
  "migrations/migrateToFinancialLedger": typeof migrations_migrateToFinancialLedger;
  "migrations/syncTicketsToInbox": typeof migrations_syncTicketsToInbox;
  platformConfig: typeof platformConfig;
  poConfig: typeof poConfig;
  "purchaseOrders/canConvertPO": typeof purchaseOrders_canConvertPO;
  "purchaseOrders/config": typeof purchaseOrders_config;
  "purchaseOrders/convertPOToInvoice": typeof purchaseOrders_convertPOToInvoice;
  "purchaseOrders/createShareLink": typeof purchaseOrders_createShareLink;
  "purchaseOrders/getConversionPreview": typeof purchaseOrders_getConversionPreview;
  "purchaseOrders/mutations": typeof purchaseOrders_mutations;
  "purchaseOrders/queries": typeof purchaseOrders_queries;
  "purchaseOrders/updatePurchaseOrder": typeof purchaseOrders_updatePurchaseOrder;
  referrals: typeof referrals;
  reportLogo: typeof reportLogo;
  "saasCustomers/mutations": typeof saasCustomers_mutations;
  "saasCustomers/queries": typeof saasCustomers_queries;
  seedKnowledgeBase: typeof seedKnowledgeBase;
  settings: typeof settings;
  "setup/seedDatabase": typeof setup_seedDatabase;
  smtpConfig: typeof smtpConfig;
  subscriptions: typeof subscriptions;
  syncUserData: typeof syncUserData;
  tickets: typeof tickets;
  "transactions/createTransaction": typeof transactions_createTransaction;
  "transactions/queries": typeof transactions_queries;
  userActivity: typeof userActivity;
  users: typeof users;
  "users/deleteUser": typeof users_deleteUser;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
