/**
 * Output formatting — JSON for machines, tables for humans.
 * Every command calls `output()` with data. The `--json` flag controls format.
 */

export function output(
	data: unknown,
	opts: { json?: boolean; columns?: Column[] } = {},
) {
	if (opts.json) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (opts.columns && Array.isArray(data)) {
		printTable(data as Record<string, unknown>[], opts.columns);
		return;
	}

	// Single object — print key/value pairs
	if (data && typeof data === "object" && !Array.isArray(data)) {
		const record = data as Record<string, unknown>;
		const maxKey = Math.max(...Object.keys(record).map((k) => k.length));
		for (const [key, value] of Object.entries(record)) {
			const display =
				value === null || value === undefined
					? "-"
					: typeof value === "object"
						? JSON.stringify(value)
						: String(value);
			console.log(`${key.padEnd(maxKey + 2)}${display}`);
		}
		return;
	}

	console.log(JSON.stringify(data, null, 2));
}

export interface Column {
	key: string;
	header: string;
	width?: number;
	transform?: (value: unknown) => string;
}

function printTable(rows: Record<string, unknown>[], columns: Column[]) {
	if (rows.length === 0) {
		console.log("No results.");
		return;
	}

	// Calculate column widths
	const widths = columns.map((col) => {
		const headerLen = col.header.length;
		const maxData = rows.reduce((max, row) => {
			const val = formatCell(row[col.key], col.transform);
			return Math.max(max, val.length);
		}, 0);
		return col.width || Math.min(Math.max(headerLen, maxData), 50);
	});

	// Header
	const header = columns
		.map((col, i) => col.header.padEnd(widths[i]))
		.join("  ");
	console.log(header);
	console.log(widths.map((w) => "─".repeat(w)).join("  "));

	// Rows
	for (const row of rows) {
		const line = columns
			.map((col, i) => {
				const val = formatCell(row[col.key], col.transform);
				return truncate(val, widths[i]).padEnd(widths[i]);
			})
			.join("  ");
		console.log(line);
	}
}

function formatCell(
	value: unknown,
	transform?: (value: unknown) => string,
): string {
	if (transform) return transform(value);
	if (value === null || value === undefined) return "-";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function truncate(str: string, max: number): string {
	if (str.length <= max) return str;
	return str.slice(0, max - 1) + "…";
}
