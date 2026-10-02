import * as functions from "firebase-functions";

import { __functionsZone__ } from "../constants";

import { getBotConfig } from "./config";
import { getPlan, isLinkedAdmin, resolvePlan } from "./botData";
import { getMiniAppUserId } from "./miniAppAuth";
import { MINI_APP_PAGE } from "./miniAppPage";
import { PlanSelection, buildPlanView } from "./slotPlan";
import { TelegramApi } from "./telegramApi";

/** What the page is allowed to load: itself, Telegram's script, and this endpoint */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://telegram.org",
  "style-src 'unsafe-inline'",
  "connect-src 'self'",
].join("; ");

const isStringArray = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((entry) => typeof entry === "string");

/** The selection sent by the page: anything malformed counts as "nothing selected" */
const parseSelection = (x: unknown): PlanSelection => {
  const { creates, updates, deletes } = (x || {}) as Record<string, unknown>;
  return {
    creates:
      Array.isArray(creates) && creates.every(Number.isInteger) ? creates : [],
    updates: isStringArray(updates) ? updates : [],
    deletes: isStringArray(deletes) ? deletes : [],
  };
};

/**
 * The bot's Telegram mini app: a page opened from the buttons under the bot's messages.
 * - `GET` serves the page
 * - `POST` is the page's API: every request carries the launch data signed by Telegram,
 *   which tells who the user is (see `getMiniAppUserId`)
 *
 * Address: `https://<region>-<project>.cloudfunctions.net/telegramMiniApp?organization=<organization>`
 */
export const telegramMiniApp = functions
  .runWith({
    memory: "512MB",
  })
  .region(__functionsZone__)
  .https.onRequest(async (req, res) => {
    if (req.method === "GET") {
      res
        .status(200)
        .set("Content-Type", "text/html; charset=utf-8")
        .set("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        .set("Cache-Control", "no-store")
        .send(MINI_APP_PAGE);
      return;
    }

    const { organization } = req.query;
    const config =
      req.method === "POST" &&
      typeof organization === "string" &&
      /^[^/]+$/.test(organization)
        ? await getBotConfig(organization)
        : null;
    if (!config) {
      res.status(404).json({ error: "not-found" });
      return;
    }

    const { initData, action, planId, selection } = req.body || {};
    const userId = getMiniAppUserId(initData, config.telegramBotToken);
    if (!userId) {
      res.status(401).json({ error: "invalid-session" });
      return;
    }
    if (!(await isLinkedAdmin(config.organization, userId))) {
      res.status(403).json({ error: "not-admin" });
      return;
    }
    if (typeof planId !== "string" || !/^[A-Za-z0-9]+$/.test(planId)) {
      res.status(400).json({ error: "bad-request" });
      return;
    }

    switch (action) {
      case "getPlan": {
        const stored = await getPlan(config.organization, userId, planId);
        res.status(200).json(
          stored
            ? { status: stored.status, view: buildPlanView(stored.plan) }
            : // Not there, or somebody else's: nothing to tell apart for the caller
              { status: "not-found" },
        );
        return;
      }

      case "confirm":
      case "cancel": {
        const status = await resolvePlan({
          config,
          api: new TelegramApi(config),
          telegramUserId: userId,
          planId,
          action,
          ...(action === "confirm"
            ? { selection: parseSelection(selection) }
            : {}),
        });
        if (status === "nothing-selected") {
          res.status(400).json({ error: status });
          return;
        }
        res.status(200).json({ status: status || "not-found" });
        return;
      }

      default:
        res.status(400).json({ error: "bad-request" });
    }
  });
