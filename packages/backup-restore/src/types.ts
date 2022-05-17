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

export enum FirestoreErrors {
  EMPTY_DOC = "No document exists at the specified reference.",
  EMPTY_COLLECTION = "No documents found in collection.",
}

export enum FsErrors {
  FILE_NOT_FOUND = "File not found at the specified path.",
  INVALID_FILE = "File does not have valid .json extension type.",
}

export enum ConfigOptions {
  Projects = "projects",
  ActiveProject = "activeProjects",
  UseEmulator = "useEmulator",
  EmulatorHost = "emulatorHost",
}

export interface Config {
  projects: string[];
  activeProject: string | null;
  useEmulators: boolean;
  emulatorHost: string;
}
