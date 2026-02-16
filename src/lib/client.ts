export interface ApiResponse<T> {
	success: boolean;
	data: T;
	error?: { code: string; message: string };
}

export interface PaginatedResponse<T> {
	success: boolean;
	data: T[];
	pagination: { page: number; limit: number; has_more: boolean };
	error?: { code: string; message: string };
}

export class WahluClient {
	private baseUrl: string;
	private apiKey: string;

	constructor(apiKey: string, baseUrl = "https://api.wahlu.com") {
		this.apiKey = apiKey;
		this.baseUrl = baseUrl.replace(/\/$/, "");
	}

	private async request<T>(
		method: string,
		path: string,
		body?: Record<string, unknown>,
	): Promise<T> {
		const url = `${this.baseUrl}/v1${path}`;
		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.apiKey}`,
			"User-Agent": "wahlu-cli",
		};

		if (body) {
			headers["Content-Type"] = "application/json";
		}

		const res = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!res.ok) {
			const text = await res.text();
			let message: string;
			try {
				const json = JSON.parse(text);
				message = json.error?.message || json.message || `HTTP ${res.status}`;
			} catch {
				message = text || `HTTP ${res.status} ${res.statusText}`;
			}
			throw new CliError(message, res.status);
		}

		return res.json() as Promise<T>;
	}

	async get<T>(path: string): Promise<ApiResponse<T>> {
		return this.request<ApiResponse<T>>("GET", path);
	}

	async list<T>(
		path: string,
		page?: number,
		limit?: number,
	): Promise<PaginatedResponse<T>> {
		const params = new URLSearchParams();
		if (page !== undefined) params.set("page", String(page));
		if (limit !== undefined) params.set("limit", String(limit));
		const qs = params.toString();
		return this.request<PaginatedResponse<T>>(
			"GET",
			qs ? `${path}?${qs}` : path,
		);
	}

	async post<T>(
		path: string,
		body: Record<string, unknown>,
	): Promise<ApiResponse<T>> {
		return this.request<ApiResponse<T>>("POST", path, body);
	}

	async patch<T>(
		path: string,
		body: Record<string, unknown>,
	): Promise<ApiResponse<T>> {
		return this.request<ApiResponse<T>>("PATCH", path, body);
	}

	async delete<T>(path: string): Promise<ApiResponse<T>> {
		return this.request<ApiResponse<T>>("DELETE", path);
	}
}

export class CliError extends Error {
	status?: number;
	constructor(message: string, status?: number) {
		super(message);
		this.name = "CliError";
		this.status = status;
	}
}
