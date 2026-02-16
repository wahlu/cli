import { Command } from "commander";
import { readConfig, writeConfig } from "../lib/config.js";

export const authCommand = new Command("auth")
	.description("Manage authentication");

authCommand
	.command("login")
	.description("Save your API key")
	.argument("<api-key>", "Your Wahlu API key (wahlu_live_...)")
	.action((apiKey: string) => {
		if (!apiKey.startsWith("wahlu_live_") && !apiKey.startsWith("wahlu_test_")) {
			console.error("Invalid API key format. Keys start with wahlu_live_ or wahlu_test_");
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
	.action(() => {
		const config = readConfig();
		delete config.api_key;
		writeConfig(config);
		console.log("API key removed.");
	});

authCommand
	.command("status")
	.description("Show current auth status")
	.action(() => {
		const envKey = process.env.WAHLU_API_KEY;
		const config = readConfig();

		if (envKey) {
			console.log(`Authenticated via WAHLU_API_KEY env var (${mask(envKey)})`);
		} else if (config.api_key) {
			console.log(`Authenticated via config file (${mask(config.api_key)})`);
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
	return key.slice(0, 12) + "..." + key.slice(-4);
}
