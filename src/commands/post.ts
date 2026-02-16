import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const postCommand = new Command("post")
	.description("Manage posts");

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
	.option("--instagram <json>", "Instagram settings (JSON)")
	.option("--tiktok <json>", "TikTok settings (JSON)")
	.option("--facebook <json>", "Facebook settings (JSON)")
	.option("--youtube <json>", "YouTube settings (JSON)")
	.option("--linkedin <json>", "LinkedIn settings (JSON)")
	.option("--labels <ids...>", "Label IDs")
	.option("--json", "Output as JSON")
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
	.description("Update a post")
	.argument("<post-id>", "Post ID")
	.option("--name <name>", "Post name")
	.option("--instagram <json>", "Instagram settings (JSON)")
	.option("--tiktok <json>", "TikTok settings (JSON)")
	.option("--facebook <json>", "Facebook settings (JSON)")
	.option("--youtube <json>", "YouTube settings (JSON)")
	.option("--linkedin <json>", "LinkedIn settings (JSON)")
	.option("--labels <ids...>", "Label IDs")
	.option("--json", "Output as JSON")
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
