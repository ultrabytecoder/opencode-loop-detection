import type { Plugin } from "@opencode-ai/plugin"

const WINDOW = 5
const THRESHOLD = 3
const MAX_SESSIONS = 64

export const LoopDetection: Plugin = async ({ client }) => {
  const recent = new Map<string, string[]>()

  const sig = (tool: string, args: unknown) =>
    tool + "::" + JSON.stringify(args)

  return {
    "tool.execute.before": async (input, output) => {
      const key = input.sessionID
      const s = sig(input.tool, input.args)
      const list = recent.get(key) ?? []
      list.push(s)
      if (list.length > WINDOW) list.shift()
      recent.set(key, list)
      if (recent.size > MAX_SESSIONS) {
        recent.delete(recent.keys().next().value!)
      }

      const tail = list.slice(-THRESHOLD)

      // Only signal a loop once we've actually seen THRESHOLD consecutive identical calls.
      if (tail.length === THRESHOLD && tail.every((x) => x === s)) {
        await client.app.log({
          body: {
            service: "loop-detection",
            level: "warn",
            message: `Loop detected: ${input.tool} called ${THRESHOLD}x with identical args`,
          },
        })

        // Return a structured error result instead of throwing an Error.
        // This tells OpenCode to skip the tool execution and pass this message directly to the LLM.
        return {
          error: `Loop detected: "${input.tool}" has been called ${THRESHOLD} times in a row with identical arguments. Try a different approach.`
        }
      }
    },
  }
}