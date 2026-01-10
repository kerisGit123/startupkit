/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAnalytics from "../adminAnalytics.js";
import type * as adminDashboard from "../adminDashboard.js";
import type * as adminLogs from "../adminLogs.js";
import type * as adminNotifications from "../adminNotifications.js";
import type * as adminNotificationsForceFix from "../adminNotificationsForceFix.js";
import type * as adminPurchases from "../adminPurchases.js";
import type * as adminSubscriptions from "../adminSubscriptions.js";
import type * as adminTickets from "../adminTickets.js";
import type * as adminUsers from "../adminUsers.js";
import type * as credits from "../credits.js";
import type * as debugNotifications from "../debugNotifications.js";
import type * as fixNotifications from "../fixNotifications.js";
import type * as forceFixAll from "../forceFixAll.js";
import type * as forceFixNotifications from "../forceFixNotifications.js";
import type * as settings from "../settings.js";
import type * as subscriptions from "../subscriptions.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAnalytics: typeof adminAnalytics;
  adminDashboard: typeof adminDashboard;
  adminLogs: typeof adminLogs;
  adminNotifications: typeof adminNotifications;
  adminNotificationsForceFix: typeof adminNotificationsForceFix;
  adminPurchases: typeof adminPurchases;
  adminSubscriptions: typeof adminSubscriptions;
  adminTickets: typeof adminTickets;
  adminUsers: typeof adminUsers;
  credits: typeof credits;
  debugNotifications: typeof debugNotifications;
  fixNotifications: typeof fixNotifications;
  forceFixAll: typeof forceFixAll;
  forceFixNotifications: typeof forceFixNotifications;
  settings: typeof settings;
  subscriptions: typeof subscriptions;
  tickets: typeof tickets;
  users: typeof users;
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
