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

Authentication priority:
1. `WAHLU_API_KEY` environment variable (highest)
2. Saved key in `~/.config/wahlu/config.json`

## Quick start

```bash
# List your brands
wahlu brand list

# Set a default brand so you don't need --brand every time
wahlu brand switch <brand-id>

# List content items (via post alias)
wahlu post list

# Create a content item
wahlu post create --name "Monday motivation" \
  --instagram '{"description":"Rise and grind","post_type":"grid_post"}'

# Schedule it
wahlu schedule create <content-item-id> \
  --at 2026-03-15T14:00:00Z \
  --integrations <integration-id>

# Upload media
wahlu media upload ./photo.jpg

# List what's been published
wahlu publication list
```

## Commands

### Auth

| Command | Description |
|---------|-------------|
| `wahlu auth login <key>` | Save API key to `~/.config/wahlu/config.json` |
| `wahlu auth logout` | Remove saved API key |
| `wahlu auth status` | Show current auth method, masked key, and config |

### Brands

Brands represent social media profiles. All content items, media, publish runs, and queues belong to a brand.

| Command | Description |
|---------|-------------|
| `wahlu brand list` | List all brands |
| `wahlu brand get <id>` | Get full brand details |
| `wahlu brand switch <id>` | Set default brand for all commands |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Brand ID |
| `name` | string | Brand name |
| `description` | string\|null | Brand description |
| `logo_url` | string\|null | Logo URL |
| `timezone` | string\|null | IANA timezone (e.g. `Australia/Sydney`) |
| `website` | string\|null | Brand website URL |
| `business_category` | string\|null | Business category |
| `brand_kit` | object\|null | Brand kit (fonts, colours, voice) |
| `content_preferences` | object\|null | CTA, logo frequency settings |
| `image_posting` | object\|null | Image posting preferences |
| `video_posting` | object\|null | Video posting preferences |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Content items (`post` command alias)

Content items are the core content unit. The `post` command name is kept as a compatibility alias. Each content item can have platform-specific settings for Instagram, TikTok, Facebook, YouTube, and LinkedIn.

| Command | Description |
|---------|-------------|
| `wahlu post list` | List content items (paginated) |
| `wahlu post get <id>` | Get full content item details |
| `wahlu post create [options]` | Create a new content item |
| `wahlu post update <id> [options]` | Update a content item (partial update) |
| `wahlu post delete <id>` | Permanently delete a content item |

**Create/update options:**

| Option | Description |
|--------|-------------|
| `--name <name>` | Content item name (max 500 chars) |
| `--instagram <json>` | Instagram settings as JSON string |
| `--tiktok <json>` | TikTok settings as JSON string |
| `--facebook <json>` | Facebook settings as JSON string |
| `--youtube <json>` | YouTube settings as JSON string |
| `--linkedin <json>` | LinkedIn settings as JSON string |
| `--labels <ids...>` | Label IDs to attach (max 50) |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Content item ID |
| `name` | string\|null | Content item name |
| `brand_id` | string | Brand ID |
| `label_ids` | string[] | Attached label IDs |
| `created_by` | string\|null | Creator user ID |
| `thumbnail_timestamp` | number | Thumbnail timestamp (seconds) |
| `instagram_settings` | object\|null | Instagram configuration |
| `tiktok_settings` | object\|null | TikTok configuration |
| `facebook_settings` | object\|null | Facebook configuration |
| `youtube_settings` | object\|null | YouTube configuration |
| `linkedin_settings` | object\|null | LinkedIn configuration |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

#### Platform settings reference

**Instagram** (`--instagram`):

| Field | Type | Values |
|-------|------|--------|
| `description` | string | Caption text |
| `post_type` | string | `grid_post` \| `reel` \| `story` |
| `media_ids` | string[] | Media IDs to attach |
| `trial_reel` | boolean | Post as trial reel (non-followers first) |
| `graduation_strategy` | string | `MANUAL` \| `SS_PERFORMANCE` |

**TikTok** (`--tiktok`):

| Field | Type | Values |
|-------|------|--------|
| `description` | string | Caption text |
| `post_type` | string | `video` \| `image` \| `carousel` |
| `media_ids` | string[] | Media IDs to attach |
| `privacy_level` | string | `PUBLIC_TO_EVERYONE` \| `MUTUAL_FOLLOW_FRIENDS` \| `FOLLOWER_OF_CREATOR` \| `SELF_ONLY` |
| `allow_comment` | boolean | Allow comments (default: true) |
| `allow_duet` | boolean | Allow duets (default: true, video only) |
| `allow_stitch` | boolean | Allow stitches (default: true, video only) |
| `auto_add_music` | boolean | Auto-add music (photo/carousel only) |
| `is_aigc` | boolean | Disclose as AI-generated content |
| `is_commercial_content` | boolean | Mark as commercial/branded content |

