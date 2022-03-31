import { getApp } from "@firebase/app";
import { getFunctions, httpsCallable } from "@firebase/functions";

import { getOrganization } from "@/lib/getters";

import { CloudFunction } from "@/enums/functions";

const app = getApp();
const functions = getFunctions(app, "europe-west6");

/**
 * Invokes cloud function
 * @param functionName function to run
 * @returns function that calls firebase with provided functionName param
 */
export const createCloudFunctionCaller =
  (functionName: CloudFunction, payload?: Record<string, any>) =>
  async (): Promise<void> => {
    await httpsCallable(
      functions,
      functionName
    )({ ...payload, organization: getOrganization() });
  };