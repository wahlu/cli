import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import {
	getApiKey,
	getApiUrl,
	readConfig,
	writeConfig,
} from "../lib/config.js";
import { output } from "../lib/output.js";

export const brandCommand = new Command("brand")
	.description("List brands, view details, set a default brand")
	.addHelpText(
		"after",
		`
A brand represents a social media profile in Wahlu. All posts, media,
schedules, and queues belong to a brand. Most commands require a brand.

Subcommands:
  list           List all brands accessible to your API key
  get <id>       View full details for a brand
  switch <id>    Set a default brand for all future commands

Setting a default brand:
  wahlu brand switch <brand-id>

  This saves the brand ID to ~/.config/wahlu/config.json so you don't
  need --brand on every command. You can also set WAHLU_BRAND_ID as
  an environment variable.

Full documentation: https://wahlu.com/docs`,
	);

brandCommand
	.command("list")
	.description("List all brands")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Lists all brands accessible to your API key.

Response fields:
  id                  string       Brand ID
  name                string       Brand name
  description         string|null  Brand description
  logo_url            string|null  Logo URL
  timezone            string|null  IANA timezone (e.g. "Australia/Sydney")
  website             string|null  Brand website URL
  business_category   string|null  Business category
  brand_kit           object|null  Brand kit (fonts, colours, voice)
  content_preferences object|null  CTA, logo frequency settings
  image_posting       object|null  Image posting preferences
  video_posting       object|null  Video posting preferences
  created_at          string       ISO 8601 timestamp
  updated_at          string       ISO 8601 timestamp

Examples:
  wahlu brand list
  wahlu brand list --json`,
	)
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
	.addHelpText(
		"after",
		`
Returns full details for a single brand including brand kit, content
preferences, and posting configuration.

Examples:
  wahlu brand get abc123
  wahlu brand get abc123 --json`,
	)
	.action(async (brandId: string, opts) => {
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.get(`/brands/${brandId}`);
		output(res.data, { json: opts.json });
	});

brandCommand
	.command("switch")
	.description("Set default brand for all commands")
	.argument("<brand-id>", "Brand ID to use as default")
	.addHelpText(
		"after",
		`
Saves the brand ID to ~/.config/wahlu/config.json. All commands that
require a brand will use this ID unless overridden with --brand.

Examples:
  wahlu brand switch abc123
  wahlu post list                     # uses abc123 automatically
  wahlu post list --brand xyz789      # overrides for this command`,
	)
	.action((brandId: string) => {
		const config = readConfig();
		config.default_brand_id = brandId;
		writeConfig(config);
		console.log(`Default brand set to ${brandId}`);
	});