**Facebook** (`--facebook`):

| Field | Type | Values |
|-------|------|--------|
| `description` | string | Caption text |
| `post_type` | string | `fb_post` \| `fb_story` \| `fb_reel` \| `fb_text` |
| `media_ids` | string[] | Media IDs to attach |

**YouTube** (`--youtube`):

| Field | Type | Values |
|-------|------|--------|
| `title` | string | Video title |
| `description` | string | Video description |
| `post_type` | string | `yt_short` \| `yt_video` |
| `media_ids` | string[] | Media IDs to attach |
| `privacy_level` | string | `public` \| `unlisted` \| `private` |
| `notify_subscribers` | boolean | Notify subscribers on publish |

**LinkedIn** (`--linkedin`):

| Field | Type | Values |
|-------|------|--------|
| `description` | string | Post text |
| `post_type` | string | `li_text` \| `li_image` \| `li_video` \| `li_article` |
| `media_ids` | string[] | Media IDs to attach |
| `visibility` | string | `PUBLIC` \| `CONNECTIONS` |
| `title` | string | Article title (`li_article` only) |
| `original_url` | string | Article URL (`li_article` only) |

**Examples:**

```bash
# Instagram grid post
wahlu post create --name "Photo post" \
  --instagram '{"description":"Hello!","post_type":"grid_post","media_ids":["mid-123"]}'

# Cross-platform video
wahlu post create --name "Video" \
  --tiktok '{"description":"Check this out","post_type":"video","media_ids":["mid-123"]}' \
  --instagram '{"description":"Check this out","post_type":"reel","media_ids":["mid-123"]}'

# LinkedIn article
wahlu post create --name "Article share" \
  --linkedin '{"description":"Read our latest","post_type":"li_article","original_url":"https://example.com","title":"Our Post"}'
```

### Publish runs (`schedule` command alias)

Schedule content items for future publishing to specific integrations. The `schedule` command name is kept as a compatibility alias.

| Command | Description |
|---------|-------------|
| `wahlu schedule list` | List publish runs (paginated) |
| `wahlu schedule create <content-item-id>` | Schedule a content item |
| `wahlu schedule delete <id>` | Remove a publish run (does not delete the content item) |

**Create options:**

| Option | Required | Description |
|--------|----------|-------------|
| `--at <datetime>` | Yes | ISO 8601 datetime (e.g. `2026-03-15T14:00:00Z`) |
| `--integrations <ids...>` | Yes | Integration IDs to publish to (max 20) |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Publish run ID |
| `content_item_id` | string | Referenced content item ID |
| `scheduled_at` | string | ISO 8601 datetime |
| `integration_ids` | string[] | Integration IDs |
| `status` | string | e.g. `ready_for_publishing`, `published`, `failed` |
| `approval_status` | string\|null | Approval status |
| `source` | string\|null | `api` for API-created entries |
| `failure_reason` | string\|null | Failure reason |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

**Example:**

```bash
wahlu schedule create content-abc \
  --at 2026-03-15T14:00:00Z \
  --integrations int-123 int-456
```

### Queues

Queues define recurring time slots for automatic publishing.

| Command | Description |
|---------|-------------|
| `wahlu queue list` | List all queues |
| `wahlu queue add <queue-id> <content-item-id>` | Add a content item to a queue |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Queue ID |
| `name` | string | Queue name |
| `active` | boolean | Whether the queue is active |
| `mode` | string | Queue mode |
| `times_of_day` | string[] | Scheduled times (e.g. `["09:00","17:00"]`) |
| `timezone` | string\|null | IANA timezone |
| `next_run_at` | string\|null | Next scheduled publishing time |
| `loop` | boolean | Whether to loop through posts |
| `content_item_ids` | string[] | Ordered content item IDs in the queue |
| `post_ids` | string[] | Legacy compatibility mirror of queue item IDs |
| `integration_ids` | string[] | Integration IDs |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Media

Upload images and videos to your media library.

| Command | Description |
|---------|-------------|
| `wahlu media list` | List media files (paginated) |
| `wahlu media upload <file>` | Upload a local file |
| `wahlu media delete <id>` | Permanently delete a media file |

**Supported formats:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.mp4`, `.mov`, `.webm`

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Media ID (use in `media_ids` arrays) |
| `file_name` | string | Original filename |
| `content_type` | string | MIME type (e.g. `image/jpeg`) |
| `size` | number | File size in bytes |
| `duration` | number\|null | Duration in seconds (video only) |
| `status` | string | `ready_for_processing` \| `processing` \| `completed` \| `failed` |
| `download_url` | string\|null | Signed download URL |
| `thumbnail_large_url` | string\|null | Large thumbnail |
| `thumbnail_small_url` | string\|null | Small thumbnail |
| `source` | string\|null | `upload` \| `generated` \| `stock` \| `scan` |
| `description` | string\|null | Media description |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

**Upload workflow:**

```bash
# Upload returns a media ID
wahlu media upload ./photo.jpg
# Uploaded photo.jpg — media ID: mid-abc123

