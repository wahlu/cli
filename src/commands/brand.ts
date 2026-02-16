import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl, readConfig, writeConfig } from "../lib/config.js";
import { output } from "../lib/output.js";

export const brandCommand = new Command("brand")
	.description("Manage brands")
	.addHelpText(
		"after",
		`
Examples:
  wahlu brand list                         List all brands
  wahlu brand list --json                  List as JSON
  wahlu brand get abc123                   Get full brand details
  wahlu brand switch abc123                Set as default brand

Setting a default brand avoids needing --brand on every command.
You can also set WAHLU_BRAND_ID as an environment variable.`,
	);

brandCommand
	.command("list")
	.description("List all brands")
	.option("--json", "Output as JSON")
	.action(async (opts) => {
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get<unknown[]>("/brands");
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "name", header: "Name", width: 30 },
				{ key: "timezone", header: "Timezone", width: 20 },
				{ key: "website", header: "Website", width: 30 },
			],
		});
	});

brandCommand
	.command("get")
	.description("Get brand details")
	.argument("<brand-id>", "Brand ID")
	.option("--json", "Output as JSON")
	.action(async (brandId: string, opts) => {
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get(`/brands/${brandId}`);
		output(res.data, { json: opts.json });
	});

brandCommand
	.command("switch")
	.description("Set default brand for all commands")
	.argument("<brand-id>", "Brand ID to use as default")
	.action((brandId: string) => {
		const config = readConfig();
		config.default_brand_id = brandId;
		writeConfig(config);
		console.log(`Default brand set to ${brandId}`);
	});
