import { Functions, httpsCallable } from "@firebase/functions";

import { CloudFunction } from "@eisbuk/shared/ui";

import { getOrganization } from "@/lib/getters";

export const finalizeBookings = (
  functions: Functions,
  customerId: string,
  secretKey: string
) =>
  httpsCallable(
    functions,
    CloudFunction.FinalizeBookings
  )({ organization: getOrganization(), id: customerId, secretKey });
