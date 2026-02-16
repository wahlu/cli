import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const queueCommand = new Command("queue")
	.description("View publishing queues and add posts to them")
	.addHelpText(
		"after",
		`
Queues define recurring time slots for automatic post publishing.
Posts added to a queue are published at the next available slot.

Subcommands:
  list                       List all queues and their status
  add <queue-id> <post-id>   Add a post to a queue

Queues are created and configured in the Wahlu web app.

Full documentation: https://wahlu.com/docs`,
	);

queueCommand
	.command("list")
	.description("List all queues")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns all queues for the brand (no pagination — returns all at once).

Response fields:
  id                string       Queue ID
  name              string       Queue name
  brand_id          string       Brand ID
  active            boolean      Whether the queue is active
  mode              string       Queue mode
  interval          number|null  Interval between posts
  interval_unit     string|null  Interval unit
  times_of_day      string[]     Scheduled times (e.g. ["09:00", "17:00"])
  timezone          string|null  IANA timezone
  valid_from        string|null  ISO 8601 start date
  valid_until       string|null  ISO 8601 end date
  next_run_at       string|null  Next scheduled publishing time
  loop              boolean      Whether to loop through posts
  post_ids          string[]     Ordered list of post IDs in the queue
  integration_ids   string[]     Integration IDs to publish to
  skip_count        number       Number of posts skipped
  created_at        string       ISO 8601 timestamp
  updated_at        string       ISO 8601 timestamp

Examples:
  wahlu queue list
  wahlu queue list --json`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get<unknown[]>(`/brands/${brandId}/queues`);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 30 },
				{
					key: "active",
					header: "Active",
					width: 8,
					transform: (v) => (v ? "yes" : "no"),
				},
				{ key: "mode", header: "Mode", width: 12 },
				{
					key: "next_run_at",
					header: "Next Run",
					width: 20,
					transform: (v) =>
						v ? new Date(v as string).toLocaleString() : "-",
				},
			],
		});
	});

queueCommand
	.command("add")
	.description("Add a post to a queue")
	.argument("<queue-id>", "Queue ID")
	.argument("<post-id>", "Post ID to add")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Adds a post to a queue. The post will be published at the queue's
next available time slot.

Examples:
  wahlu queue add queue-abc post-xyz
  wahlu queue add queue-abc post-xyz --json`,
	)
	.action(async function (
		this: Command,
		queueId: string,
		postId: string,
		opts,
	) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.patch(
			`/brands/${brandId}/queues/${queueId}`,
			{
				post_ids: [postId],
			},
		);
		output(res.data, { json: opts.json });
	});
