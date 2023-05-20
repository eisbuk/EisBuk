import { getApp } from "@firebase/app";
import { getFunctions, httpsCallable } from "@firebase/functions";

import { CloudFunction } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

/**
 * Invokes cloud function
 * @param functionName function to run
 * @returns function that calls firebase with provided functionName param
 */
export const createCloudFunctionCaller =
  (functionName: CloudFunction, payload?: Record<string, any>) =>
  async (): Promise<any> => {
    const app = getApp();
    const functions = getFunctions(app, "europe-west6");

    return httpsCallable(
      functions,
      functionName
    )({ ...payload, organization: getOrganization() });
  };
