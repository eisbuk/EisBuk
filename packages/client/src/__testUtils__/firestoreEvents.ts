import { v4 as uuid } from "uuid";

/**
 * Utils used to deliver (possibly stale) Firestore events directly to a single background function
 * running in the functions emulator.
 *
 * First generation Firestore triggers are delivered at least once and in no particular order. The emulator
 * delivers each write once, in order, so we use these utils to simulate duplicate and out-of-order delivery:
 * we record the event a write produced and deliver it again later, when the data has moved on.
 */

const projectId = "eisbuk";
const functionsEmulatorOrigin = "http://127.0.0.1:5002";
const region = "europe-west6";

type FirestoreValue = Record<string, any>;

const encodeValue = (value: unknown): FirestoreValue => {
  switch (true) {
    case value === null || value === undefined:
      return { nullValue: null };
    case typeof value === "string":
      return { stringValue: value };
    case typeof value === "boolean":
      return { booleanValue: value };
    case typeof value === "number":
      return Number.isInteger(value)
        ? { integerValue: String(value) }
        : { doubleValue: value };
    case Array.isArray(value):
      return { arrayValue: { values: (value as unknown[]).map(encodeValue) } };
    default:
      return { mapValue: { fields: encodeFields(value as object) } };
  }
};

const encodeFields = (data: object) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, encodeValue(value)])
  );

const getDocumentName = (path: string) =>
  `projects/${projectId}/databases/(default)/documents/${path}`;

const encodeDocument = (path: string, data: object | null) => {
  if (!data) return undefined;
  const time = new Date().toISOString();
  return {
    name: getDocumentName(path),
    fields: encodeFields(data),
    createTime: time,
    updateTime: time,
  };
};

let triggerIds: string[] | undefined;
/**
 * Background functions are registered in the emulator under '<region>-<name>-<generation>'.
 * We get the list of registered ids from the emulator itself (it's included in the 404 response).
 */
const getTriggerId = async (functionName: string) => {
  if (!triggerIds) {
    const res = await fetch(
      `${functionsEmulatorOrigin}/functions/projects/${projectId}/triggers/__list__`,
      { method: "POST", body: "{}" }
    );
    const text = await res.text();
    triggerIds = text.split("valid functions are: ")[1]?.split(", ") || [];
  }
  const prefix = `${region}-${functionName}`;
  const id = triggerIds.find((id) => id === prefix || id === `${prefix}-0`);
  if (!id) {
    throw new Error(
      `Function ${functionName} is not registered in the emulator`
    );
  }
  return id;
};

/**
 * Delivers a document write event to a single background function and resolves when the function has finished.
 *
 * @param functionName name of the exported function (e.g. "countSlotsBookings")
 * @param path path of the document the event is about
 * @param before document data before the write (`null` for create events)
 * @param after document data after the write (`null` for delete events)
 */
export const deliverFirestoreWriteEvent = async (
  functionName: string,
  path: string,
  before: object | null,
  after: object | null
) => {
  const triggerId = await getTriggerId(functionName);

  const event = {
    eventType: "providers/cloud.firestore/eventTypes/document.write",
    resource: { name: getDocumentName(path) },
    eventId: uuid(),
    timestamp: new Date().toISOString(),
    data: {
      oldValue: encodeDocument(path, before) || {},
      value: encodeDocument(path, after) || {},
      updateMask: {},
    },
  };

  const res = await fetch(
    `${functionsEmulatorOrigin}/functions/projects/${projectId}/triggers/${triggerId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }
  );
  // Read the body: the response is complete only once the function has finished
  await res.text();
  if (!res.ok) {
    throw new Error(
      `Delivering event to ${functionName} failed with status ${res.status}`
    );
  }
};
