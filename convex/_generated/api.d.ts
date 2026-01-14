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
import type * as campaignTemplates from "../campaignTemplates.js";
import type * as chatbot from "../chatbot.js";
import type * as companySettings from "../companySettings.js";
import type * as credits from "../credits.js";
import type * as debugNotifications from "../debugNotifications.js";
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
import type * as emails_variableMapping from "../emails/variableMapping.js";
import type * as emails_variables from "../emails/variables.js";
import type * as fixNotifications from "../fixNotifications.js";
import type * as forceFixAll from "../forceFixAll.js";
import type * as forceFixNotifications from "../forceFixNotifications.js";
import type * as invoices_createInvoiceForTransaction from "../invoices/createInvoiceForTransaction.js";
import type * as invoices_invoiceSystem from "../invoices/invoiceSystem.js";
import type * as invoices_queries from "../invoices/queries.js";
import type * as ipBlocking from "../ipBlocking.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as migrations_addIsActiveToCampaigns from "../migrations/addIsActiveToCampaigns.js";
import type * as migrations_deleteDraftCampaign from "../migrations/deleteDraftCampaign.js";
import type * as platformConfig from "../platformConfig.js";
import type * as referrals from "../referrals.js";
import type * as settings from "../settings.js";
import type * as setup_seedDatabase from "../setup/seedDatabase.js";
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
  campaignTemplates: typeof campaignTemplates;
  chatbot: typeof chatbot;
  companySettings: typeof companySettings;
  credits: typeof credits;
  debugNotifications: typeof debugNotifications;
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
  "emails/variableMapping": typeof emails_variableMapping;
  "emails/variables": typeof emails_variables;
  fixNotifications: typeof fixNotifications;
  forceFixAll: typeof forceFixAll;
  forceFixNotifications: typeof forceFixNotifications;
  "invoices/createInvoiceForTransaction": typeof invoices_createInvoiceForTransaction;
  "invoices/invoiceSystem": typeof invoices_invoiceSystem;
  "invoices/queries": typeof invoices_queries;
  ipBlocking: typeof ipBlocking;
  knowledgeBase: typeof knowledgeBase;
  "migrations/addIsActiveToCampaigns": typeof migrations_addIsActiveToCampaigns;
  "migrations/deleteDraftCampaign": typeof migrations_deleteDraftCampaign;
  platformConfig: typeof platformConfig;
  referrals: typeof referrals;
  settings: typeof settings;
  "setup/seedDatabase": typeof setup_seedDatabase;
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
