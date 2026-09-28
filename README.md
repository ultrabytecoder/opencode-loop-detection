# opencode-loop-detection

A small [OpenCode](https://opencode.ai) plugin that detects and breaks LLM tool-call loops, useful when running local models (e.g. Qwen via vLLM) that can get stuck repeating the same tool call.

This version targets the **OpenCode V2 plugin API** (`@opencode/plugin`). See [V1 support](#v1-support) below for the legacy plugin.

## What it does

The plugin registers an `execute.before` tool hook and keeps a sliding window of the last 5 tool calls per session. If the same tool is called 3 times in a row with identical arguments, it:

1. Writes a warning to the console.
2. Throws from the `execute.before` hook: OpenCode skips the tool execution and returns the error message directly to the LLM, telling it to try a different approach.

## Installation

Copy the plugin into your opencode plugins directory:

```bash
mkdir -p ~/.config/opencode/plugins
cp loop-detection.ts ~/.config/opencode/plugins/
```

That's it — opencode picks it up automatically.

## Configuration

No additional permission rule is needed for this plugin in OpenCode V2.

## V1 support

The OpenCode V1 plugin API (`@opencode-ai/plugin`) is not compatible with this version. On V1, keep the original plugin, which returns `{ error }` from the hook instead of throwing and logs through `client.app.log`.

## Tuning

The detection parameters are constants at the top of `loop-detection.ts`:

- `WINDOW = 5` — sliding window size (how many recent tool calls are tracked per session)
- `THRESHOLD = 3` — number of consecutive identical calls that trigger a loop
