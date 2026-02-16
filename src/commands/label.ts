import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const labelCommand = new Command("label")
	.description("Manage labels")
	.addHelpText(
		"after",
		`
Examples:
  wahlu label list                         List all labels
  wahlu label create "Urgent"              Create a label
  wahlu label create "Promo" --color "#ff5500"  Create with colour
  wahlu label delete abc123                Delete a label

Labels can be attached to posts via: wahlu post create --labels <id1> <id2>`,
	);

labelCommand
	.command("list")
	.description("List labels")
	.option("--json", "Output as JSON")
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
	.argument("<name>", "Label name")
	.option("--color <hex>", "Colour (hex)")
	.option("--json", "Output as JSON")
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
	.action(async function (this: Command, labelId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/labels/${labelId}`);
		console.log(`Label ${labelId} deleted.`);
	});
