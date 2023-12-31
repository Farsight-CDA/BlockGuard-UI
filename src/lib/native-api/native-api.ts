import type { VPNConnectionStatus } from '$lib/vpn/types';
import type { HttpMethod } from '@sveltejs/kit';

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
