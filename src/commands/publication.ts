import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const publicationCommand = new Command("publication")
	.description(
		"View content items that have been published to platforms (read-only)",
	)
	.addHelpText(
		"after",
		`
Publications are records of content items that have been successfully published
to social media platforms. This is a read-only view of your publishing history.

Subcommands:
  list    List all publications

Full documentation: https://wahlu.com/docs`,
	);

publicationCommand
	.command("list")
	.description("List published content items")
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
Returns a paginated list of published content items.

Response fields:
  id              string       Publication ID
  platform        string       Platform: "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin"
  post_id         string       Source content item ID (legacy field name)
  post_name       string|null  Content item name
  post_type       string|null  Post type (e.g. "grid_post", "reel", "video")
  media_type      string|null  Media type
  status          string       "processing" | "published" | "failed"
  source          string|null  "calendar" (from schedule) or "queue" (from queue)
  failure_reason  string|null  Failure reason if publishing failed
  integration_id  string       Integration used for publishing
  publish_id      string|null  Platform-specific content ID
  published_at    string       When it was published (ISO 8601)
  created_at      string       ISO 8601 timestamp
  updated_at      string       ISO 8601 timestamp

Examples:
  wahlu publication list
  wahlu publication list --limit 10 --json
  wahlu publication list --json | jq '.[] | select(.status == "failed")'`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(
			`/brands/${brandId}/publications`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "platform", header: "Platform", width: 12 },
				{ key: "post_name", header: "Post", width: 30 },
				{ key: "status", header: "Status", width: 12 },
				{
					key: "published_at",
					header: "Published",
					width: 20,
					transform: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
				},
			],
		});
	});
