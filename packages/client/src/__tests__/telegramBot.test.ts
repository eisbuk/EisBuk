/**
 * @vitest-environment node
 */

import http from "http";
import { AddressInfo } from "net";
import { v4 as uuid } from "uuid";
import { afterAll, beforeAll, describe, expect } from "vitest";

import { Collection, OrgSubCollection } from "@eisbuk/shared";

import { setUpOrganization } from "@/__testSetup__/node";
import { adminDb, auth } from "@/__testSetup__/firestoreSetup";
import { testWithEmulator } from "@/__testUtils__/envUtils";
import { waitFor } from "@/__testUtils__/helpers";

// #region fakes
type Json = Record<string, any>;

/**
 * A local server standing in for both Telegram's Bot API and the language model's API.
 * Each test uses its own bot token / API key, so that the calls can be told apart.
 */
const telegramCalls: Record<string, { method: string; body: Json }[]> = {};
const modelRequests: Record<string, Json[]> = {};
const modelResponses: Record<string, Json[]> = {};

const fakeServer = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (chunk) => (raw += chunk));
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    const respond = (payload: Json) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    };

    const telegram = /^\/telegram\/bot([^/]+)\/(\w+)/.exec(req.url || "");
    if (telegram) {
      const [, token, method] = telegram;
      (telegramCalls[token] ||= []).push({ method, body });
      return respond({ ok: true, result: {} });
    }

    const apiKey = String(req.headers.authorization).replace("Bearer ", "");
    (modelRequests[apiKey] ||= []).push(body);
    return respond(
      (modelResponses[apiKey] || []).shift() || answer("(no response queued)"),
    );
  });
});
let fakeServerUrl = "";

beforeAll(async () => {
  await new Promise<void>((resolve) =>
    fakeServer.listen(0, "127.0.0.1", resolve),
  );
  fakeServerUrl = `http://127.0.0.1:${(fakeServer.address() as AddressInfo).port}`;
});
afterAll(() => {
  fakeServer.close();
});

/** Responses of the chat completions API: the model calls a tool / gives its answer */
const callTool = (id: string, name: string, input: Json) => ({
  choices: [
    {
      finish_reason: "tool_calls",
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id,
            type: "function",
            function: { name, arguments: JSON.stringify(input) },
          },
        ],
      },
    },
  ],
});
const answer = (content: string) => ({
  choices: [{ finish_reason: "stop", message: { role: "assistant", content } }],
});
// #endregion fakes

// #region setup
const randomInt = () => Math.floor(Math.random() * 1_000_000_000);
const randomPhone = () => `+39333${String(randomInt()).padStart(9, "0")}`;

/**
 * Sets up an organization with the bot configured, and a Telegram user to talk to it.
 */
