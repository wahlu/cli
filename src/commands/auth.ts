import { Command } from "commander";
import { readConfig, writeConfig } from "../lib/config.js";

export const authCommand = new Command("auth")
	.description("Authenticate with your Wahlu API key")
	.addHelpText(
		"after",
		`
Manage your Wahlu API key for CLI authentication.

Subcommands:
  login <key>    Save an API key to ~/.config/wahlu/config.json
  logout         Remove the saved API key
  status         Show current authentication state and config

Authentication priority:
  1. WAHLU_API_KEY environment variable (highest priority)
  2. Saved key in ~/.config/wahlu/config.json

Generate an API key at wahlu.com under Settings > API Keys.
Full documentation: https://wahlu.com/docs`,
	);

authCommand
	.command("login")
	.description("Save your API key")
	.argument("<api-key>", "Your Wahlu API key (wahlu_live_... or wahlu_test_...)")
	.addHelpText(
		"after",
		`
Saves the API key to ~/.config/wahlu/config.json for use in future commands.
The key must start with wahlu_live_ (production) or wahlu_test_ (development).

Examples:
  wahlu auth login wahlu_live_abc123def456...
  wahlu auth login wahlu_test_abc123def456...

You can also skip this and use an environment variable instead:
  export WAHLU_API_KEY=wahlu_live_abc123...`,
	)
	.action((apiKey: string) => {
		if (
			!apiKey.startsWith("wahlu_live_") &&
			!apiKey.startsWith("wahlu_test_")
		) {
			console.error(
				"Invalid API key format. Keys start with wahlu_live_ or wahlu_test_",
			);
			process.exit(1);
		}

		const config = readConfig();
		config.api_key = apiKey;
		writeConfig(config);
		console.log("API key saved to ~/.config/wahlu/config.json");
	});

authCommand
	.command("logout")
	.description("Remove saved API key")
	.addHelpText(
		"after",
		`
Removes the API key from ~/.config/wahlu/config.json.
Does not affect the WAHLU_API_KEY environment variable.`,
	)
	.action(() => {
		const config = readConfig();
		delete config.api_key;
		writeConfig(config);
		console.log("API key removed.");
	});

authCommand
	.command("status")
	.description("Show current auth status")
	.addHelpText(
		"after",
		`
Shows which authentication method is active and any saved configuration.

Displays:
  - Auth source (env var or config file) and masked key
  - Custom API URL if set
  - Default brand ID if set`,
	)
	.action(() => {
		const envKey = process.env.WAHLU_API_KEY;
		const config = readConfig();

		if (envKey) {
			console.log(
				`Authenticated via WAHLU_API_KEY env var (${mask(envKey)})`,
			);
		} else if (config.api_key) {
			console.log(
				`Authenticated via config file (${mask(config.api_key)})`,
			);
		} else {
			console.log("Not authenticated. Run: wahlu auth login <api-key>");
		}

		if (config.api_url) {
			console.log(`API URL: ${config.api_url}`);
		}
		if (config.default_brand_id) {
			console.log(`Default brand: ${config.default_brand_id}`);
		}
	});

function mask(key: string): string {
	if (key.length <= 16) return "***";
	return `${key.slice(0, 12)}...${key.slice(-4)}`;
}
