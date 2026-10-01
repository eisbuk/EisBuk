import admin from "firebase-admin";

import {
  Collection,
  OrgSubCollection,
  SlotAttendnace,
  SlotInterface,
} from "@eisbuk/shared";

import { BookedIntervals } from "./slotPlan";

/**
 * The bot doesn't touch the organization's data with its own (admin SDK) privileges.
 * A phone number verified by Telegram is treated like a phone sign-in: the bot signs in
 * as the firebase user with that number and talks to firestore with the user's ID token,
 * so that firestore rules decide what can be read and written, the same as in the web app.
 */

/** Thrown when firestore rules deny the request made with the user's token */
export class PermissionDeniedError extends Error {}

// #region sign in
const getUidForPhone = async (phone: string): Promise<string> => {
  const auth = admin.auth();
  const errorCode = (err: unknown) => (err as { code?: string }).code;
  try {
    return (await auth.getUserByPhoneNumber(phone)).uid;
  } catch (err) {
    if (errorCode(err) !== "auth/user-not-found") throw err;
  }
  // Nobody signed in to the web app with this number yet: the user gets created
  // the same way a first phone sign-in would have created it
  try {
    return (await auth.createUser({ phoneNumber: phone })).uid;
  } catch (err) {
    // Created by a concurrent request in the meantime
    if (errorCode(err) !== "auth/phone-number-already-exists") throw err;
    return (await auth.getUserByPhoneNumber(phone)).uid;
  }
};

const getIdToken = async (phone: string, apiKey: string): Promise<string> => {
  const customToken = await admin
    .auth()
    .createCustomToken(await getUidForPhone(phone));

  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const baseUrl = emulatorHost
    ? `http://${emulatorHost}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";

  const res = await fetch(
    `${baseUrl}/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(
      apiKey,
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  const body = (await res.json()) as { idToken?: string };
  if (!res.ok || !body.idToken) {
    throw new Error(`Sign in with custom token failed (${res.status})`);
  }
  return body.idToken;
};
// #endregion sign in

// #region firestore REST
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  timestampValue?: string;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
  /** Full resource name, ending with the document path */
  name: string;
  fields?: Record<string, FirestoreValue>;
}

const decodeFields = (fields: Record<string, FirestoreValue> = {}) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]),
  );

const decodeValue = (value: FirestoreValue): unknown => {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.mapValue) return decodeFields(value.mapValue.fields);
  if (value.arrayValue) return (value.arrayValue.values || []).map(decodeValue);
  return null;
};

const getFirestoreBaseUrl = () => {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  return emulatorHost
    ? `http://${emulatorHost}/v1`
    : "https://firestore.googleapis.com/v1";
};
interface QueriedDocument {
  id: string;
  data: Record<string, unknown>;
}

/**
 * Reads the documents out of a `runQuery` / `batchGet` response: an array with one entry
 * per document, held under `key` (entries without it, e.g. missing documents, are left out).
 */
const readDocuments = async (
  res: Response,
  collectionId: string,
  key: "document" | "found",
): Promise<QueriedDocument[]> => {
  if (res.status === 403) {
    throw new PermissionDeniedError(
      `Reading ${collectionId} was denied by firestore rules`,
    );
  }
  if (!res.ok) {
    throw new Error(`Reading ${collectionId} failed (${res.status})`);
  }

  const results = (await res.json()) as Record<string, FirestoreDocument>[];
  return results
    .map((result) => result[key])
    .filter((doc): doc is FirestoreDocument => Boolean(doc))
    .map((doc) => ({
      id: doc.name.split("/").pop() as string,
      data: decodeFields(doc.fields),
    }));
};

const toSlot = ({ id, data }: QueriedDocument) =>
  ({ ...data, id }) as SlotInterface;

const toBookedIntervals = (docs: QueriedDocument[]): BookedIntervals =>
  docs.reduce((acc, { id, data }) => {
    const { attendances = {} } = data as Partial<SlotAttendnace>;
    const intervals = Object.values(attendances)
      .flatMap(({ bookedInterval, attendedInterval }) => [
        bookedInterval,
        attendedInterval,
      ])
      .filter((interval): interval is string => Boolean(interval));
    return intervals.length ? { ...acc, [id]: [...new Set(intervals)] } : acc;
  }, {} as BookedIntervals);
