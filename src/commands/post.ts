import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

function parseJsonOption(optionName: string, value?: string) {
	if (!value) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		throw new Error(`Invalid JSON for --${optionName}`);
	}
}

export const postCommand = new Command("post")
	.description(
		"Create, update, list, and delete content items with canonical copy and platform settings",
	)
	.addHelpText(
		"after",
		`
Content items are the core content unit in Wahlu. This command is a compatibility
alias kept as 'post'. Captions/hashtags are canonical via copy_mode and
single_copy/platform_copy. Platform settings are for media/post options.

Subcommands:
  list              List all content items for the brand
  get <id>          View full content item details including platform settings
  create            Create a new content item with optional platform settings
  update <id>       Update an existing content item (only provided fields change)
  delete <id>       Permanently delete a content item

Typical workflow:
  1. Upload media:       wahlu media upload ./photo.jpg
  2. Create content:     wahlu post create --name "My post" --instagram '...'
  3. Schedule or queue:  wahlu schedule create <content-item-id> --at <datetime> --integrations <id>

Run 'wahlu post create --help' for full platform settings reference.
Full documentation: https://wahlu.com/docs`,
	);

postCommand
	.command("list")
	.description("List content items")
	.option("--page <n>", "Page number (default: 1)", Number.parseInt)
	.option(
		"--limit <n>",
		"Items per page (default: 50, max: 100)",
		Number.parseInt,
	)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns a paginated list of content items for the brand.

Response fields (per content item):
  id                    string       Content item ID
  name                  string|null  Content item name
  brand_id              string       Brand ID
  label_ids             string[]     Attached label IDs
  created_by            string|null  Creator user ID
  thumbnail_timestamp   number       Thumbnail timestamp (seconds)
  copy_mode             string|null  "single" | "per_platform"
  single_copy           object|null  Canonical shared caption + hashtags
  platform_copy         object|null  Canonical per-platform caption map
  instagram_settings    object|null  Instagram configuration
  tiktok_settings       object|null  TikTok configuration
  facebook_settings     object|null  Facebook configuration
  youtube_settings      object|null  YouTube configuration
  linkedin_settings     object|null  LinkedIn configuration
  created_at            string       ISO 8601 timestamp
  updated_at            string       ISO 8601 timestamp

