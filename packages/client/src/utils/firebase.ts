import { type Functions, httpsCallable } from "@firebase/functions";

import { CloudFunction } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

/**
 * Invokes cloud function
 * @param functionName function to run
 * @returns function that calls firebase with provided functionName param
 */
export const createFunctionCaller =
  (
    functions: Functions,
    functionName: CloudFunction,
    payload?: Record<string, any>
  ) =>
  async (): Promise<any> =>
    httpsCallable(
      functions,
      functionName
    )({ ...payload, organization: getOrganization() });
