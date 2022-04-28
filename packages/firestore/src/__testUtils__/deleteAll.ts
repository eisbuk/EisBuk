import { adminDb } from "src/__testSetup__/adminDb";

export const deleteAll = async (): Promise<any> => {
    const collections = await adminDb.listCollections();
    return Promise.all(collections.map((ref) => adminDb.recursiveDelete(ref)));
};