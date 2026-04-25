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
import type * as crons from "../crons.js";
import type * as debugNotifications from "../debugNotifications.js";
import type * as defaultSettings from "../defaultSettings.js";
import type * as directorChat from "../directorChat.js";
import type * as emailSettings from "../emailSettings.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as emails_defaultCustomTemplates from "../emails/defaultCustomTemplates.js";
import type * as emails_defaultTemplates from "../emails/defaultTemplates.js";
import type * as emails_emailLogs from "../emails/emailLogs.js";
import type * as emails_fixTemplates from "../emails/fixTemplates.js";
import type * as emails_generateAllTemplates from "../emails/generateAllTemplates.js";
import type * as emails_systemEmailLogger from "../emails/systemEmailLogger.js";
import type * as emails_systemTemplates from "../emails/systemTemplates.js";
import type * as emails_templates from "../emails/templates.js";
import type * as emails_testEmail from "../emails/testEmail.js";
import type * as emails_variableMapping from "../emails/variableMapping.js";
import type * as emails_variables from "../emails/variables.js";
import type * as financialLedger from "../financialLedger.js";
import type * as fixNotifications from "../fixNotifications.js";
import type * as forceFixAll from "../forceFixAll.js";
import type * as forceFixNotifications from "../forceFixNotifications.js";
import type * as fraudCheck from "../fraudCheck.js";
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
import type * as landingStats from "../landingStats.js";
import type * as leads from "../leads.js";
import type * as migrateAppointments from "../migrateAppointments.js";
import type * as migrations_addCompanyIdToTables from "../migrations/addCompanyIdToTables.js";
import type * as migrations_cleanStoryboardBucket from "../migrations/cleanStoryboardBucket.js";
import type * as migrations_migrateToContacts from "../migrations/migrateToContacts.js";
import type * as migrations_migrateToFinancialLedger from "../migrations/migrateToFinancialLedger.js";
import type * as migrations_populateCompanyId from "../migrations/populateCompanyId.js";
import type * as migrations_syncTicketsToInbox from "../migrations/syncTicketsToInbox.js";
import type * as organizations from "../organizations.js";
import type * as platformConfig from "../platformConfig.js";
import type * as poConfig from "../poConfig.js";
import type * as promptTemplates from "../promptTemplates.js";
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
import type * as soConfig from "../soConfig.js";
import type * as storyboard_aggregates from "../storyboard/aggregates.js";
import type * as storyboard_build from "../storyboard/build.js";
import type * as storyboard_fileMetadataHandler from "../storyboard/fileMetadataHandler.js";
import type * as storyboard_gallery from "../storyboard/gallery.js";
import type * as storyboard_kieAiConfig from "../storyboard/kieAiConfig.js";
import type * as storyboard_members from "../storyboard/members.js";
import type * as storyboard_moveItems from "../storyboard/moveItems.js";
import type * as storyboard_n8nWebhookCallback from "../storyboard/n8nWebhookCallback.js";
import type * as storyboard_personas from "../storyboard/personas.js";
import type * as storyboard_presets from "../storyboard/presets.js";
import type * as storyboard_pricing from "../storyboard/pricing.js";
import type * as storyboard_projects from "../storyboard/projects.js";
import type * as storyboard_storyboardElements from "../storyboard/storyboardElements.js";
import type * as storyboard_storyboardFiles from "../storyboard/storyboardFiles.js";
import type * as storyboard_storyboardItemElements from "../storyboard/storyboardItemElements.js";
import type * as storyboard_storyboardItems from "../storyboard/storyboardItems.js";
import type * as supportChat from "../supportChat.js";
import type * as supportTools from "../supportTools.js";
import type * as syncUserData from "../syncUserData.js";
import type * as tickets from "../tickets.js";
import type * as transactions_createTransaction from "../transactions/createTransaction.js";
import type * as transactions_queries from "../transactions/queries.js";
import type * as userActivity from "../userActivity.js";
import type * as users from "../users.js";
import type * as users_deleteUser from "../users/deleteUser.js";
import type * as verify_schema from "../verify_schema.js";

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
  crons: typeof crons;
  debugNotifications: typeof debugNotifications;
  defaultSettings: typeof defaultSettings;
  directorChat: typeof directorChat;
  emailSettings: typeof emailSettings;
  emailTemplates: typeof emailTemplates;
  "emails/defaultCustomTemplates": typeof emails_defaultCustomTemplates;
  "emails/defaultTemplates": typeof emails_defaultTemplates;
  "emails/emailLogs": typeof emails_emailLogs;
  "emails/fixTemplates": typeof emails_fixTemplates;
  "emails/generateAllTemplates": typeof emails_generateAllTemplates;
  "emails/systemEmailLogger": typeof emails_systemEmailLogger;
  "emails/systemTemplates": typeof emails_systemTemplates;
  "emails/templates": typeof emails_templates;
  "emails/testEmail": typeof emails_testEmail;
  "emails/variableMapping": typeof emails_variableMapping;
  "emails/variables": typeof emails_variables;
  financialLedger: typeof financialLedger;
  fixNotifications: typeof fixNotifications;
  forceFixAll: typeof forceFixAll;
  forceFixNotifications: typeof forceFixNotifications;
  fraudCheck: typeof fraudCheck;
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
  landingStats: typeof landingStats;
  leads: typeof leads;
  migrateAppointments: typeof migrateAppointments;
  "migrations/addCompanyIdToTables": typeof migrations_addCompanyIdToTables;
  "migrations/cleanStoryboardBucket": typeof migrations_cleanStoryboardBucket;
  "migrations/migrateToContacts": typeof migrations_migrateToContacts;
  "migrations/migrateToFinancialLedger": typeof migrations_migrateToFinancialLedger;
  "migrations/populateCompanyId": typeof migrations_populateCompanyId;
  "migrations/syncTicketsToInbox": typeof migrations_syncTicketsToInbox;
  organizations: typeof organizations;
  platformConfig: typeof platformConfig;
  poConfig: typeof poConfig;
  promptTemplates: typeof promptTemplates;
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
  soConfig: typeof soConfig;
  "storyboard/aggregates": typeof storyboard_aggregates;
  "storyboard/build": typeof storyboard_build;
  "storyboard/fileMetadataHandler": typeof storyboard_fileMetadataHandler;
  "storyboard/gallery": typeof storyboard_gallery;
  "storyboard/kieAiConfig": typeof storyboard_kieAiConfig;
  "storyboard/members": typeof storyboard_members;
  "storyboard/moveItems": typeof storyboard_moveItems;
  "storyboard/n8nWebhookCallback": typeof storyboard_n8nWebhookCallback;
  "storyboard/personas": typeof storyboard_personas;
  "storyboard/presets": typeof storyboard_presets;
  "storyboard/pricing": typeof storyboard_pricing;
  "storyboard/projects": typeof storyboard_projects;
  "storyboard/storyboardElements": typeof storyboard_storyboardElements;
  "storyboard/storyboardFiles": typeof storyboard_storyboardFiles;
  "storyboard/storyboardItemElements": typeof storyboard_storyboardItemElements;
  "storyboard/storyboardItems": typeof storyboard_storyboardItems;
  supportChat: typeof supportChat;
  supportTools: typeof supportTools;
  syncUserData: typeof syncUserData;
  tickets: typeof tickets;
  "transactions/createTransaction": typeof transactions_createTransaction;
  "transactions/queries": typeof transactions_queries;
  userActivity: typeof userActivity;
  users: typeof users;
  "users/deleteUser": typeof users_deleteUser;
  verify_schema: typeof verify_schema;
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

export declare const components: {
  storageByCompany: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  storageByCategory: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
  storageByFileType: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      aggregateBetweenBatch: FunctionReference<
        "query",
        "internal",
        { queries: Array<{ k1?: any; k2?: any; namespace?: any }> },
        Array<{ count: number; sum: number }>
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffsetBatch: FunctionReference<
        "query",
        "internal",
        {
          queries: Array<{
            k1?: any;
            k2?: any;
            namespace?: any;
            offset: number;
          }>;
        },
        Array<{ k: any; s: number; v: any }>
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
      listTreeNodes: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          aggregate?: { count: number; sum: number };
          items: Array<{ k: any; s: number; v: any }>;
          subtrees: Array<string>;
        }>
      >;
      listTrees: FunctionReference<
        "query",
        "internal",
        { take?: number },
        Array<{
          _creationTime: number;
          _id: string;
          maxNodeSize: number;
          namespace?: any;
          root: string;
        }>
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
};
