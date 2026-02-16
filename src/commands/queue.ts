import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const queueCommand = new Command("queue")
	.description("Manage publishing queues")
	.addHelpText(
		"after",
		`
Examples:
  wahlu queue list                         List all queues
  wahlu queue list --json                  List as JSON
  wahlu queue add <queue-id> <post-id>     Add a post to a queue

Queues define recurring time slots. Posts added to a queue are
published automatically at the next available slot.`,
	);

queueCommand
	.command("list")
	.description("List queues")
	.option("--json", "Output as JSON")
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get<unknown[]>(`/brands/${brandId}/queues`);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 30 },
				{ key: "active", header: "Active", width: 8, transform: (v) => (v ? "yes" : "no") },
				{ key: "mode", header: "Mode", width: 12 },
				{
					key: "next_run_at",
					header: "Next Run",
					width: 20,
					transform: (v) => (v ? new Date(v as string).toLocaleString() : "-"),
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
	.action(async function (this: Command, queueId: string, postId: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.patch(`/brands/${brandId}/queues/${queueId}`, {
			post_ids: [postId],
		});
		output(res.data, { json: opts.json });
	});
