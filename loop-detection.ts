import { Plugin } from "@opencode/plugin"

// Detects and breaks LLM tool-call loops.
//
// Keeps a sliding window of the most recent tool calls per session. When the
// same tool is called `THRESHOLD` times in a row with identical arguments, the
// `execute.before` hook throws: OpenCode then skips the tool execution and
// passes the message back to the model so it can try a different approach.

const WINDOW = 5
const THRESHOLD = 3
const MAX_SESSIONS = 64

export default Plugin.define({
  id: "loop-detection",
  async setup(ctx) {
    const recent = new Map<string, string[]>()

    const signature = (tool: string, args: unknown) => {
      try {
        return tool + "::" + JSON.stringify(args ?? null)
      } catch {
        return tool + "::<unserializable>"
      }
    }

    await ctx.tool.hook("execute.before", (event) => {
      const key = String(event.sessionID)
      const current = signature(event.tool, event.input)

      const list = recent.get(key) ?? []
      list.push(current)
      if (list.length > WINDOW) list.shift()
      recent.set(key, list)

      // Bounded cleanup so the map cannot grow without limit.
      if (recent.size > MAX_SESSIONS) {
        const oldest = recent.keys().next().value
        if (oldest !== undefined) recent.delete(oldest)
      }

      const tail = list.slice(-THRESHOLD)

      // Only signal a loop once we've actually seen THRESHOLD consecutive identical calls.
      if (tail.length === THRESHOLD && tail.every((entry) => entry === current)) {
        console.warn(
          `[loop-detection] Loop detected: ${event.tool} called ${THRESHOLD}x with identical args`,
        )
        throw new Error(
          `Loop detected: "${event.tool}" has been called ${THRESHOLD} times in a row with identical arguments. Try a different approach.`,
        )
      }
    })
  },
})
