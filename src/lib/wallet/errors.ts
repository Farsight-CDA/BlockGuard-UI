export type AkashRpcErrorKind = 'unreachable' | 'invalid' | 'unknown';

export class AkashRpcEndpointError extends Error {
	readonly rpcUrl: string;
	readonly kind: AkashRpcErrorKind;
	readonly cause: unknown;

	constructor(rpcUrl: string, kind: AkashRpcErrorKind, cause?: unknown) {
		super(`Unable to use the configured Akash RPC endpoint (${rpcUrl}).`);
		this.name = 'AkashRpcEndpointError';
		this.rpcUrl = rpcUrl;
		this.kind = kind;
		this.cause = cause;
	}
}

export function getAkashRpcError(
	rpcUrl: string,
	error: unknown
): AkashRpcEndpointError | null {
	if (error instanceof AkashRpcEndpointError) {
		return error;
	}

	const message = getErrorText(error).toLowerCase();

	if (
		message.includes('unknown query path: unknown request') ||
		message.includes('query failed with (6)') ||
		message.includes('unknown request')
	) {
		return new AkashRpcEndpointError(rpcUrl, 'invalid', error);
	}

	if (
		message.includes('fetch failed') ||
		message.includes('connection refused') ||
		message.includes('networkerror') ||
		message.includes('failed to fetch') ||
		message.includes('timeout')
	) {
		return new AkashRpcEndpointError(rpcUrl, 'unreachable', error);
	}

	return null;
}

export function wrapAkashRpcConnectionError(
	rpcUrl: string,
	error: unknown
): AkashRpcEndpointError {
	return (
		getAkashRpcError(rpcUrl, error) ??
		new AkashRpcEndpointError(rpcUrl, 'unknown', error)
	);
}

export function getWalletErrorMessage(error: unknown): string {
	if (error instanceof AkashRpcEndpointError) {
		if (error.kind == 'invalid') {
			return `The configured Akash RPC endpoint (${error.rpcUrl}) responded, but it does not support the Akash queries BlockGuard needs. Please switch to a working Akash RPC URL.`;
		}

		if (error.kind == 'unreachable') {
			return `Unable to reach the configured Akash RPC endpoint (${error.rpcUrl}). The endpoint appears to be down right now, so BlockGuard cannot load wallet data. Please try again later or switch to another RPC URL.`;
		}

		return `BlockGuard cannot use the configured Akash RPC endpoint (${error.rpcUrl}). Please try again later or switch to another RPC URL.`;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return `${error}`;
}

function getErrorText(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return `${error}`;
}
