import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

interface Config {
	api_key?: string;
	api_url?: string;
	default_brand_id?: string;
}

const CONFIG_DIR = join(homedir(), ".config", "wahlu");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

function ensureDir() {
	if (!existsSync(CONFIG_DIR)) {
		mkdirSync(CONFIG_DIR, { recursive: true });
	}
}

export function readConfig(): Config {
	if (!existsSync(CONFIG_FILE)) return {};
	try {
		return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
	} catch {
		return {};
	}
}

export function writeConfig(config: Config) {
	ensureDir();
	writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

export function getApiKey(): string {
	const envKey = process.env.WAHLU_API_KEY;
	if (envKey) return envKey;

	const config = readConfig();
	if (config.api_key) return config.api_key;

	console.error(
		"No API key found. Set WAHLU_API_KEY or run: wahlu auth login",
	);
	process.exit(1);
}

export function getApiUrl(): string {
	return (
		process.env.WAHLU_API_URL || readConfig().api_url || "https://api.wahlu.com"
	);
}

export function getDefaultBrandId(): string | undefined {
	return process.env.WAHLU_BRAND_ID || readConfig().default_brand_id;
}
