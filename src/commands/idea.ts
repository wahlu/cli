import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const ideaCommand = new Command("idea")
	.description("Save, list, and manage content ideas")
	.addHelpText(
		"after",
		`
Ideas are a scratchpad for future content concepts. Save ideas as you
think of them, then develop them into full posts later.

Subcommands:
  list              List all ideas
  create <name>     Save a new idea
  delete <id>       Delete an idea

Full documentation: https://wahlu.com/docs`,
	);

ideaCommand
	.command("list")
	.description("List all ideas")
	.option("--page <n>", "Page number (default: 1)", parseInt)
	.option("--limit <n>", "Items per page (default: 50, max: 100)", parseInt)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns a paginated list of content ideas.

Response fields:
  id            string       Idea ID
  name          string|null  Idea name/title
  description   string|null  Detailed description
  type          string|null  Idea type
  status        string       Status
  labels        string[]     Text labels
  last_used_at  string|null  Last used timestamp
  created_at    string       ISO 8601 timestamp
  updated_at    string       ISO 8601 timestamp

Examples:
  wahlu idea list
  wahlu idea list --limit 10 --json`,
	)
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
	.description("Save a new content idea")
	.argument("<name>", "Idea name/title (max 500 chars)")
	.option("--description <text>", "Detailed description (max 10000 chars)")
	.option("--type <type>", "Idea type (max 50 chars)")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Saves a new content idea. Only the name is required.

Fields:
  <name>             string    Idea name/title (required, max 500 chars)
  --description      string    Detailed description (max 10000 chars)
  --type             string    Idea type (max 50 chars)

Examples:
  wahlu idea create "Blog about summer trends"
  wahlu idea create "Product launch" --description "Announce the new feature" --type "campaign"
  wahlu idea create "Quick tip series" --json`,
	)
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
	.addHelpText(
		"after",
		`
Permanently deletes an idea. This cannot be undone.

Examples:
  wahlu idea delete idea-abc123`,
	)
	.action(async function (this: Command, ideaId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/ideas/${ideaId}`);
		console.log(`Idea ${ideaId} deleted.`);
	});
