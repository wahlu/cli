import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const scheduleCommand = new Command("schedule")
	.description("Manage scheduled posts");

scheduleCommand
	.command("list")
	.description("List scheduled posts")
	.option("--page <n>", "Page number", parseInt)
	.option("--limit <n>", "Items per page", parseInt)
	.option("--json", "Output as JSON")
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
	.description("Schedule a post")
	.argument("<post-id>", "Post ID to schedule")
	.requiredOption("--at <datetime>", "ISO 8601 datetime (e.g. 2026-03-15T14:00:00Z)")
	.requiredOption("--integrations <ids...>", "Integration IDs to publish to")
	.option("--json", "Output as JSON")
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
	.description("Unschedule a post")
	.argument("<scheduled-post-id>", "Scheduled post ID")
	.action(async function (this: Command, id: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/scheduled-posts/${id}`);
		console.log(`Scheduled post ${id} removed.`);
	});
