import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const scheduleCommand = new Command("schedule")
	.description("Schedule posts for future publishing to specific integrations")
	.addHelpText(
		"after",
		`
Scheduled posts are queued for publishing at a specific date and time
to one or more connected social media integrations.

Subcommands:
  list              List all scheduled posts
  create <post-id>  Schedule a post for future publishing
  delete <id>       Remove a post from the schedule (does not delete the post)

Typical workflow:
  1. Create a post:         wahlu post create --name "My post" --instagram '...'
  2. Find integration IDs:  wahlu integration list
  3. Schedule it:           wahlu schedule create <post-id> --at <datetime> --integrations <id>

Full documentation: https://wahlu.com/docs`,
	);

scheduleCommand
	.command("list")
	.description("List scheduled posts")
	.option("--page <n>", "Page number (default: 1)", parseInt)
	.option("--limit <n>", "Items per page (default: 50, max: 100)", parseInt)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns a paginated list of scheduled posts, sorted by scheduled_at.

Response fields:
  id                string       Scheduled post ID
  brand_id          string       Brand ID
  post_id           string       Referenced post ID
  scheduled_at      string       ISO 8601 datetime for publishing
  integration_ids   string[]     Integration IDs to publish to
  status            string       Status (e.g. "ready_for_publishing", "published", "failed")
  approval_status   string|null  Approval status
  source            string|null  "api" for API-created entries
  failure_reason    string|null  Failure reason if publishing failed
  thumbnail_url     string|null  Post thumbnail URL
  created_at        string       ISO 8601 timestamp
  updated_at        string       ISO 8601 timestamp

Examples:
  wahlu schedule list
  wahlu schedule list --limit 5 --json`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(
			`/brands/${brandId}/scheduled-posts`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "post_id", header: "Post ID", width: 24 },
				{ key: "status", header: "Status", width: 12 },
				{
					key: "scheduled_at",
					header: "Scheduled At",
					width: 20,
					transform: (v) =>
						v ? new Date(v as string).toLocaleString() : "-",
				},
			],
		});
	});

scheduleCommand
	.command("create")
	.description("Schedule a post for future publishing")
	.argument("<post-id>", "Post ID to schedule (must exist in the brand)")
	.requiredOption(
		"--at <datetime>",
		"ISO 8601 datetime (e.g. 2026-03-15T14:00:00Z)",
	)
	.requiredOption(
		"--integrations <ids...>",
		"Integration IDs to publish to (max 20)",
	)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Schedules an existing post for future publishing. The post must already
exist in the brand, and the integration IDs must be connected accounts.

Required fields:
  <post-id>            The ID of an existing post in this brand
  --at <datetime>      ISO 8601 datetime (e.g. "2026-03-15T14:00:00Z")
  --integrations <ids> Space-separated integration IDs

Find integration IDs with: wahlu integration list

Examples:
  wahlu schedule create post-abc \\
    --at 2026-03-15T14:00:00Z \\
    --integrations int-123

  wahlu schedule create post-abc \\
    --at 2026-03-15T14:00:00Z \\
    --integrations int-123 int-456 int-789 \\
    --json`,
	)
	.action(async function (this: Command, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.post(`/brands/${brandId}/scheduled-posts`, {
			post_id: postId,
			scheduled_at: opts.at,
			integration_ids: opts.integrations,
		});
		output(res.data, { json: opts.json });
	});

scheduleCommand
	.command("delete")
	.description("Remove a post from the schedule")
	.argument("<scheduled-post-id>", "Scheduled post ID (not the post ID)")
	.addHelpText(
		"after",
		`
Removes a scheduled post from the publishing queue. The post itself is
not deleted — only the schedule entry is removed.

Examples:
  wahlu schedule delete sched-abc123`,
	)
	.action(async function (this: Command, id: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/scheduled-posts/${id}`);
		console.log(`Scheduled post ${id} removed.`);
	});
