# Telegram bot (prototype)

An assistant admins can talk to on Telegram, in Italian, to look at the slots calendar and prepare changes to it (create, edit and delete slots, also in bulk).

**The prototype doesn't write to the calendar.** A confirmed proposal is only recorded in the function logs (see `slotWriter.ts`).

## How it works

1. Telegram delivers each update to `telegramWebhook`, which checks the secret header, stores the update in `telegramBot/{organization}/updates` and answers right away.
2. `processTelegramUpdate` (a firestore trigger on that collection) does the work.
3. **Who is writing?** The user shares their phone number with the bot: a button under the bot's message opens the mini app, which asks Telegram for it (`/tastiera` gives Telegram's own "share contact" keyboard instead, for clients that can't open mini apps). Only the sender's own contact is accepted. The number is matched against the organization's `admins`, the same list the web app uses.
4. **With whose privileges?** The bot signs in as the firebase user with that phone number and reads firestore with the user's ID token (`asUser.ts`), so firestore rules apply the same way they do in the web app.
5. **The model lists, the code checks.** The model (GLM 5.3 Flash on Fireworks AI, low reasoning effort) gets two tools: `list_slots` and `propose_slot_changes`. The latter takes the changes one by one: each slot to create, each slot to update, the id of each slot to delete. The code (`slotPlan.ts`) doesn't work out dates or pick slots; it only leaves out what would harm the calendar: slots with bookings are not deleted, booked intervals are not removed, a lesson already in the calendar is not created twice.
6. The admin gets that list, rendered by the code, with "Conferma" / "Annulla" buttons, and a button opening it in the mini app, where single changes can be left out before confirming. Neither way involves the model: the stored plan (or the part of it the admin kept) is what gets applied (for now: logged).

## The mini app

`telegramMiniApp` serves a single page (`miniAppPage.ts`) and its API. The page has no data of its own: every request carries the launch data Telegram signed for the bot (`miniAppAuth.ts`), which tells who the user is. The API only hands out, and resolves, proposals made for that user, and a selection can only take changes away from a proposal.

## Setup

1. Create the bot with [@BotFather](https://t.me/BotFather) and note its token.
2. Add these entries to the organization's secrets document (`secrets/{organization}`):

   | Entry                   | Value                                                                   |
   | ----------------------- | ----------------------------------------------------------------------- |
   | `telegramBotToken`      | the token from BotFather                                                |
   | `telegramWebhookSecret` | a random string (letters, digits, `_`, `-`), shared with Telegram below |
   | `fireworksApiKey`       | Fireworks AI API key (for the language model)                           |
   | `firebaseWebApiKey`     | the project's web API key (the one in the web app's firebase config)    |

3. Let the functions' service account sign custom tokens: grant it the "Service Account Token Creator" role on itself.
4. Register the webhook with Telegram:

   ```bash
   curl "https://api.telegram.org/bot<token>/setWebhook" \
     --data-urlencode "url=https://europe-west6-<project>.cloudfunctions.net/telegramWebhook?organization=<organization>" \
     --data-urlencode "secret_token=<telegramWebhookSecret>" \
     --data-urlencode 'allowed_updates=["message","callback_query"]'
   ```

5. An admin has to be listed by phone number in the organization's `admins` to be recognised. Admins listed by email only are not.

## Tests

- `rushx test` in `packages/functions`: the plan builder, the model loop (with a stubbed client), phone number handling.
- `telegramBot.test.ts` in `packages/client`: the whole flow (the mini app's API included) against the emulators, with a local server standing in for Telegram and for the model's API.
- `TELEGRAM_BOT_LIVE_TEST_KEY=... npx vitest run agent.live` in `packages/functions`: a handful of real requests, in Italian, through the real model against a calendar held in memory (skipped without the key, each run is billed).

## Known limits

- The mini app's page is not covered by an automated test (only that its script parses): it was checked by hand in a browser with Telegram stubbed out.
- The model works out the dates itself. In the live runs it got them right most of the time, but once it dropped one date out of 31 in a three month request. The list the admin confirms shows the weekday of every date, which is where such a slip gets caught.
