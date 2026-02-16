import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const labelCommand = new Command("label")
	.description("Create and manage labels for organising posts")
	.addHelpText(
		"after",
		`
Labels are used to categorise and organise posts and media.

Subcommands:
  list              List all labels
  create <name>     Create a new label
  delete <id>       Delete a label

Labels can be attached to posts:
  wahlu post create --name "My post" --labels label-1 label-2

Full documentation: https://wahlu.com/docs`,
	);

labelCommand
	.command("list")
	.description("List all labels")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns all labels for the brand (no pagination — returns all at once).

Response fields:
  id          string       Label ID
  name        string       Label name
  color       string|null  Colour hex code (e.g. "#ff5500")
  created_at  string       ISO 8601 timestamp
  updated_at  string       ISO 8601 timestamp

Examples:
  wahlu label list
  wahlu label list --json`,
	)
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get<unknown[]>(`/brands/${brandId}/labels`);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 30 },
				{ key: "color", header: "Colour", width: 10 },
			],
		});
	});

labelCommand
	.command("create")
	.description("Create a label")
	.argument("<name>", "Label name (required, max 100 chars)")
	.option("--color <hex>", "Colour hex code (e.g. \"#ff5500\", max 20 chars)")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Creates a new label for organising posts and media.

Fields:
  <name>      string    Label name (required, max 100 chars)
  --color     string    Colour hex code (optional, max 20 chars)

Examples:
  wahlu label create "Urgent"
  wahlu label create "Promo" --color "#ff5500"
  wahlu label create "Campaign Q1" --json`,
	)
	.action(async function (this: Command, name: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const body: Record<string, unknown> = { name };
		if (opts.color) body.color = opts.color;

		const res = await client.post(`/brands/${brandId}/labels`, body);
		output(res.data, { json: opts.json });
	});

labelCommand
	.command("delete")
	.description("Delete a label")
	.argument("<label-id>", "Label ID")
	.addHelpText(
		"after",
		`
Permanently deletes a label. This does not remove the label from
posts that already have it attached.

Examples:
  wahlu label delete label-abc123`,
	)
	.action(async function (this: Command, labelId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/labels/${labelId}`);
		console.log(`Label ${labelId} deleted.`);
	});
