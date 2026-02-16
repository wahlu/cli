import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

export const integrationCommand = new Command("integration")
	.description("View connected social media accounts (read-only)")
	.addHelpText(
		"after",
		`
Integrations are connected social media accounts. You need integration IDs
when scheduling posts (wahlu schedule create --integrations <id>).

Subcommands:
  list    List all connected integrations

Integrations are connected and managed in the Wahlu web app.
This command is read-only — you cannot connect or disconnect accounts via the CLI.

Full documentation: https://wahlu.com/docs`,
	);

integrationCommand
	.command("list")
	.description("List connected integrations")
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns all connected integrations for the brand (no pagination).
Credentials (tokens, secrets) are never exposed.

Response fields:
  id            string       Integration ID (use in --integrations when scheduling)
  platform      string       Platform: "instagram" | "tiktok" | "facebook" | "youtube" | "linkedin"
  status        string       Connection status
  brand_id      string       Brand ID
  display_name  string|null  Display name on the platform
  username      string|null  Platform username/handle
  avatar_url    string|null  Profile avatar URL
  permissions   object|null  Granted permissions
  created_at    string       ISO 8601 timestamp
  updated_at    string       ISO 8601 timestamp

Examples:
  wahlu integration list
  wahlu integration list --json
  wahlu integration list --json | jq '.[] | {id, platform, username}'`,
	)
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
