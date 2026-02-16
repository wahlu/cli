import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const postCommand = new Command("post")
	.description("Create, update, list, and delete posts with per-platform settings")
	.addHelpText(
		"after",
		`
Posts are the core content unit in Wahlu. Each post can have platform-specific
settings for Instagram, TikTok, Facebook, YouTube, and LinkedIn.

Subcommands:
  list              List all posts for the brand
  get <id>          View full post details including platform settings
  create            Create a new post with optional platform settings
  update <id>       Update an existing post (only provided fields change)
  delete <id>       Permanently delete a post

Typical workflow:
  1. Upload media:       wahlu media upload ./photo.jpg
  2. Create a post:      wahlu post create --name "My post" --instagram '...'
  3. Schedule or queue:  wahlu schedule create <post-id> --at <datetime> --integrations <id>

Run 'wahlu post create --help' for full platform settings reference.
Full documentation: https://wahlu.com/docs`,
	);

postCommand
	.command("list")
	.description("List posts")
	.option("--page <n>", "Page number (default: 1)", parseInt)
	.option("--limit <n>", "Items per page (default: 50, max: 100)", parseInt)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns a paginated list of posts for the brand.

Response fields (per post):
  id                    string       Post ID
  name                  string|null  Post name
  brand_id              string       Brand ID
  label_ids             string[]     Attached label IDs
  created_by            string|null  Creator user ID
  thumbnail_timestamp   number       Thumbnail timestamp (seconds)
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
			`/brands/${brandId}/posts`,
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
	.description("Get post details")
	.argument("<post-id>", "Post ID")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns full details for a single post including all platform settings.

Examples:
  wahlu post get abc123
  wahlu post get abc123 --json`,
	)
	.action(async function (this: Command, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get(`/brands/${brandId}/posts/${postId}`);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("create")
	.description("Create a new post")
	.option("--name <name>", "Post name (max 500 chars)")
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
Creates a new post with optional platform-specific settings. You can target
multiple platforms in a single post by providing multiple --<platform> flags.

Examples:
  wahlu post create --name "Monday post" \\
    --instagram '{"description":"Hello!","post_type":"grid_post"}'

  wahlu post create --name "Cross-platform video" \\
    --tiktok '{"description":"Check this out","post_type":"video","media_ids":["mid-123"]}' \\
    --instagram '{"description":"Check this out","post_type":"reel","media_ids":["mid-123"]}'

  wahlu post create --name "Article share" \\
    --linkedin '{"description":"Read our latest post","post_type":"li_article","original_url":"https://example.com/post","title":"Our Latest Post"}'

Platform settings reference:

  Instagram (--instagram):
    Field                Type      Values / Description
    description          string    Caption text
    post_type            string    "grid_post" | "reel" | "story"
    media_ids            string[]  Media IDs to attach
    trial_reel           boolean   Post as trial reel (shown to non-followers first)
    graduation_strategy  string    "MANUAL" | "SS_PERFORMANCE" (auto-graduate trial reels)

  TikTok (--tiktok):
    Field                Type      Values / Description
    description          string    Caption text
    post_type            string    "video" | "image" | "carousel"
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
    description          string    Caption text
    post_type            string    "fb_post" | "fb_story" | "fb_reel" | "fb_text"
    media_ids            string[]  Media IDs to attach

  YouTube (--youtube):
    Field                Type      Values / Description
    title                string    Video title
    description          string    Video description
    post_type            string    "yt_short" | "yt_video"
    media_ids            string[]  Media IDs to attach
    privacy_level        string    "public" | "unlisted" | "private"
    notify_subscribers   boolean   Notify subscribers on publish

  LinkedIn (--linkedin):
    Field                Type      Values / Description
    description          string    Post text
    post_type            string    "li_text" | "li_image" | "li_video" | "li_article"
    media_ids            string[]  Media IDs to attach
    visibility           string    "PUBLIC" | "CONNECTIONS"
    title                string    Article title (li_article only)
    original_url         string    Article URL (li_article only)

Full documentation: https://wahlu.com/docs`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.instagram)
			body.instagram_settings = JSON.parse(opts.instagram);
		if (opts.tiktok) body.tiktok_settings = JSON.parse(opts.tiktok);
		if (opts.facebook)
			body.facebook_settings = JSON.parse(opts.facebook);
		if (opts.youtube) body.youtube_settings = JSON.parse(opts.youtube);
		if (opts.linkedin)
			body.linkedin_settings = JSON.parse(opts.linkedin);

		const res = await client.post(`/brands/${brandId}/posts`, body);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("update")
	.description("Update a post (only provided fields are changed)")
	.argument("<post-id>", "Post ID")
	.option("--name <name>", "Post name (max 500 chars)")
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
Updates an existing post. Only the fields you provide are changed —
omitted fields remain unchanged.

Examples:
  wahlu post update abc123 --name "New name"
  wahlu post update abc123 --instagram '{"description":"Updated caption"}'
  wahlu post update abc123 --labels label-1 label-2

See 'wahlu post create --help' for full platform settings reference.
Full documentation: https://wahlu.com/docs`,
	)
	.action(async function (this: Command, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.instagram)
			body.instagram_settings = JSON.parse(opts.instagram);
		if (opts.tiktok) body.tiktok_settings = JSON.parse(opts.tiktok);
		if (opts.facebook)
			body.facebook_settings = JSON.parse(opts.facebook);
		if (opts.youtube) body.youtube_settings = JSON.parse(opts.youtube);
		if (opts.linkedin)
			body.linkedin_settings = JSON.parse(opts.linkedin);

		const res = await client.patch(
			`/brands/${brandId}/posts/${postId}`,
			body,
		);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("delete")
	.description("Permanently delete a post")
	.argument("<post-id>", "Post ID")
	.addHelpText(
		"after",
		`
Permanently deletes a post. This cannot be undone.

Examples:
  wahlu post delete abc123`,
	)
	.action(async function (this: Command, postId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/posts/${postId}`);
		console.log(`Post ${postId} deleted.`);
	});
