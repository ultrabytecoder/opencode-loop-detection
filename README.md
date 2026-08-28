# opencode-loop-detection

A small [OpenCode](https://opencode.ai) plugin that detects and breaks LLM tool-call loops, useful when running local models (e.g. Qwen via vLLM) that can get stuck repeating the same tool call.

## What it does

The plugin hooks into the `tool.execute.before` event and keeps a sliding window of the last 5 tool calls per session. If the same tool is called 3 times in a row with identical arguments, it:

1. Writes a warning to the app log.
2. Skips the tool execution and returns a structured error message directly to the LLM, telling it to try a different approach.

## Installation

Copy the plugin into your opencode plugins directory:

```bash
mkdir -p ~/.opencode/plugins
cp loop-detection.ts ~/.opencode/plugins/
```

That's it — opencode picks it up automatically.

## Configuration

Make sure the native `doom_loop` permission is set in your opencode configuration:

```json
{
  "permission": {
    "doom_loop": "ask"
  }
}
```

## Tuning

The detection parameters are constants at the top of `loop-detection.ts`:

- `WINDOW = 5` — sliding window size (how many recent tool calls are tracked per session)
- `THRESHOLD = 3` — number of consecutive identical calls that trigger a loop
