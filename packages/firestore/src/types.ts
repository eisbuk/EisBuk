import { firestore } from "firebase-admin";

export interface IOperationSuccess<T> {
  ok: true;
  data: T;
}

export interface IOperationFailure {
  ok: false;
  message: string;
}

export interface IOrgData extends IOrgRootData {
  subCollections: ISubCollections;
}

export interface IOrgRootData {
  id: string;
  data: firestore.DocumentData | undefined;
}

export interface ISubCollections {
  [k: string]: ISubCollectionData;
}

export interface ISubCollectionData {
  [k: string]: firestore.DocumentData;
}

export interface ISubCollectionPath {
  id: string;
  path: string;
}

export enum Errors {
  EMPTY_DOC = "No document exists at the specified reference.",
  EMPTY_COLLECTION = "No documents found in collection.",
}
