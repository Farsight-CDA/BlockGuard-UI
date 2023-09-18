import type { HttpMethod } from '@sveltejs/kit';
import { writable } from 'svelte/store';

export interface NativeAPIs {
	loadFile(path: string): Promise<string | null>;
	saveFile(path: string, content: string): Promise<void>;
	mtlsFetch<T>(
		method: HttpMethod,
		url: string,
		body: any,
		csr: string,
		privateKey: string
	): Promise<T>;
}

export var NATIVE_API: NativeAPIs = null!;

export var initializeNativeAPI = async () => {
	NATIVE_API = {
		loadFile: (path) => Promise.resolve(localStorage.getItem(path)),
		saveFile: (path, content) => Promise.resolve(localStorage.setItem(path, content)),
		mtlsFetch: async (method, url, body, csr, privateKey) => null!
	};

	return true;
};
