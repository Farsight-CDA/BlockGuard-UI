import type { HttpMethod } from '@sveltejs/kit';
import { writable } from 'svelte/store';

export type VPNClientStatus = 'Offline' | 'Running';

export interface NativeAPIs {
	loadFile(path: string): Promise<string | null>;
	saveFile(path: string, content: string): Promise<void>;
	mtlsFetch<T>(
		method: HttpMethod,
		url: string,
		body: string,
		csr: string,
		privateKey: string
	): Promise<T>;
	vpnClientStatus(): Promise<VPNClientStatus>;
	connectVPN(host: string, username: string, password: string): Promise<void>;
}

export var NATIVE_API: NativeAPIs = null!;

export var initializeNativeAPI: () => Promise<boolean> = () => Promise.reject('Not Implemented');

export function setNativeAPIInitializer(getNativeAPI: () => Promise<NativeAPIs>) {
	initializeNativeAPI = async () => {
		NATIVE_API = await getNativeAPI();
		return true;
	};
}
