import { bookingDayInfoSelector, calendarDaySelector } from "./selectors";
import { DateTime, Settings } from "luxon";

import { LocalStore } from "@/types/store";
import { FirestoreData } from "@/types/firestore";

Settings.defaultZoneName = "Europe/Rome";

it("Selects the app date", () => {
  expect(
    calendarDaySelector({
      app: { calendarDay: ("foo" as unknown) as DateTime } as LocalStore["app"],
    })
  ).toEqual("foo");
});

it("Selects the bookings", () => {
  expect(
    bookingDayInfoSelector("2021-01-19")(
      (COMPLEX_STATE as unknown) as LocalStore
    )
  ).toEqual([
    {
      categories: ["preagonismo", "agonismo"],
      time: "10:00",
      type: "off-ice-danza",
      users: [],
      id: "Zj5vUJitCYqn3kMR8LsH",
      durations: [60],
    },
    {
      categories: ["preagonismo"],
      time: "11:00",
      type: "off-ice-gym",
      id: "5hAqGeEqEUr6iyTFYAJS",
      durations: [60],
      users: [
        {
          name: "Rocco",
          surname: "Nocera",
          certificateExpiration: "2021-12-11",
          secret_key: "e4779485-33b4-4f8d-8f03-7761e78b4b67",
          id: "ffd4ca76-1659-4eef-a52f-c40cabb81187",
          duration: 60,
        },
      ],
    },
    {
      time: "16:00",
      categories: ["preagonismo"],
      type: "ice",
      durations: [60, 90, 120],
      id: "dEn4dAy8mTEkzzYGvC9Y",
      absentees: {
        "fec4d032-8d5c-4604-9a32-e9e5058cc081": true,
      },
      users: [
        {
          name: "Porfirio",
          surname: "Manzi",
          certificateExpiration: "2022-01-01",
          secret_key: "2b54debf-6023-45ec-94c5-147084e6d1de",
          id: "fec4d032-8d5c-4604-9a32-e9e5058cc081",
          duration: 60,
        },
        {
          name: "Rocco",
          surname: "Nocera",
          certificateExpiration: "2021-12-11",
          secret_key: "e4779485-33b4-4f8d-8f03-7761e78b4b67",
          id: "ffd4ca76-1659-4eef-a52f-c40cabb81187",
          duration: 120,
        },
        {
          id: "non-existent-user",
          name: "Cancellato",
          secret_key: "Cancellato",
          surname: "Cancellato",
          duration: 60,
        },
      ],
    },
    {
      categories: ["agonismo"],
      time: "16:00",
      type: "ice",
      users: [],
      id: "nnUF6szWatJP5R7byhwH",
      durations: [60, 90, 120],
    },
  ]);
});

it("does not explode when some values are undefined", () => {
  bookingDayInfoSelector("2021-01-19")(({
    firestore: ({
      data: ({
        slotsByDay: {
          "2021-01": {},
        },
      } as unknown) as FirestoreData,
    } as unknown) as LocalStore["firestore"],
  } as unknown) as LocalStore);
});

