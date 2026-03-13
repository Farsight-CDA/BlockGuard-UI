import type { VPNConnectionStatus } from '$lib/vpn/types';
import {
	ConnectVPN,
	DisconnectVPN,
	GetConnectionStatus,
	MTLSFetch,
	SoftEtherStatus
} from '$lib/wailsjs/go/main/App';

type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'HEAD'
	| 'OPTIONS';

export type VPNClientStatus = 'Offline' | 'Running';

export interface NativeAPIs {
	loadFile(path: string): Promise<string | null>;
	saveFile(path: string, content: string): Promise<void>;
	clearFile(path: string): Promise<void>;
	mtlsFetch<T>(
		method: HttpMethod,
		url: string,
		body: string,
		csr: string,
		privateKey: string
	): Promise<T>;
	getVPNClientStatus(): Promise<VPNClientStatus>;
	connectVPN(host: string, username: string, password: string): Promise<void>;
	disconnectVPN(): Promise<void>;
	getConnectionStatus(): Promise<VPNConnectionStatus>;
	copyToClipboard(text: string): Promise<void>;
	pasteFromClipboard(): Promise<String>;
}

export var NATIVE_API: NativeAPIs = null!;

export var initializeNativeAPI: () => Promise<boolean> = () =>
	Promise.reject('Not Implemented');

export function setNativeAPIInitializer(
	getNativeAPI: () => Promise<NativeAPIs>
) {
	initializeNativeAPI = async () => {
		NATIVE_API = await getNativeAPI();
		return true;
	};
}

setNativeAPIInitializer(async () => {
	return {
		loadFile: (path) => Promise.resolve(localStorage.getItem(path)),
		saveFile: (path, content) =>
			Promise.resolve(localStorage.setItem(path, content)),
		clearFile: (path) => Promise.resolve(localStorage.removeItem(path)),
		mtlsFetch: (method, url, body, csr, privateKey) => Promise.resolve(null!),
		getVPNClientStatus: () => Promise.resolve('Running'),
		connectVPN: (host, username, password) => Promise.resolve(),
		disconnectVPN: () => Promise.resolve(),
		getConnectionStatus: () =>
			Promise.resolve({
				status: 'Offline',
				incomingBytes: 0,
				outgoingBytes: 0
			}),
		copyToClipboard: async (string) =>
			Promise.resolve(await window.navigator.clipboard.writeText(string)),
		pasteFromClipboard: () =>
			Promise.resolve(window.navigator.clipboard.readText())
	} satisfies NativeAPIs;
});

setNativeAPIInitializer(async () => {
	if (!Object.hasOwn(window, 'go')) {
		window.location.href = '/';
		throw Error('Missing window.go');
	}

	return Promise.resolve({
		loadFile: (path) => Promise.resolve(localStorage.getItem(path)),
		saveFile: (path, content) =>
			Promise.resolve(localStorage.setItem(path, content)),
		clearFile: (path) => Promise.resolve(localStorage.removeItem(path)),
		mtlsFetch: async <T>(
			method: HttpMethod,
			url: string,
			body: string,
			csr: string,
			privateKey: string
		) => {
			const res = await MTLSFetch(method, url, body, csr, privateKey);

			if (!res.success) {
				console.log(res);
				throw Error(`MTLS Fetch failed: StatusCode ${res.statusCode}`);
			}

			try {
				return JSON.parse(res.body) as T;
			} catch (error) {
				return res as T; //T better be string
			}
		},
		getVPNClientStatus: async () =>
			(await SoftEtherStatus()) as VPNClientStatus,
		connectVPN: async (host, username, password) =>
			await ConnectVPN(host, username, password),
		disconnectVPN: async () => await DisconnectVPN(),
		getConnectionStatus: async () =>
			(await GetConnectionStatus()) as VPNConnectionStatus,
		copyToClipboard: async (string) =>
			Promise.resolve(await window.navigator.clipboard.writeText(string)),
		pasteFromClipboard: () =>
			Promise.resolve(window.navigator.clipboard.readText())
	} satisfies NativeAPIs);
});
