import { describe, expect, test, vi } from "vitest";
import { DateTime } from "luxon";

import { AgentMessage, LlmClient, runAgentTurn } from "../agent";

/**
 * A stand-in for the model, answering with the canned completions, in order.
 * Keeps a copy of the messages of each request (the caller keeps adding to the same array).
 */
const createLlm = (completions: Awaited<ReturnType<LlmClient>>[]) => {
  const requests: AgentMessage[][] = [];
  const llm = vi.fn<Parameters<LlmClient>, ReturnType<LlmClient>>(
    async (messages) => {
      requests.push(JSON.parse(JSON.stringify(messages)));
      return completions[requests.length - 1];
    },
  );
  return { llm, requests };
};

const now = DateTime.fromISO("2026-10-01T21:30:00", { zone: "Europe/Rome" });

const toolCall = {
  id: "call_1",
  type: "function" as const,
  function: {
    name: "list_slots",
    arguments: '{"fromDate": "2026-10-05", "toDate": "2026-10-11"}',
  },
};
const callsTool = {
  finishReason: "tool_calls",
  // The API adds fields of its own (reasoning, indexes): they are not sent back
  message: {
    content: "",
    reasoning_content: "Next week is...",
    tool_calls: [{ ...toolCall, index: 0 }],
  },
};
const answers = (content: string) => ({
  finishReason: "stop",
  message: { content },
});

describe("Telegram bot: agent turn", () => {
  test("should run the tools the model asks for and return its answer", async () => {
    const { llm, requests } = createLlm([callsTool, answers("Nessuno slot.")]);
    const executeTool = vi.fn(async () => ({ content: "[]" }));

    const { reply, history } = await runAgentTurn({
      llm,
      history: [],
      userText: "Che slot ci sono la settimana prossima?",
      notes: ["The administrator cancelled the last proposal."],
      now,
      executeTool,
    });

    expect(reply).toEqual("Nessuno slot.");
    expect(executeTool).toHaveBeenCalledWith("list_slots", {
      fromDate: "2026-10-05",
      toDate: "2026-10-11",
    });

    // The model is told the current date (to resolve "next week") and what happened in the meantime
    const userMessage = {
      role: "user",
      content: [
        "[Context: now it's Thursday 2026-10-01, 21:30 (Europe/Rome)]",
        "[The administrator cancelled the last proposal.]",
        "",
        "Che slot ci sono la settimana prossima?",
      ].join("\n"),
    };
    expect(requests[0]).toEqual([userMessage]);
    // The second request carries the tool call and its result
    expect(requests[1]).toEqual([
      userMessage,
      { role: "assistant", content: "", tool_calls: [toolCall] },
      { role: "tool", tool_call_id: "call_1", content: "[]" },
    ]);
    // The whole exchange is kept for the next turn
    expect(history).toEqual([
      ...requests[1],
      { role: "assistant", content: "Nessuno slot." },
    ]);
    expect(llm).toHaveBeenCalledTimes(2);
  });

  test("should report tool errors, and arguments that can't be read, back to the model", async () => {
    const badArguments = {
      ...toolCall,
      id: "call_2",
      function: { name: "list_slots", arguments: '{"fromDate": "2026-1' },
    };
    const { llm, requests } = createLlm([
      {
        finishReason: "tool_calls",
        message: { tool_calls: [toolCall, badArguments] },
      },
      answers("Ops."),
    ]);
    const executeTool = vi.fn(async () => ({
      content: "Invalid period",
      isError: true,
    }));

    await runAgentTurn({ llm, history: [], userText: "...", now, executeTool });

    expect(requests[1].slice(2)).toEqual([
      {
        role: "tool",
        tool_call_id: "call_1",
        content: "ERROR: Invalid period",
      },
      {
        role: "tool",
        tool_call_id: "call_2",
        content: "ERROR: the arguments are not valid JSON",
      },
    ]);
    expect(executeTool).toHaveBeenCalledTimes(1);
  });

  test("should not run the tools, nor keep the turn, if the model gets cut off", async () => {
    const previous: AgentMessage[] = [
      { role: "user", content: "Ciao" },
      { role: "assistant", content: "Ciao!" },
    ];
    const { llm } = createLlm([{ ...callsTool, finishReason: "length" }]);
    const executeTool = vi.fn();

    const { reply, history } = await runAgentTurn({
      llm,
      history: previous,
      userText: "...",
      now,
      executeTool,
    });

    expect(reply).toEqual(null);
    expect(history).toEqual(previous);
    expect(executeTool).not.toHaveBeenCalled();
  });

  test("should give up if the model keeps calling tools", async () => {
    const { llm } = createLlm(Array(20).fill(callsTool));

    const { reply, history } = await runAgentTurn({
      llm,
      history: [],
      userText: "...",
      now,
      executeTool: async () => ({ content: "[]" }),
    });

    expect(reply).toEqual(null);
    expect(history).toEqual([]);
    expect(llm).toHaveBeenCalledTimes(8);
  });
});