// #endregion firestore REST

/**
 * Firestore access for one organization, with the privileges of one user.
 */
export class UserSession {
  /** Use `UserSession.signIn` */
  private constructor(
    private idToken: string,
    private organization: string,
  ) {}

  /** Signs in as the firebase user with the given (verified) phone number */
  static async signIn(params: {
    phone: string;
    organization: string;
    firebaseWebApiKey: string;
  }) {
    const idToken = await getIdToken(params.phone, params.firebaseWebApiKey);
    return new UserSession(idToken, params.organization);
  }

  /**
   * Returns all documents of the organization's subcollection with `date` in the range (inclusive)
   */
  private async queryByDate(
    collectionId: OrgSubCollection,
    fromDate: string,
    toDate: string,
  ): Promise<QueriedDocument[]> {
    const projectId = process.env.GCLOUD_PROJECT;
    const parent = [
      `projects/${projectId}/databases/(default)/documents`,
      Collection.Organizations,
      encodeURIComponent(this.organization),
    ].join("/");

    const dateFilter = (op: string, date: string) => ({
      fieldFilter: {
        field: { fieldPath: "date" },
        op,
        value: { stringValue: date },
      },
    });

    const res = await fetch(`${getFirestoreBaseUrl()}/${parent}:runQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.idToken}`,
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: {
            compositeFilter: {
              op: "AND",
              filters: [
                dateFilter("GREATER_THAN_OR_EQUAL", fromDate),
                dateFilter("LESS_THAN_OR_EQUAL", toDate),
              ],
            },
          },
          orderBy: [{ field: { fieldPath: "date" } }],
        },
      }),
    });

    return readDocuments(res, collectionId, "document");
  }

  /**
   * Returns the documents with the given ids from the organization's subcollection
   * (ids with no document are left out)
   */
  private async getByIds(
    collectionId: OrgSubCollection,
    ids: string[],
  ): Promise<QueriedDocument[]> {
    // The ids come from the language model: don't let one reach outside of the collection
    const validIds = ids.filter((id) => /^[^/]+$/.test(id));
    if (!validIds.length) return [];

    const database = `projects/${process.env.GCLOUD_PROJECT}/databases/(default)`;
    const collection = [
      `${database}/documents`,
      Collection.Organizations,
      this.organization,
      collectionId,
    ].join("/");

    const res = await fetch(
      `${getFirestoreBaseUrl()}/${database}/documents:batchGet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.idToken}`,
        },
        body: JSON.stringify({
          documents: validIds.map((id) => `${collection}/${id}`),
        }),
      },
    );
    return readDocuments(res, collectionId, "found");
  }

  /** Returns the slots with date in the range (inclusive) */
  async getSlots(fromDate: string, toDate: string): Promise<SlotInterface[]> {
    const docs = await this.queryByDate(
      OrgSubCollection.Slots,
      fromDate,
      toDate,
    );
    return docs.map(toSlot);
  }

  /** Returns the slots with the given ids (the ones that exist) */
  async getSlotsByIds(ids: string[]): Promise<SlotInterface[]> {
    return (await this.getByIds(OrgSubCollection.Slots, ids)).map(toSlot);
  }

  /**
   * Returns, for each slot in the date range with at least one athlete,
   * the intervals that were booked or attended.
   */
  async getBookedIntervals(
    fromDate: string,
    toDate: string,
  ): Promise<BookedIntervals> {
    return toBookedIntervals(
      await this.queryByDate(OrgSubCollection.Attendance, fromDate, toDate),
    );
  }

  /** Same as `getBookedIntervals`, for the slots with the given ids */
  async getBookedIntervalsByIds(ids: string[]): Promise<BookedIntervals> {
    return toBookedIntervals(
      await this.getByIds(OrgSubCollection.Attendance, ids),
    );
  }
}