# Use the media ID in a content item
wahlu post create --name "Photo post" \
  --instagram '{"description":"Nice!","post_type":"grid_post","media_ids":["mid-abc123"]}'
```

### Ideas

Save content ideas for later development into full content items.

| Command | Description |
|---------|-------------|
| `wahlu idea list` | List ideas (paginated) |
| `wahlu idea create <name>` | Save a new idea |
| `wahlu idea delete <id>` | Delete an idea |

**Create options:**

| Option | Description |
|--------|-------------|
| `--description <text>` | Detailed description (max 10000 chars) |
| `--type <type>` | Idea type (max 50 chars) |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Idea ID |
| `name` | string\|null | Idea name/title |
| `description` | string\|null | Detailed description |
| `type` | string\|null | Idea type |
| `status` | string | Status |
| `labels` | string[] | Text labels |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Labels

Labels categorise and organise content items and media.

| Command | Description |
|---------|-------------|
| `wahlu label list` | List all labels |
| `wahlu label create <name>` | Create a label |
| `wahlu label delete <id>` | Delete a label |

**Create options:**

| Option | Description |
|--------|-------------|
| `--color <hex>` | Colour hex code (e.g. `#ff5500`) |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Label ID |
| `name` | string | Label name |
| `color` | string\|null | Colour hex code |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Integrations (read-only)

Connected social media accounts. You need integration IDs when scheduling content items.

| Command | Description |
|---------|-------------|
| `wahlu integration list` | List connected integrations |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Integration ID (use in `--integrations` when scheduling) |
| `platform` | string | `instagram` \| `tiktok` \| `facebook` \| `youtube` \| `linkedin` |
| `status` | string | Connection status |
| `display_name` | string\|null | Display name on the platform |
| `username` | string\|null | Platform username/handle |
| `avatar_url` | string\|null | Profile avatar URL |
| `permissions` | object\|null | Granted permissions |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

### Publications (read-only)

Records of content items published to social media platforms.

| Command | Description |
|---------|-------------|
| `wahlu publication list` | List published content items (paginated) |

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Publication ID |
| `platform` | string | `instagram` \| `tiktok` \| `facebook` \| `youtube` \| `linkedin` |
| `post_id` | string | Source content item ID (legacy field name) |
| `post_name` | string\|null | Content item name |
| `post_type` | string\|null | Post type |
| `status` | string | `processing` \| `published` \| `failed` |
| `source` | string\|null | `calendar` (from schedule) or `queue` (from queue) |
| `failure_reason` | string\|null | Failure reason |
| `integration_id` | string | Integration used |
| `publish_id` | string\|null | Platform content ID |
| `published_at` | string | When published (ISO 8601) |
| `created_at` | string | ISO 8601 timestamp |
| `updated_at` | string | ISO 8601 timestamp |

## Global options

| Flag | Description |
|------|-------------|
| `--brand <id>` | Use a specific brand (overrides default) |
| `--json` | Output as JSON (available on all list/get/create/update commands) |
| `--help` | Show help for any command |
| `--version` | Show CLI version |

## Pagination

All `list` commands support pagination:

| Flag | Default | Max | Description |
|------|---------|-----|-------------|
| `--page <n>` | 1 | - | Page number |
| `--limit <n>` | 50 | 100 | Items per page |

## Configuration

Config is stored at `~/.config/wahlu/config.json`:

```json
{
  "api_key": "wahlu_live_...",
  "api_url": "https://api.wahlu.com",
  "default_brand_id": "abc123"
}
```

Environment variables take priority over config file:

| Variable | Description |
|----------|-------------|
| `WAHLU_API_KEY` | API key |
| `WAHLU_API_URL` | API base URL (default: `https://api.wahlu.com`) |
| `WAHLU_BRAND_ID` | Default brand ID |

## For AI agents

Every command supports `--json` for structured output:

```bash
# Get content item IDs
wahlu post list --json | jq '.[].id'

# Get integration IDs for scheduling
wahlu integration list --json | jq '.[] | {id, platform, username}'

# Find failed publications
wahlu publication list --json | jq '.[] | select(.status == "failed")'

# Create and capture the ID
CONTENT_ITEM_ID=$(wahlu post create --name "Auto post" --json | jq -r '.id')
wahlu schedule create $CONTENT_ITEM_ID --at 2026-03-15T14:00:00Z --integrations int-123
```

## Documentation

Full documentation: [wahlu.com/docs](https://wahlu.com/docs)

## License

MIT
