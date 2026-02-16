import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { Command } from "commander";
import { WahluClient } from "../lib/client.js";
import { getApiKey, getApiUrl } from "../lib/config.js";
import { output } from "../lib/output.js";
import { resolveBrandId } from "../lib/resolve-brand.js";

const MIME_TYPES: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".mp4": "video/mp4",
	".mov": "video/quicktime",
	".webm": "video/webm",
};

export const mediaCommand = new Command("media")
	.description("Manage media files");

mediaCommand
	.command("list")
	.description("List media")
	.option("--page <n>", "Page number", parseInt)
	.option("--limit <n>", "Items per page", parseInt)
	.option("--json", "Output as JSON")
	.action(async function (this: Command, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		const res = await client.list(
			`/brands/${brandId}/media`,
			opts.page,
			opts.limit,
		);
		output(res.data, {
			json: opts.json,
			columns: [
				{ key: "id", header: "ID", width: 24 },
				{ key: "file_name", header: "Filename", width: 30 },
				{ key: "content_type", header: "Type", width: 16 },
				{ key: "status", header: "Status", width: 12 },
				{
					key: "size",
					header: "Size",
					width: 10,
					transform: (v) => {
						if (!v) return "-";
						const bytes = v as number;
						if (bytes < 1024) return `${bytes}B`;
						if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
						return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
					},
				},
			],
		});
	});

mediaCommand
	.command("upload")
	.description("Upload a file")
	.argument("<file>", "Local file path")
	.option("--json", "Output as JSON")
	.action(async function (this: Command, filePath: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());

		const filename = basename(filePath);
		const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
		const contentType = MIME_TYPES[ext];
		if (!contentType) {
			console.error(`Unsupported file type: ${ext}`);
			process.exit(1);
		}

		const stat = statSync(filePath);

		// 1. Get upload URL
		const urlRes = await client.post<{
			id: string;
			upload_url: string;
		}>(`/brands/${brandId}/media/upload-url`, {
			filename,
			content_type: contentType,
			size: stat.size,
		});

		const { id, upload_url } = urlRes.data;

		// 2. Upload file bytes
		const fileBytes = readFileSync(filePath);
		const uploadRes = await fetch(upload_url, {
			method: "PUT",
			headers: { "Content-Type": contentType },
			body: fileBytes,
		});

		if (!uploadRes.ok) {
			console.error(`Upload failed: HTTP ${uploadRes.status}`);
			process.exit(1);
		}

		// 3. Finalise
		await client.patch(`/brands/${brandId}/media/${id}`, {
			status: "available",
		});

		if (opts.json) {
			console.log(JSON.stringify({ id, filename, status: "processing" }, null, 2));
		} else {
			console.log(`Uploaded ${filename} — media ID: ${id}`);
			console.log("Processing will complete shortly. Use 'wahlu media list' to check status.");
		}
	});

mediaCommand
	.command("delete")
	.description("Delete a media file")
	.argument("<media-id>", "Media ID")
	.action(async function (this: Command, mediaId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/media/${mediaId}`);
		console.log(`Media ${mediaId} deleted.`);
	});
