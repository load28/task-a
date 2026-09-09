import type { Message, Part } from "@opencode-ai/sdk/v2"

type MessageWithParts = { info: Message; parts: Part[] }

/** The relay owns the session and records its transport turn boundaries durably.
 * Native compaction/replay messages remain inside that interval regardless of parentID. */
export function requestMessages(messages: MessageWithParts[], messageID: string, endMessageID?: string): MessageWithParts[] {
  // Host-supplied IDs and OpenCode IDs use different clocks; ID order is not chronology.
  const ordered = [...messages].sort((a, b) => (a.info.time?.created ?? 0) - (b.info.time?.created ?? 0))
  const start = ordered.findIndex(m => m.info.id === messageID && m.info.role === "user")
  const end = endMessageID ? ordered.findIndex(m => m.info.id === endMessageID && m.info.role === "user") : ordered.length
  if (start < 0 || end < 0 || end <= start) return []
  return ordered.slice(start + 1, end).filter(({ info }) =>
    info.role === "assistant" && (!info.summary || !!info.error))
}