Examples:
  wahlu post list
  wahlu post list --limit 10 --page 2
  wahlu post list --json | jq '.[].name'`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(
			`/brands/${brandId}/content-items`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 40 },
				{
					key: "created_at",
					header: "Created",
					width: 20,
					transform: (v) =>
						v ? new Date(v as string).toLocaleDateString() : "-",
				},
			],
		});
		if (!opts.json && res.pagination?.has_more) {
			console.log(
				`\nPage ${res.pagination.page} — more results available (--page ${res.pagination.page + 1})`,
			);
		}
	});

postCommand
	.command("get")
	.description("Get content item details")
	.argument("<content-item-id>", "Content item ID")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns full details for a single content item including all platform settings.

Examples:
  wahlu post get abc123
  wahlu post get abc123 --json`,
	)
	.action(async function (this: Command, contentItemId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get(
			`/brands/${brandId}/content-items/${contentItemId}`,
		);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("create")
	.description("Create a new content item")
	.option("--name <name>", "Content item name (max 500 chars)")
	.option(
		"--copy-mode <mode>",
		'Canonical copy mode: "single" or "per_platform"',
	)
	.option(
		"--single-copy <json>",
		'Canonical copy JSON (when copy_mode=single): {"caption":"...","hashtags":["..."],"title":"..."}',
	)
	.option(
		"--platform-copy <json>",
		'Per-platform copy JSON (when copy_mode=per_platform): {"instagram":{"caption":"...","hashtags":[]}}',
	)
	.option("--instagram <json>", "Instagram settings as JSON string")
	.option("--tiktok <json>", "TikTok settings as JSON string")
	.option("--facebook <json>", "Facebook settings as JSON string")
	.option("--youtube <json>", "YouTube settings as JSON string")
	.option("--linkedin <json>", "LinkedIn settings as JSON string")
	.option("--labels <ids...>", "Label IDs to attach (max 50)")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Creates a new content item with canonical copy plus optional platform settings.
Captions/hashtags are read from copy_mode + single_copy/platform_copy.
You can target multiple platforms in one content item.

Examples:
  wahlu post create --name "Monday post" \\
    --copy-mode single \\
    --single-copy '{"caption":"Hello!","hashtags":["wahlu"]}' \\
    --instagram '{"post_type":"GRID_POST"}'

  wahlu post create --name "Cross-platform video" \\
    --copy-mode per_platform \\
    --platform-copy '{"tiktok":{"caption":"Check this out","hashtags":["video"]},"instagram":{"caption":"Reel version","hashtags":[]}}' \\
    --tiktok '{"post_type":"VIDEO","media_ids":["mid-123"]}' \\
    --instagram '{"post_type":"REEL","media_ids":["mid-123"]}'

  wahlu post create --name "Article share" \\
    --copy-mode single \\
    --single-copy '{"caption":"Read our latest post","hashtags":[]}' \\
    --linkedin '{"post_type":"LI_ARTICLE","original_url":"https://example.com/post","title":"Our Latest Post"}'

Canonical copy fields:
  copy_mode            "single" | "per_platform"
  single_copy          {"caption": string, "hashtags": string[], "title"?: string}
  platform_copy        {"instagram"?: ContentCopy, "tiktok"?: ContentCopy, "facebook"?: ContentCopy, ...}

Platform settings reference:

  Instagram (--instagram):
    Field                Type      Values / Description
    post_type            string    "GRID_POST" | "REEL" | "STORY"
    media_ids            string[]  Media IDs to attach
    trial_reel           boolean   Post as trial reel (shown to non-followers first)
    graduation_strategy  string    "MANUAL" | "SS_PERFORMANCE" (auto-graduate trial reels)

  TikTok (--tiktok):
    Field                Type      Values / Description
    post_type            string    "VIDEO" | "IMAGE" | "CAROUSEL"
    media_ids            string[]  Media IDs to attach
    privacy_level        string    "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY"
    allow_comment        boolean   Allow comments (default: true)
    allow_duet           boolean   Allow duets (default: true, video only)
    allow_stitch         boolean   Allow stitches (default: true, video only)
    auto_add_music       boolean   Auto-add music (photo/carousel only)
    is_aigc              boolean   Disclose as AI-generated content
    is_commercial_content boolean  Mark as commercial/branded content

  Facebook (--facebook):
    Field                Type      Values / Description
    post_type            string    "FB_POST" | "FB_STORY" | "FB_REEL" | "FB_TEXT"
    media_ids            string[]  Media IDs to attach

  YouTube (--youtube):
    Field                Type      Values / Description
    title                string    Video title
    description          string    Video description
    post_type            string    "YT_SHORT" | "YT_VIDEO"
    media_ids            string[]  Media IDs to attach
    privacy_level        string    "PUBLIC" | "UNLISTED" | "PRIVATE"
    notify_subscribers   boolean   Notify subscribers on publish

  LinkedIn (--linkedin):
    Field                Type      Values / Description
    post_type            string    "LI_TEXT" | "LI_IMAGE" | "LI_VIDEO" | "LI_ARTICLE"
    media_ids            string[]  Media IDs to attach
    visibility           string    "PUBLIC" | "CONNECTIONS"
    title                string    Article title (LI_ARTICLE only)
    original_url         string    Article URL (LI_ARTICLE only)

Full documentation: https://wahlu.com/docs`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.copyMode) body.copy_mode = opts.copyMode;
		if (opts.singleCopy) body.single_copy = parseJsonOption("single-copy", opts.singleCopy);
		if (opts.platformCopy) {
			body.platform_copy = parseJsonOption("platform-copy", opts.platformCopy);
		}
		if (opts.instagram) body.instagram_settings = parseJsonOption("instagram", opts.instagram);
		if (opts.tiktok) body.tiktok_settings = parseJsonOption("tiktok", opts.tiktok);
		if (opts.facebook) body.facebook_settings = parseJsonOption("facebook", opts.facebook);
		if (opts.youtube) body.youtube_settings = parseJsonOption("youtube", opts.youtube);
		if (opts.linkedin) body.linkedin_settings = parseJsonOption("linkedin", opts.linkedin);

		const res = await client.post(`/brands/${brandId}/content-items`, body);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("update")
	.description("Update a content item (only provided fields are changed)")
	.argument("<content-item-id>", "Content item ID")
	.option("--name <name>", "Content item name (max 500 chars)")
	.option(
		"--copy-mode <mode>",
		'Canonical copy mode: "single" or "per_platform"',
	)
	.option("--single-copy <json>", "Canonical single copy JSON")
	.option("--platform-copy <json>", "Canonical per-platform copy JSON")
	.option("--instagram <json>", "Instagram settings as JSON string")
	.option("--tiktok <json>", "TikTok settings as JSON string")
	.option("--facebook <json>", "Facebook settings as JSON string")
	.option("--youtube <json>", "YouTube settings as JSON string")
	.option("--linkedin <json>", "LinkedIn settings as JSON string")
	.option("--labels <ids...>", "Label IDs to attach (max 50)")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Updates an existing content item. Only the fields you provide are changed —
omitted fields remain unchanged.

Examples:
  wahlu post update abc123 --name "New name"
  wahlu post update abc123 --copy-mode single --single-copy '{"caption":"Updated caption","hashtags":[]}'
  wahlu post update abc123 --labels label-1 label-2

See 'wahlu post create --help' for full platform settings reference.
Full documentation: https://wahlu.com/docs`,
	)
	.action(async function (this: Command, contentItemId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.copyMode) body.copy_mode = opts.copyMode;
		if (opts.singleCopy) body.single_copy = parseJsonOption("single-copy", opts.singleCopy);
		if (opts.platformCopy) {
			body.platform_copy = parseJsonOption("platform-copy", opts.platformCopy);
		}
		if (opts.instagram) body.instagram_settings = parseJsonOption("instagram", opts.instagram);
		if (opts.tiktok) body.tiktok_settings = parseJsonOption("tiktok", opts.tiktok);
		if (opts.facebook) body.facebook_settings = parseJsonOption("facebook", opts.facebook);
		if (opts.youtube) body.youtube_settings = parseJsonOption("youtube", opts.youtube);
		if (opts.linkedin) body.linkedin_settings = parseJsonOption("linkedin", opts.linkedin);

		const res = await client.patch(
			`/brands/${brandId}/content-items/${contentItemId}`,
			body,
		);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("delete")
	.description("Permanently delete a content item")
	.argument("<content-item-id>", "Content item ID")
	.addHelpText(
		"after",
		`
Permanently deletes a content item. This cannot be undone.

Examples:
  wahlu post delete abc123`,
	)
	.action(async function (this: Command, contentItemId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/content-items/${contentItemId}`);
		console.log(`Content item ${contentItemId} deleted.`);
	});
