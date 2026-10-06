# Wahlu CLI

Use Wahlu from your terminal or coding agent. Draft and schedule posts to Instagram, Facebook,
TikTok, YouTube, LinkedIn and X. Read drafts, History, your Link in bio page, Autopilot plans
and alerts. With the right permissions, edit drafts and manage schedules.

## Install

You need Node.js 20 or later.

```bash
npm install --global @wahlu/cli@0.7.0
wahlu --version
```

Use 0.7.0 or later. It adds X, and older versions report an invalid response once the API
names X: `wahlu platforms capabilities` for everyone, and targets, drafts and History for a
brand with an X account. Upgrading fixes it.

Make a Wahlu API key in **Workspace settings > API keys**. Choose the brands and permissions
it needs. Keep the key in your shell's secret environment as `WAHLU_API_KEY`.
Never put it in a shared file or a chat.

```bash
wahlu auth status
wahlu --help
```

Use a brand ID from `auth status` with each brand command. Start with reads, then review any
change before you approve it. Scheduling an approved post needs the Publishing permission.

## Docs and support

- [CLI guide](https://wahlu.com/help/developers/wahlu-cli)
- [API reference](https://wahlu.com/docs)
- [npm package and current README](https://www.npmjs.com/package/@wahlu/cli)
- [Report an issue](https://github.com/wahlu/cli/issues)

The npm package is the current release. The source files in this public repository are an old
version and are not used to build it. Current development takes place in the Wahlu monorepo.
