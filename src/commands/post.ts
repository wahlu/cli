import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const postCommand = new Command("post")
	.description("Manage posts")
	.addHelpText(
		"after",
		`
Examples:
  wahlu post list                          List all posts
  wahlu post list --limit 5 --json         First 5 posts as JSON
  wahlu post get abc123                    Get full post details
  wahlu post create --name "My post"       Create a blank post
  wahlu post delete abc123                 Delete a post

Use --brand <id> or set a default with: wahlu brand switch <id>`,
	);

postCommand
	.command("list")
	.description("List posts")
	.option("--page <n>", "Page number", parseInt)
	.option("--limit <n>", "Items per page", parseInt)
	.option("--json", "Output as JSON")
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(`/brands/${brandId}/posts`, opts.page, opts.limit);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 40 },
				{
					key: "created_at",
					header: "Created",
					width: 20,
					transform: (v) => (v ? new Date(v as string).toLocaleDateString() : "-"),
				},
			],
		});
		if (!opts.json && res.pagination?.has_more) {
			console.log(`\nPage ${res.pagination.page} — more results available (--page ${res.pagination.page + 1})`);
		}
	});

postCommand
	.command("get")
	.description("Get post details")
	.argument("<post-id>", "Post ID")
	.option("--json", "Output as JSON")
	.action(async function (this: Command, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get(`/brands/${brandId}/posts/${postId}`);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("create")
	.description("Create a new post")
	.option("--name <name>", "Post name")
	.option("--instagram <json>", "Instagram settings as JSON string")
	.option("--tiktok <json>", "TikTok settings as JSON string")
	.option("--facebook <json>", "Facebook settings as JSON string")
	.option("--youtube <json>", "YouTube settings as JSON string")
	.option("--linkedin <json>", "LinkedIn settings as JSON string")
	.option("--labels <ids...>", "Label IDs to attach")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Examples:
  wahlu post create --name "Monday post" \\
    --instagram '{"description":"Hello!","post_type":"grid_post"}'

  wahlu post create --name "Video post" \\
    --tiktok '{"description":"Check this out","post_type":"video","media_ids":["mid-123"]}' \\
    --instagram '{"description":"Check this out","post_type":"reel","media_ids":["mid-123"]}'

Platform settings reference:

  Instagram (--instagram):
    description    string   Caption text
    post_type      string   "grid_post" | "reel" | "story"
    media_ids      string[] Media IDs to attach
    trial_reel     boolean  Post as trial reel (non-followers first)

  TikTok (--tiktok):
    description    string   Caption text
    post_type      string   "video" | "image" | "carousel"
    media_ids      string[] Media IDs to attach
    privacy_level  string   "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY"
    allow_comment  boolean  Allow comments (default: true)
    allow_duet     boolean  Allow duets (default: true)
    allow_stitch   boolean  Allow stitches (default: true)
    is_aigc        boolean  Disclose as AI-generated
    auto_add_music boolean  Auto-add music (photo/carousel only)

  Facebook (--facebook):
    description    string   Caption text
    post_type      string   "fb_post" | "fb_story" | "fb_reel" | "fb_text"
    media_ids      string[] Media IDs to attach

  YouTube (--youtube):
    title          string   Video title
    description    string   Video description
    post_type      string   "yt_short" | "yt_video"
    media_ids      string[] Media IDs to attach
    privacy_level  string   "public" | "unlisted" | "private"
    notify_subscribers boolean  Notify subscribers on publish

  LinkedIn (--linkedin):
    description    string   Post text
    post_type      string   "li_text" | "li_image" | "li_video" | "li_article"
    media_ids      string[] Media IDs to attach
    visibility     string   "PUBLIC" | "CONNECTIONS"
    title          string   Article title (li_article only)
    original_url   string   Article URL (li_article only)`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.instagram) body.instagram_settings = JSON.parse(opts.instagram);
		if (opts.tiktok) body.tiktok_settings = JSON.parse(opts.tiktok);
		if (opts.facebook) body.facebook_settings = JSON.parse(opts.facebook);
		if (opts.youtube) body.youtube_settings = JSON.parse(opts.youtube);
		if (opts.linkedin) body.linkedin_settings = JSON.parse(opts.linkedin);

		const res = await client.post(`/brands/${brandId}/posts`, body);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("update")
	.description("Update a post (only provided fields are changed)")
	.argument("<post-id>", "Post ID")
	.option("--name <name>", "Post name")
	.option("--instagram <json>", "Instagram settings as JSON string")
	.option("--tiktok <json>", "TikTok settings as JSON string")
	.option("--facebook <json>", "Facebook settings as JSON string")
	.option("--youtube <json>", "YouTube settings as JSON string")
	.option("--linkedin <json>", "LinkedIn settings as JSON string")
	.option("--labels <ids...>", "Label IDs to attach")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Examples:
  wahlu post update abc123 --name "New name"
  wahlu post update abc123 --instagram '{"description":"Updated caption"}'

See 'wahlu post create --help' for full platform settings reference.`,
	)
	.action(async function (this: Command, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = {};
		if (opts.name) body.name = opts.name;
		if (opts.labels) body.label_ids = opts.labels;
		if (opts.instagram) body.instagram_settings = JSON.parse(opts.instagram);
		if (opts.tiktok) body.tiktok_settings = JSON.parse(opts.tiktok);
		if (opts.facebook) body.facebook_settings = JSON.parse(opts.facebook);
		if (opts.youtube) body.youtube_settings = JSON.parse(opts.youtube);
		if (opts.linkedin) body.linkedin_settings = JSON.parse(opts.linkedin);

		const res = await client.patch(`/brands/${brandId}/posts/${postId}`, body);
		output(res.data, { json: opts.json });
	});

postCommand
	.command("delete")
	.description("Delete a post")
	.argument("<post-id>", "Post ID")
	.action(async function (this: Command, postId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/posts/${postId}`);
		console.log(`Post ${postId} deleted.`);
	});
