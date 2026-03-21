# Changelog

All notable changes to Benny will be documented in this file.

## [0.1.0] - 2026-03-20

### Added
- **Core CLI**: `benny` command with 17 subcommands
- **One-shot ask**: `benny ask "question"` — quick AI answers without entering chat mode
- **Multi-model AI**: Support for Tongyi (Qwen), Wenxin (ERNIE), Kimi (Moonshot)
- **Streaming output**: Real-time token-by-token response display
- **MCP Server**: Full Model Context Protocol server with 6 tools (stdio JSON-RPC 2.0)
- **Init wizard**: Interactive `benny init` for API key setup
- **Model comparison**: `benny compare` — parallel 3-model response comparison
- **Chat history**: Persistent `~/.benny/history.json` with `benny chat --session` and `benny history`
- **Code explanation**: `benny explain -f <file>` — Chinese educational code explanations
- **Freemium system**: Free (100k tokens/mo), Pro ($9), Team ($29), Enterprise
- **Usage tracking**: Per-command analytics with cost estimation
- **Git workflow**: `benny git review`, `benny git analyze`, `benny git commit`
- **Chinese code optimization**: Style presets (Aliyun/Baidu/Tencent/General), Chinese comments, variable naming
- **Friendly error UX**: Chinese error messages with error codes (401/403/429/500)
- **Environment doctor**: `benny doctor` — diagnose configuration, API keys, and environment health
- **GitHub Actions CI/CD**: Full pipeline with typecheck, build, pack, release
- **MIT License**
