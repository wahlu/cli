import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const publicationCommand = new Command("publication")
	.description("View published posts");

publicationCommand
	.command("list")
	.description("List publications")
	.option("--page <n>", "Page number", parseInt)
	.option("--limit <n>", "Items per page", parseInt)
	.option("--json", "Output as JSON")
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
					transform: (v) =>
						v ? new Date(v as string).toLocaleString() : "-",
				},
			],
		});
	});
