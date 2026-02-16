import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const integrationCommand = new Command("integration")
	.description("View connected platforms");

integrationCommand
	.command("list")
	.description("List integrations")
	.option("--json", "Output as JSON")
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get<unknown[]>(
			`/brands/${brandId}/integrations`,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "platform", header: "Platform", width: 12 },
				{ key: "username", header: "Username", width: 20 },
				{ key: "status", header: "Status", width: 12 },
			],
		});
	});
