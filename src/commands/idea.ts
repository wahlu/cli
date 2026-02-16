import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const ideaCommand = new Command("idea")
	.description("Manage content ideas")
	.addHelpText(
		"after",
		`
Examples:
  wahlu idea list                                      List all ideas
  wahlu idea create "Blog about summer trends"         Save an idea
  wahlu idea create "Product launch" \\
    --description "Announce the new feature" \\
    --type "campaign"                                  Save with details
  wahlu idea delete abc123                             Delete an idea`,
	);

ideaCommand
	.command("list")
	.description("List ideas")
	.option("--page <n>", "Page number", parseInt)
	.option("--limit <n>", "Items per page", parseInt)
	.option("--json", "Output as JSON")
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(
			`/brands/${brandId}/ideas`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 40 },
				{ key: "status", header: "Status", width: 12 },
				{ key: "type", header: "Type", width: 12 },
			],
		});
	});

ideaCommand
	.command("create")
	.description("Save a new idea")
	.argument("<name>", "Idea name")
	.option("--description <text>", "Idea description")
	.option("--type <type>", "Idea type")
	.option("--json", "Output as JSON")
	.action(async function (this: Command, name: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = { name };
		if (opts.description) body.description = opts.description;
		if (opts.type) body.type = opts.type;

		const res = await client.post(`/brands/${brandId}/ideas`, body);
		output(res.data, { json: opts.json });
	});

ideaCommand
	.command("delete")
	.description("Delete an idea")
	.argument("<idea-id>", "Idea ID")
	.action(async function (this: Command, ideaId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/ideas/${ideaId}`);
		console.log(`Idea ${ideaId} deleted.`);
	});
