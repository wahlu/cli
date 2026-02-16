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
	.description("Upload images/videos and manage your media library")
	.addHelpText(
		"after",
		`
Media files (images and videos) that can be attached to posts via media_ids
in platform settings.

Subcommands:
  list              List all media files in the library
  upload <file>     Upload a local image or video file
  delete <id>       Permanently delete a media file

Supported formats:
  Images:  .png, .jpg, .jpeg, .gif, .webp
  Videos:  .mp4, .mov, .webm

Typical workflow:
  1. Upload:     wahlu media upload ./photo.jpg
  2. Get the media ID from the output
  3. Use in a post:  wahlu post create --name "Photo post" \\
       --instagram '{"description":"Nice!","post_type":"grid_post","media_ids":["<media-id>"]}'

Full documentation: https://wahlu.com/docs`,
	);

mediaCommand
	.command("list")
	.description("List media files")
	.option("--page <n>", "Page number (default: 1)", parseInt)
	.option("--limit <n>", "Items per page (default: 50, max: 100)", parseInt)
	.option("--json", "Output as JSON")
	.addHelpText(
		"after",
		`
Returns a paginated list of media files for the brand.

Response fields:
  id                  string       Media ID (use in media_ids arrays)
  file_name           string       Original filename
  content_type        string       MIME type (e.g. "image/jpeg", "video/mp4")
  size                number       File size in bytes
  duration            number|null  Duration in seconds (video/audio only)
  status              string       Processing status: "available" | "processing" | "completed" | "failed"
  workflow_status     string|null  Normalised lifecycle status
  label_ids           string[]     Attached label IDs
  folder_id           string|null  Folder ID
  download_url        string|null  Signed download URL
  thumbnail_large_url string|null  Large thumbnail URL
  thumbnail_small_url string|null  Small thumbnail URL
  source              string|null  Upload source: "upload" | "generated" | "stock" | "scan"
  description         string|null  Media description
  last_used_at        string|null  Last used in a post
  created_at          string       ISO 8601 timestamp
  updated_at          string       ISO 8601 timestamp

Examples:
  wahlu media list
  wahlu media list --limit 10 --json`,
	)
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
						if (bytes < 1024 * 1024)
							return `${(bytes / 1024).toFixed(0)}KB`;
						return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
					},
				},
			],
		});
	});

mediaCommand
	.command("upload")
	.description("Upload a local file to the media library")
	.argument("<file>", "Local file path (e.g. ./photo.jpg, ~/videos/clip.mp4)")
	.option("--json", "Output as JSON (returns media ID)")
	.addHelpText(
		"after",
		`
Uploads a local file to your brand's media library. The upload is a 3-step
process handled automatically:
  1. Request a signed upload URL from the API
  2. Upload the file bytes to the signed URL
  3. Mark the media as available for processing

After upload, Wahlu processes the media (generates thumbnails, etc.).
Use 'wahlu media list' to check when status changes to "completed".

The returned media ID can be used in post platform settings:
  --instagram '{"media_ids":["<media-id>"],...}'

Examples:
  wahlu media upload ./photo.jpg
  wahlu media upload ~/Desktop/video.mp4 --json`,
	)
	.action(async function (this: Command, filePath: string, opts) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());

		const filename = basename(filePath);
		const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
		const contentType = MIME_TYPES[ext];
		if (!contentType) {
			console.error(
				`Unsupported file type: ${ext}\nSupported: ${Object.keys(MIME_TYPES).join(", ")}`,
			);
			process.exit(1);
		}

		const stat = statSync(filePath);

		const urlRes = await client.post<{
			id: string;
			upload_url: string;
		}>(`/brands/${brandId}/media/upload-url`, {
			filename,
			content_type: contentType,
			size: stat.size,
		});

		const { id, upload_url } = urlRes.data;

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

		await client.patch(`/brands/${brandId}/media/${id}`, {
			status: "available",
		});

		if (opts.json) {
			console.log(
				JSON.stringify({ id, filename, status: "processing" }, null, 2),
			);
		} else {
			console.log(`Uploaded ${filename} — media ID: ${id}`);
			console.log(
				"Processing will complete shortly. Use 'wahlu media list' to check status.",
			);
		}
	});

mediaCommand
	.command("delete")
	.description("Permanently delete a media file")
	.argument("<media-id>", "Media ID")
	.addHelpText(
		"after",
		`
Permanently deletes a media file. This cannot be undone.

Examples:
  wahlu media delete mid-abc123`,
	)
	.action(async function (this: Command, mediaId: string) {
		const brandId = resolveBrandId(this);
		const client = new WahluClient(getApiKey(), getApiUrl());
		await client.delete(`/brands/${brandId}/media/${mediaId}`);
		console.log(`Media ${mediaId} deleted.`);
	});