const COMPLEX_STATE = {
  app: {
    notifications: [],
    calendarDay: DateTime.fromISO("2021-01-19T16:55:59.748+01:00"),
  },
  copyPaste: { day: null, week: null },
  firebase: {
    requesting: {},
    requested: {},
    timestamps: {},
    data: {},
    ordered: {},
    auth: {
      uid: "TfqZY2c6GIJzOtkpbxw5CalEpSrH",
      displayName: null,
      photoURL: null,
      email: "test@eisbuk.it",
      emailVerified: false,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          uid: "test@eisbuk.it",
          displayName: null,
          photoURL: null,
          email: "test@eisbuk.it",
          phoneNumber: null,
          providerId: "password",
        },
      ],
      apiKey: "AIzaSyDfUuakkXb_xV-VFRyH7yIW4Dr7YmypHRo",
      appName: "[DEFAULT]",
      authDomain: null,
      stsTokenManager: {
        apiKey: "AIzaSyDfUuakkXb_xV-VFRyH7yIW4Dr7YmypHRo",
        refreshToken:
          "dUDDcPchBBJZnE-wPLWL4CVNLekCPqk1B1ZZNFMB51Z3KF0P74WuAB6ffNX8P_XCPmOGFkdP1tvVi3Pp2vJsSJODOtBq9zzEjH0MgZBnqWhADY2dux9_onOkWcQNrAneZhqlcYRBR4BCjWSBt-z1K7aTH4t1BScZ8le9RYEICmhKlmrhP8ikMc5BjRuAq-Qu4iwoBveSf6Nv",
        accessToken:
          "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJlbWFpbCI6InRlc3RAZWlzYnVrLml0IiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJhdXRoX3RpbWUiOjE2MTIyNzk2MjIsInVzZXJfaWQiOiJUZnFaWTJjNkdJSnpPdGtwYnh3NUNhbEVwU3JIIiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QGVpc2J1ay5pdCJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn0sImlhdCI6MTYxMjI3OTYyMiwiZXhwIjoxNjEyMjgzMjIyLCJhdWQiOiJlaXNidWsiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZWlzYnVrIiwic3ViIjoiVGZxWlkyYzZHSUp6T3RrcGJ4dzVDYWxFcFNySCJ9.",
        expirationTime: 1612283222855,
      },
      redirectEventId: null,
      lastLoginAt: "1612275993233",
      createdAt: "1612275993233",
      multiFactor: { enrolledFactors: [] },
      isEmpty: false,
      isLoaded: true,
    },
    authError: null,
    profile: { isEmpty: true, isLoaded: false },
    listeners: { byId: {}, allIds: [] },
    isInitializing: false,
    errors: [],
  },
  firestore: {
    status: {
      requesting: { customers: false, slotsByDay: false, bookingsByDay: false },
      requested: { customers: true, slotsByDay: true, bookingsByDay: true },
      timestamps: {
        customers: 1612281360156,
        slotsByDay: 1612281360160,
        bookingsByDay: 1612281360162,
      },
    },
    data: {
      customers: {
        "fec4d032-8d5c-4604-9a32-e9e5058cc081": {
          birthday: "2000-01-01",
          phone: "12345",
          surname: "Manzi",
          name: "Porfirio",
          id: "fec4d032-8d5c-4604-9a32-e9e5058cc081",
          categories: ["ice"],
          email: "porfirio.manzi@example.com",
          secret_key: "2b54debf-6023-45ec-94c5-147084e6d1de",
          certificateExpiration: "2022-01-01",
        },
        "ffd4ca76-1659-4eef-a52f-c40cabb81187": {
          birthday: "2000-01-01",
          phone: "12345",
          surname: "Nocera",
          name: "Rocco",
          id: "ffd4ca76-1659-4eef-a52f-c40cabb81187",
          categories: ["ice"],
          email: "rocco.nocera@example.com",
          secret_key: "e4779485-33b4-4f8d-8f03-7761e78b4b67",
          certificateExpiration: "2021-12-11",
        },
      },
      slotsByDay: {
        "2021-01": {
          id: "2021-01",
          "2021-01-19": {
            nnUF6szWatJP5R7byhwH: {
              date: { seconds: 1611068400, nanoseconds: 0 },
              durations: [60, 90, 120],
              id: "nnUF6szWatJP5R7byhwH",
              categories: ["agonismo"],
              type: "ice",
            },
            "5hAqGeEqEUr6iyTFYAJS": {
              date: { seconds: 1611050400, nanoseconds: 0 },
              durations: [60],
              id: "5hAqGeEqEUr6iyTFYAJS",
              categories: ["preagonismo"],
              type: "off-ice-gym",
            },
            Zj5vUJitCYqn3kMR8LsH: {
              date: { seconds: 1611046800, nanoseconds: 0 },
              durations: [60],
              id: "Zj5vUJitCYqn3kMR8LsH",
              categories: ["preagonismo", "agonismo"],
              type: "off-ice-danza",
            },
            dEn4dAy8mTEkzzYGvC9Y: {
              date: { seconds: 1611068400, nanoseconds: 0 },
              durations: [60, 90, 120],
              id: "dEn4dAy8mTEkzzYGvC9Y",
              categories: ["preagonismo"],
              type: "ice",
              absentees: {
                "fec4d032-8d5c-4604-9a32-e9e5058cc081": true,
              },
            },
          },
        },
      },
      bookingsByDay: {
        "2021-01": {
          dEn4dAy8mTEkzzYGvC9Y: {
            "fec4d032-8d5c-4604-9a32-e9e5058cc081": 60,
            "ffd4ca76-1659-4eef-a52f-c40cabb81187": 120,
            "non-existent-user": 60,
          },
          "5hAqGeEqEUr6iyTFYAJS": {
            "ffd4ca76-1659-4eef-a52f-c40cabb81187": 60,
          },
        },
      },
    },
    ordered: {
      customers: [
        {
          id: "fec4d032-8d5c-4604-9a32-e9e5058cc081",
          birthday: "2000-01-01",
          phone: "12345",
          surname: "Manzi",
          name: "Porfirio",
          categories: ["ice"],
          email: "porfirio.manzi@example.com",
          secret_key: "2b54debf-6023-45ec-94c5-147084e6d1de",
          certificateExpiration: "2022-01-01",
        },
        {
          id: "ffd4ca76-1659-4eef-a52f-c40cabb81187",
          birthday: "2000-01-01",
          phone: "12345",
          surname: "Nocera",
          name: "Rocco",
          categories: ["ice"],
          email: "rocco.nocera@example.com",
          secret_key: "e4779485-33b4-4f8d-8f03-7761e78b4b67",
          certificateExpiration: "2021-12-11",
        },
      ],
      slotsByDay: [
        {
          id: "2021-01",
          "2021-01-19": {
            nnUF6szWatJP5R7byhwH: {
              date: { seconds: 1611068400, nanoseconds: 0 },
              durations: [60, 90, 120],
              id: "nnUF6szWatJP5R7byhwH",
              categories: ["agonismo"],
              type: "ice",
            },
            "5hAqGeEqEUr6iyTFYAJS": {
              date: { seconds: 1611050400, nanoseconds: 0 },
              durations: [60],
              id: "5hAqGeEqEUr6iyTFYAJS",
              categories: ["preagonismo"],
              type: "off-ice-gym",
            },
            Zj5vUJitCYqn3kMR8LsH: {
              date: { seconds: 1611046800, nanoseconds: 0 },
              durations: [60],
              id: "Zj5vUJitCYqn3kMR8LsH",
              categories: ["preagonismo", "agonismo"],
              type: "off-ice-danza",
            },
            dEn4dAy8mTEkzzYGvC9Y: {
              date: { seconds: 1611068400, nanoseconds: 0 },
              durations: [60, 90, 120],
              id: "dEn4dAy8mTEkzzYGvC9Y",
              categories: ["preagonismo"],
              type: "ice",
              absentees: {
                "fec4d032-8d5c-4604-9a32-e9e5058cc081": true,
              },
            },
          },
        },
      ],
      bookingsByDay: [
        {
          id: "2021-01",
          dEn4dAy8mTEkzzYGvC9Y: {
            "fec4d032-8d5c-4604-9a32-e9e5058cc081": 60,
            "ffd4ca76-1659-4eef-a52f-c40cabb81187": 120,
          },
          "5hAqGeEqEUr6iyTFYAJS": {
            "ffd4ca76-1659-4eef-a52f-c40cabb81187": 60,
          },
        },
      ],
    },
    listeners: {
      byId: {
        customers: { name: "customers" },
        slotsByDay: { name: "slotsByDay" },
        bookingsByDay: { name: "bookingsByDay" },
      },
      allIds: ["customers", "slotsByDay", "bookingsByDay"],
    },
    errors: { byQuery: {}, allIds: [] },
    queries: {},
  },
};
