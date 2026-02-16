import type { Command } from "commander";
import { getDefaultBrandId } from "./config.js";

/**
 * Resolve brand ID from --brand flag, WAHLU_BRAND_ID env, or config default.
 * Exits with helpful error if none found.
 */
export function resolveBrandId(cmd: Command): string {
	const brandId =
		cmd.optsWithGlobals().brand || getDefaultBrandId();

	if (!brandId) {
		console.error(
			"No brand specified. Use --brand <id>, set WAHLU_BRAND_ID, or run: wahlu brand switch <id>",
		);
		process.exit(1);
	}

	return brandId;
}
