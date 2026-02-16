import { Command } from "commander";
import { authCommand } from "./commands/auth.js";
import { brandCommand } from "./commands/brand.js";
import { ideaCommand } from "./commands/idea.js";
import { integrationCommand } from "./commands/integration.js";
import { labelCommand } from "./commands/label.js";
import { mediaCommand } from "./commands/media.js";
import { postCommand } from "./commands/post.js";
import { publicationCommand } from "./commands/publication.js";
import { queueCommand } from "./commands/queue.js";
import { scheduleCommand } from "./commands/schedule.js";
import { CliError } from "./lib/client.js";

const program = new Command()
	.name("wahlu")
	.description("Wahlu CLI — manage your social media from the terminal")
	.version("0.1.0")
	.option("--brand <id>", "Brand ID (overrides default)")
	.configureHelp({ sortSubcommands: true });

program.addCommand(authCommand);
program.addCommand(brandCommand);
program.addCommand(ideaCommand);
program.addCommand(integrationCommand);
program.addCommand(labelCommand);
program.addCommand(mediaCommand);
program.addCommand(postCommand);
program.addCommand(publicationCommand);
program.addCommand(queueCommand);
program.addCommand(scheduleCommand);

// Global error handler
program.exitOverride();

async function main() {
	try {
		await program.parseAsync(process.argv);
	} catch (err) {
		if (err instanceof CliError) {
			console.error(`Error: ${err.message}`);
			process.exit(1);
		}
		// Commander exits on --help, --version, etc.
		if (
			err &&
			typeof err === "object" &&
			"code" in err &&
			(err as { code: string }).code === "commander.helpDisplayed"
		) {
			process.exit(0);
		}
		if (
			err &&
			typeof err === "object" &&
			"code" in err &&
			(err as { code: string }).code === "commander.version"
		) {
			process.exit(0);
		}
		throw err;
	}
}

main();
