import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const scheduleCommand = new Command("schedule")
	.description(
		"Schedule content items for future publishing to specific integrations",
	)
	.addHelpText(
		"after",
		`
Publish runs are queued for publishing at a specific date and time to
one or more connected social media integrations. This command is a
compatibility alias kept as 'schedule'.

Subcommands:
  list                      List all publish runs
  create <content-item-id>  Schedule a content item for future publishing
  delete <id>               Remove a publish run (does not delete the content item)

Typical workflow:
  1. Create content:        wahlu post create --name "My post" --instagram '...'
  2. Find integration IDs:  wahlu integration list
  3. Schedule it:           wahlu schedule create <content-item-id> --at <datetime> --integrations <id>

Full documentation: https://wahlu.com/docs`,
	);

scheduleCommand
	.command("list")
	.description("List publish runs")
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
Returns a paginated list of publish runs, sorted by scheduled_at.

Response fields:
  id                string       Publish run ID
  brand_id          string       Brand ID
  content_item_id   string       Referenced content item ID
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
			`/brands/${brandId}/publish-runs`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "content_item_id", header: "Content ID", width: 24 },
				{ key: "status", header: "Status", width: 12 },
				{
					key: "scheduled_at",
					header: "Scheduled At",
					width: 20,
					transform: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
				},
			],
		});
	});

scheduleCommand
	.command("create")
	.description("Schedule a content item for future publishing")
	.argument(
		"<content-item-id>",
		"Content item ID to schedule (must exist in the brand)",
	)
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
Schedules an existing content item for future publishing. The item must already
exist in the brand, and the integration IDs must be connected accounts.

Required fields:
  <content-item-id>    The ID of an existing content item in this brand
  --at <datetime>      ISO 8601 datetime (e.g. "2026-03-15T14:00:00Z")
  --integrations <ids> Space-separated integration IDs

Find integration IDs with: wahlu integration list

Examples:
  wahlu schedule create content-abc \\
    --at 2026-03-15T14:00:00Z \\
    --integrations int-123

  wahlu schedule create content-abc \\
    --at 2026-03-15T14:00:00Z \\
    --integrations int-123 int-456 int-789 \\
    --json`,
	)
	.action(async function (this: Command, contentItemId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.post(`/brands/${brandId}/publish-runs`, {
			content_item_id: contentItemId,
			scheduled_at: opts.at,
			integration_ids: opts.integrations,
		});
		output(res.data, { json: opts.json });
	});

scheduleCommand
	.command("delete")
	.description("Remove a publish run")
	.argument("<publish-run-id>", "Publish run ID")
	.addHelpText(
		"after",
		`
Removes a publish run from the publishing queue. The content item itself is
not deleted — only the run entry is removed.

Examples:
  wahlu schedule delete sched-abc123`,
	)
	.action(async function (this: Command, id: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/publish-runs/${id}`);
		console.log(`Publish run ${id} removed.`);
	});
