# Wahlu CLI

Manage your social media from the terminal. Works for humans, AI agents, and CI/CD pipelines.

## Install

```bash
npm install -g @wahlu/cli
```

## Authentication

Generate an API key at [wahlu.com](https://wahlu.com) under Settings > API Keys.

```bash
# Option 1: Save to config
wahlu auth login wahlu_live_abc123...

# Option 2: Environment variable
export WAHLU_API_KEY=wahlu_live_abc123...
```

## Quick start

```bash
# List your brands
wahlu brand list

# Set a default brand so you don't need --brand every time
wahlu brand switch <brand-id>

# List posts
wahlu post list

# Create a post
wahlu post create --name "Monday motivation" \
  --instagram '{"description":"Rise and grind","post_type":"grid_post"}'

# Schedule it
wahlu schedule create <post-id> \
  --at 2026-03-15T14:00:00Z \
  --integrations <integration-id>

# Upload media
wahlu media upload ./photo.jpg

# List what's been published
wahlu publication list
```

## Commands

| Command | Description |
|---------|-------------|
| `wahlu auth login <key>` | Save API key |
| `wahlu auth logout` | Remove saved key |
| `wahlu auth status` | Show auth status |
| `wahlu brand list` | List brands |
| `wahlu brand get <id>` | Get brand details |
| `wahlu brand switch <id>` | Set default brand |
| `wahlu post list` | List posts |
| `wahlu post get <id>` | Get post details |
| `wahlu post create` | Create a post |
| `wahlu post update <id>` | Update a post |
| `wahlu post delete <id>` | Delete a post |
| `wahlu schedule list` | List scheduled posts |
| `wahlu schedule create <post-id>` | Schedule a post |
| `wahlu schedule delete <id>` | Unschedule a post |
| `wahlu queue list` | List queues |
| `wahlu queue add <queue-id> <post-id>` | Add post to queue |
| `wahlu media list` | List media files |
| `wahlu media upload <file>` | Upload a file |
| `wahlu media delete <id>` | Delete media |
| `wahlu idea list` | List ideas |
| `wahlu idea create <name>` | Save an idea |
| `wahlu idea delete <id>` | Delete an idea |
| `wahlu label list` | List labels |
| `wahlu label create <name>` | Create a label |
| `wahlu label delete <id>` | Delete a label |
| `wahlu integration list` | List connected platforms |
| `wahlu publication list` | List published posts |

## Global options

| Flag | Description |
|------|-------------|
| `--brand <id>` | Override default brand |
| `--json` | Output as JSON (machine-readable) |
| `--help` | Show help |
| `--version` | Show version |

## Configuration

Config is stored at `~/.config/wahlu/config.json`:

```json
{
  "api_key": "wahlu_live_...",
  "default_brand_id": "abc123"
}
```

Environment variables take priority over config file:

- `WAHLU_API_KEY` — API key
- `WAHLU_API_URL` — API base URL (default: `https://api.wahlu.com`)
- `WAHLU_BRAND_ID` — Default brand ID

## For AI agents

Every command supports `--json` for structured output:

```bash
wahlu post list --json | jq '.[0].id'
wahlu integration list --json
```

## License

MIT