const setUpBot = async ({ isAdmin = true } = {}) => {
  const phone = randomPhone();
  const { organization } = await setUpOrganization({ setSecrets: false });
  if (isAdmin) {
    await adminDb
      .doc(`${Collection.Organizations}/${organization}`)
      .update({ admins: [phone] });
  }

  const token = `token-${uuid()}`;
  const apiKey = `key-${uuid()}`;
  const webhookSecret = uuid();
  await adminDb.doc(`${Collection.Secrets}/${organization}`).set({
    telegramBotToken: token,
    telegramWebhookSecret: webhookSecret,
    telegramApiBaseUrl: `${fakeServerUrl}/telegram`,
    fireworksApiKey: apiKey,
    llmBaseUrl: `${fakeServerUrl}/llm`,
  });

  const userId = randomInt();
  const chat = { id: userId, type: "private" };
  const from = { id: userId };

  const sendUpdate = (update: Json, secret = webhookSecret) =>
    fetch(
      `http://127.0.0.1:5002/eisbuk/europe-west6/telegramWebhook?organization=${organization}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Bot-Api-Secret-Token": secret,
        },
        body: JSON.stringify({ update_id: randomInt(), ...update }),
      },
    );
  const sendMessage = (message: Json) =>
    sendUpdate({
      message: { message_id: randomInt(), chat, from, ...message },
    });

  /** Messages the bot sent to the chat so far */
  const sentMessages = () =>
    (telegramCalls[token] || [])
      .filter(({ method }) => method === "sendMessage")
      .map(({ body }) => body);

  /** Sends an update and waits for the bot to answer with (at least) the given number of messages */
  const exchange = async (send: () => Promise<Response>, replies = 1) => {
    const before = sentMessages().length;
    expect((await send()).status).toEqual(200);
    await waitFor(
      () =>
        expect(sentMessages().length).toBeGreaterThanOrEqual(before + replies),
      20000,
    );
    return sentMessages().slice(before);
  };

  return {
    organization,
    phone,
    userId,
    chat,
    from,
    botRef: adminDb.doc(`telegramBot/${organization}`),
    sendUpdate,
    sentMessages,
    telegramCalls: () => telegramCalls[token] || [],
    modelRequests: () => modelRequests[apiKey] || [],
    queueModelResponses: (...responses: Json[]) => {
      modelResponses[apiKey] = responses;
    },
    say: (text: string, replies = 1) =>
      exchange(() => sendMessage({ text }), replies),
    shareContact: (contact: Json) => exchange(() => sendMessage({ contact })),
    pressButton: (callbackData: string, messageId: number) =>
      exchange(() =>
        sendUpdate({
          callback_query: {
            id: uuid(),
            from,
            message: { message_id: messageId, chat },
            data: callbackData,
          },
        }),
      ),
    /** Shares the user's own phone number, the way the "share my number" button does */
    link: () =>
      exchange(() =>
        sendMessage({
          // Telegram sends the number without the "+"
          contact: { phone_number: phone.slice(1), user_id: userId },
        }),
      ),
  };
};

const competitiveIce = (date: string) => ({
  date,
  type: "ice",
  categories: ["competitive"],
  intervals: { "10:00-11:00": { startTime: "10:00", endTime: "11:00" } },
});
// #endregion setup

describe("Telegram bot", () => {
  describe("webhook", () => {
    testWithEmulator(
      "should only accept updates carrying the secret agreed with Telegram, for an organization with the bot set up",
      async () => {
        const bot = await setUpBot();

        const forged = await bot.sendUpdate(
          { message: { text: "hi" } },
          "guess",
        );
        expect(forged.status).toEqual(403);

        const { organization: noBot } = await setUpOrganization({
          setSecrets: false,
        });
        const res = await fetch(
          `http://127.0.0.1:5002/eisbuk/europe-west6/telegramWebhook?organization=${noBot}`,
          { method: "POST", body: "{}" },
        );
        expect(res.status).toEqual(404);

        const updates = await bot.botRef.collection("updates").get();
        expect(updates.size).toEqual(0);
      },
    );

    testWithEmulator(
      "should process an update only once, even if Telegram delivers it twice",
      async () => {
        const bot = await setUpBot();
        const update = {
          update_id: randomInt(),
          message: {
            message_id: 1,
            chat: bot.chat,
            from: bot.from,
            text: "/start",
          },
        };

        await bot.sendUpdate(update);
        await bot.sendUpdate(update);

        await waitFor(() => expect(bot.sentMessages().length).toEqual(1));
        // Give a duplicate the time to show up
        await new Promise((resolve) => setTimeout(resolve, 2000));
        expect(bot.sentMessages().length).toEqual(1);

        // The text of the message is not kept after processing
        const stored = await bot.botRef
          .collection("updates")
          .doc(String(update.update_id))
          .get();
        expect(stored.data()).toEqual(
          expect.objectContaining({ status: "done" }),
        );
        expect(stored.data()).not.toHaveProperty("update");
      },
    );
  });

  describe("identification by phone number", () => {
    testWithEmulator(
      "should ask for the phone number, and accept only the sender's own contact",
      async () => {
        const bot = await setUpBot();

        const [askForContact] = await bot.say("Ciao");
        expect(askForContact.reply_markup.keyboard[0][0]).toEqual(
          expect.objectContaining({ request_contact: true }),
        );
        expect(bot.modelRequests()).toEqual([]);

        // A contact card of somebody else (e.g. an admin's, picked from the address book)
        const [refused] = await bot.shareContact({
          phone_number: bot.phone.slice(1),
          user_id: bot.userId + 1,
        });
        expect(refused.text).toMatch(/non quello di un altro contatto/);
        expect((await bot.botRef.collection("users").get()).size).toEqual(0);

        const [welcome] = await bot.link();
        expect(welcome.text).toMatch(/sei tra gli amministratori/);
        const user = await bot.botRef
          .collection("users")
          .doc(String(bot.userId))
          .get();
        expect(user.data()?.phone).toEqual(bot.phone);
      },
    );

    testWithEmulator(
      "should not let non-admins through to the assistant",
      async () => {
        const bot = await setUpBot({ isAdmin: false });

        const [linked] = await bot.link();
        expect(linked.text).toMatch(/non risulta tra gli amministratori/);

        const [reply] = await bot.say("Cancella tutti gli slot di novembre");
        expect(reply.text).toMatch(/non risulta tra gli amministratori/);
        expect(bot.modelRequests()).toEqual([]);
      },
    );
  });

  describe("slot changes", () => {
    testWithEmulator(
      "should read the calendar as the admin, propose changes, and only log them once confirmed",
      async () => {
        const bot = await setUpBot();
        await bot.link();

        // Two Saturday lessons in the calendar, one of them booked by an athlete
        const orgPath = `${Collection.Organizations}/${bot.organization}`;
        const slotsRef = adminDb.collection(
          `${orgPath}/${OrgSubCollection.Slots}`,
        );
        await slotsRef.doc("free").set(competitiveIce("2026-11-07"));
        await slotsRef.doc("booked").set(competitiveIce("2026-11-14"));
        const attendanceRef = adminDb.doc(
          `${orgPath}/${OrgSubCollection.Attendance}/booked`,
        );
        await waitFor(async () =>
          expect((await attendanceRef.get()).exists).toEqual(true),
        );
        await attendanceRef.set(
          {
            attendances: {
              athlete: {
                bookedInterval: "10:00-11:00",
                attendedInterval: null,
              },
            },
          },
          { merge: true },
        );
        // Wait for the data triggers to settle (each slot gets its id written in)
        const getSlots = async () =>
          (await slotsRef.get()).docs.map((doc) => doc.data());
        await waitFor(async () =>
          expect((await getSlots()).map(({ id }) => id)).toEqual([
            "booked",
            "free",
          ]),
        );
        const slotsBefore = await getSlots();

        // The model looks at November, then proposes: no more Saturdays, Tuesdays instead
        const tuesdays = [
          "2026-11-03",
          "2026-11-10",
          "2026-11-17",
          "2026-11-24",
        ];
        bot.queueModelResponses(
          callTool("call_1", "list_slots", {
            fromDate: "2026-11-01",
            toDate: "2026-11-30",
          }),
          callTool("call_2", "propose_slot_changes", {
            create: tuesdays.map((date) => ({
              date,
              type: "ice",
              categories: ["competitive"],
              intervals: [{ startTime: "17:00", endTime: "18:00" }],
            })),
            delete: ["free", "booked"],
          }),
          answer("Ecco la proposta."),
        );

        const request =
          "Togli il sabato a novembre e metti agonismo il martedì dalle 17 alle 18";
        const [reply, preview] = await bot.say(request, 2);

        // The request to the model
        const [first, second, third] = bot.modelRequests();
        expect(first.model).toEqual("accounts/fireworks/models/glm-5p3-flash");
        expect(first.reasoning_effort).toEqual("low");
        expect(first.tools.map((tool: Json) => tool.function.name)).toEqual([
          "list_slots",
          "propose_slot_changes",
        ]);
        expect(first.messages.map(({ role }: Json) => role)).toEqual([
          "system",
          "user",
        ]);
        expect(first.messages[1].content).toMatch(/^\[Context: now it's /);
        expect(first.messages[1].content).toContain(request);

        // list_slots: read from firestore with the admin's own token (through firestore rules)
        const listResult = second.messages[3];
        expect(listResult).toEqual(
          expect.objectContaining({ role: "tool", tool_call_id: "call_1" }),
        );
        expect(JSON.parse(listResult.content)).toEqual([
          {
            id: "free",
            date: "2026-11-07",
            weekday: "Saturday",
            type: "ice",
            categories: ["competitive"],
            intervals: ["10:00-11:00"],
            bookedIntervals: [],
          },
          {
            id: "booked",
            date: "2026-11-14",
            weekday: "Saturday",
            type: "ice",
            categories: ["competitive"],
            intervals: ["10:00-11:00"],
            bookedIntervals: ["10:00-11:00"],
          },
        ]);

        // propose_slot_changes: the model gets the list back with the weekdays, the booked slot is left out
        const proposeResult = third.messages[5];
        expect(proposeResult.tool_call_id).toEqual("call_2");
        expect(JSON.parse(proposeResult.content)).toEqual(
          expect.objectContaining({
            toCreate: tuesdays.map((date) => `Tue ${date} 17:00-18:00`),
            toUpdate: [],
            toDelete: ["Sat 2026-11-07 10:00-11:00"],
            leftOut: ["Sat 2026-11-14 10:00-11:00: has-bookings"],
          }),
        );

        // The admin gets the model's answer, then the exact list of changes with the buttons
        expect(reply.text).toEqual("Ecco la proposta.");
        expect(preview.text).toEqual(
          [
            "Periodo: 03/11/2026 – 24/11/2026",
            "",
            "➕ Nuovi slot: 4",
            "• mar 03/11, 10/11, 17/11, 24/11 — Ghiaccio 17:00-18:00 · agonismo",
            "",
            "🗑 Slot eliminati: 1",
            "• sab 07/11 — Ghiaccio 10:00-11:00 · agonismo",
            "",
            "⚠️ Lasciati come sono: 1",
            "• sab 14/11 — Ghiaccio 10:00-11:00 · agonismo: ha prenotazioni, non si può eliminare",
            "",
            "Confermi?",
          ].join("\n"),
        );
        const [confirmButton, cancelButton] =
          preview.reply_markup.inline_keyboard[0];
        expect(cancelButton.callback_data).toMatch(/^plan:\w+:cancel$/);

        // Confirm
        const [confirmed] = await bot.pressButton(
          confirmButton.callback_data,
          42,
        );
        expect(confirmed.text).toMatch(
          /^Confermato \(4 nuovi, 0 modificati, 1 eliminati\)/,
        );
        expect(confirmed.text).toMatch(/il calendario non è stato toccato/);

        const plans = await bot.botRef
          .collection(`chats/${bot.chat.id}/plans`)
          .get();
        expect(plans.docs.map((doc) => doc.data().status)).toEqual(["logged"]);
        // The buttons are taken off the proposal
        expect(bot.telegramCalls()).toContainEqual({
          method: "editMessageReplyMarkup",
          body: {
            chat_id: bot.chat.id,
            message_id: 42,
            reply_markup: { inline_keyboard: [] },
          },
        });

        // Log only: the calendar is as it was
        expect(await getSlots()).toEqual(slotsBefore);

        // A proposal can't be confirmed twice
        const [stale] = await bot.pressButton(confirmButton.callback_data, 42);
        expect(stale.text).toMatch(/non è più valida/);

        // On the next message the model gets the conversation so far, and is told about the confirmation
        bot.queueModelResponses(answer("Prego!"));
        await bot.say("Grazie");
        const { messages } = bot.modelRequests()[3];
        expect(messages.slice(0, 7)).toEqual([
          ...third.messages,
          { role: "assistant", content: "Ecco la proposta." },
        ]);
        expect(messages[7].content).toContain(
          "[The administrator confirmed the last proposal. Test mode: the changes were recorded, the calendar was not changed.]",
        );
      },
    );

    testWithEmulator(
      "should drop a proposal the admin cancels, or one replaced by a newer proposal",
      async () => {
        const bot = await setUpBot();
        await bot.link();

        const propose = (date: string) => [
          callTool(`call_${uuid()}`, "propose_slot_changes", {
            create: [
              {
                date,
                type: "off-ice",
                categories: ["course-adults"],
                intervals: [{ startTime: "9:00", endTime: "10:00" }],
                capacity: 12,
              },
            ],
          }),
          answer("Pronto."),
        ];
        const getStatuses = async () =>
          (
            await bot.botRef
              .collection(`chats/${bot.chat.id}/plans`)
              .orderBy("createdAt")
              .get()
          ).docs.map((doc) => doc.data().status);

        bot.queueModelResponses(...propose("2026-12-01"));
        const [, first] = await bot.say(
          "Secco per il corso adulti il primo dicembre alle 9",
          2,
        );
        expect(first.text).toContain(
          "• mar 01/12 — Secco 09:00-10:00 · corso adulti · max 12",
        );

        bot.queueModelResponses(...propose("2026-12-02"));
        const [, second] = await bot.say("Anzi, il 2", 2);
        expect(await getStatuses()).toEqual(["superseded", "pending"]);

        // The buttons of the replaced proposal don't work anymore
        const [stale] = await bot.pressButton(
          first.reply_markup.inline_keyboard[0][0].callback_data,
          1,
        );
        expect(stale.text).toMatch(/non è più valida/);

        const [cancelled] = await bot.pressButton(
          second.reply_markup.inline_keyboard[0][1].callback_data,
          2,
        );
        expect(cancelled.text).toMatch(/Annullato/);
        expect(await getStatuses()).toEqual(["superseded", "cancelled"]);
      },
    );

    testWithEmulator(
      "should hand invalid requests back to the model instead of showing them to the admin",
      async () => {
        const bot = await setUpBot();
        await bot.link();

        bot.queueModelResponses(
          callTool("call_1", "propose_slot_changes", {
            create: [
              {
                date: "2026-12-01",
                type: "ice",
                categories: [],
                intervals: [{ startTime: "18:00", endTime: "17:00" }],
              },
            ],
          }),
          // A slot that doesn't exist (the model made the id up)
          callTool("call_2", "propose_slot_changes", {
            delete: ["no-such-slot"],
          }),
          answer("Per quali categorie?"),
        );

        const replies = await bot.say("Metti uno slot il primo dicembre");

        expect(replies.map(({ text }) => text)).toEqual([
          "Per quali categorie?",
        ]);
        const { messages } = bot.modelRequests()[2];
        expect([messages[3], messages[5]]).toEqual([
          {
            role: "tool",
            tool_call_id: "call_1",
            content: [
              "ERROR: Invalid request:",
              "- create[0].categories: at least one category is required",
              "- create[0].intervals[0]: startTime must be before endTime",
            ].join("\n"),
          },
          {
            role: "tool",
            tool_call_id: "call_2",
            content:
              "ERROR: No slot with id: no-such-slot. Use the ids returned by list_slots.",
          },
        ]);
        expect(
          (await bot.botRef.collection(`chats/${bot.chat.id}/plans`).get())
            .size,
        ).toEqual(0);
      },
    );
  });

  describe("acting with the user's privileges", () => {
    testWithEmulator(
      "firestore REST requests made with a user's ID token should be subject to firestore rules",
      async () => {
        // The bot relies on this: it reads the calendar with the admin's token, not as a superuser
        const { organization } = await setUpOrganization({
          doLogin: true,
          setSecrets: false,
        });
        const idToken = await auth.currentUser!.getIdToken();
        const { organization: otherOrganization } = await setUpOrganization({
          doLogin: false,
          setSecrets: false,
        });

        const querySlots = (org: string) =>
          fetch(
            `http://127.0.0.1:8081/v1/projects/eisbuk/databases/(default)/documents/${Collection.Organizations}/${org}:runQuery`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                structuredQuery: {
                  from: [{ collectionId: OrgSubCollection.Slots }],
                },
              }),
            },
          );

        expect((await querySlots(organization)).status).toEqual(200);
        expect((await querySlots(otherOrganization)).status).toEqual(403);
      },
    );

    testWithEmulator(
      "the bot's own data (phone numbers, conversations) should not be readable from the client, not even by admins",
      async () => {
        const { organization } = await setUpOrganization({
          doLogin: true,
          setSecrets: false,
        });
        const idToken = await auth.currentUser!.getIdToken();
        await adminDb
          .doc(`telegramBot/${organization}/users/1`)
          .set({ phone: "+393331234567" });

        const res = await fetch(
          `http://127.0.0.1:8081/v1/projects/eisbuk/databases/(default)/documents/telegramBot/${organization}/users/1`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );

        expect(res.status).toEqual(403);
      },
    );
  });
});
