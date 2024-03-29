import functions from "firebase-functions";
import admin from "firebase-admin";

import {
  Collection,
  DeliveryQueue,
  ClientMessagePayload,
  ClientMessageMethod,
  OrganizationData,
  interpolateText,
  ClientMessageType,
} from "@eisbuk/shared";

import { __functionsZone__ } from "../constants";

import { SMSStatusPayload } from "./types";

import { checkIsAdmin, throwUnauth } from "../utils";

import { validateSMSPayload } from "./utils";

/**
 * Sends SMS message using template data from organizations firestore entry and provided params
 */
export const sendSMS = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onCall(
    async (
      payload: ClientMessagePayload<
        ClientMessageMethod.SMS,
        Exclude<ClientMessageType, ClientMessageType.SendCalendarFile>
      >,
      { auth }
    ) => {
      const { organization } = payload;

      if (!(await checkIsAdmin(organization, auth))) throwUnauth();

      // check payload
      const validatedPayload = validateSMSPayload(payload);

      // Get the template and the organization name from organizaion preferences
      const orgDoc = await admin
        .firestore()
        .collection("organizations")
        .doc(payload.organization)
        .get();
      const { smsTemplates, displayName = organization } =
        orgDoc.data() as OrganizationData;

      // Interpolate the email with the payload and the organization name
      const smsTemplate = smsTemplates[payload.type];
      const message = interpolateText(smsTemplate, {
        organizationName: displayName,
        name: validatedPayload.name,
        surname: validatedPayload.surname,
        bookingsLink: validatedPayload.bookingsLink,
        bookingsMonth: validatedPayload.bookingsMonth,
        extendedBookingsDate: validatedPayload.extendedBookingsDate,
      });

      const smsPayload = { to: payload.phone, message };

      // Add SMS to delivery queue, thus starting the delivery process
      const deliveryDoc = admin
        .firestore()
        .collection(
          `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.SMSQueue}`
        )
        .doc();
      await deliveryDoc.set({ payload: smsPayload });

      return {
        sms: smsPayload,
        organization,
        success: true,
        deliveryDocumentPath: deliveryDoc.path,
      };
    }
  );

/**
 * An endpoint handling SMS status updates from GatewayAPI, writes received status to the process document for the appropriate SMS message.
 * Should receive params:
 *  - `id` document id of the SMS process document in firestore
 *  - `organization` name of the organization the SMS belongs to
 */
export const updateSMSStatus = functions
  .region(__functionsZone__)
  .https.onRequest(async (req, res) => {
    functions.logger.log(
      "Received a SMS delivery status update from GatewayAPI, processing..."
    );

    // This id is the id of the firestore document for a process delivery
    // rather than the GatewayAPI assigned SMS id
    const params = (req.params as { id: string; organization: string }) || {};
    const { id, organization } = params;
    if (!id || !organization) {
      functions.logger.log("GatewayAPI request missing query params", {
        params,
      });
      // This is an error on GatewayAPI side
      // Return 'Bad Request' so that the request is retried
      res.writeHead(400);
      res.end();
    }

    const { status } = (req.body as SMSStatusPayload) || {};

    if (!status) {
      functions.logger.log("No status received with GatewayAPI update");
      res.writeHead(400);
      res.end();
    }

    // Store the status in the appropriate process document
    await admin
      .firestore()
      .doc(
        `${Collection.DeliveryQueues}/${organization}/${DeliveryQueue.SMSQueue}/${id}`
      )
      .set(
        { delivery: { meta: { status } } },
        {
          merge: true,
        }
      );

    res.writeHead(200);
    res.end();
  });
