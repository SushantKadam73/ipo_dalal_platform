/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as bidDetails from "../bidDetails.js";
import type * as bidDetailsFetch from "../bidDetailsFetch.js";
import type * as bidDetailsFetchSME from "../bidDetailsFetchSME.js";
import type * as bidDetailsFetchSME_new from "../bidDetailsFetchSME_new.js";
import type * as bidDetailsTest from "../bidDetailsTest.js";
import type * as crons from "../crons.js";
import type * as debug from "../debug.js";
import type * as http from "../http.js";
import type * as ipos from "../ipos.js";
import type * as nse from "../nse.js";
import type * as router from "../router.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  bidDetails: typeof bidDetails;
  bidDetailsFetch: typeof bidDetailsFetch;
  bidDetailsFetchSME: typeof bidDetailsFetchSME;
  bidDetailsFetchSME_new: typeof bidDetailsFetchSME_new;
  bidDetailsTest: typeof bidDetailsTest;
  crons: typeof crons;
  debug: typeof debug;
  http: typeof http;
  ipos: typeof ipos;
  nse: typeof nse;
  router: typeof router;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
