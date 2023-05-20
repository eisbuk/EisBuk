import { getFunctions, httpsCallable } from "@firebase/functions";
import { getApp } from "@firebase/app";

import { CloudFunction } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

export const finalizeBookings = (customerId: string, secretKey: string) =>
  httpsCallable(
    getFunctions(getApp(), "europe-west6"),
    CloudFunction.FinalizeBookings
  )({ organization: getOrganization(), id: customerId, secretKey });
