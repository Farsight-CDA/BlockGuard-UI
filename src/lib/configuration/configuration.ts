import { goto } from '$app/navigation';
import { NATIVE_API } from '$lib/native-api/native-api';
import { get, writable } from 'svelte/store';

export interface GlobalConfig {
	useBubbleMode: boolean;
	useAdvancedMode: boolean;
	rpcUrl: string;
}

const CONFIG_STORAGE_FILE = 'config.json';
export const DEFAULT_RPC_URL = 'https://akash-rpc.publicnode.com/';

var GLOBAL_CONFIG: ReturnType<typeof createGlobalConfig> | null;

export function useGlobalConfig() {
	if (GLOBAL_CONFIG == null) {
		throw Error('GLOBAL_CONFIG not initialized');
	}

	return GLOBAL_CONFIG!;
}

//Tries to load config from storage, if not found does nothing
export async function initializeGlobalConfig() {
	GLOBAL_CONFIG = createGlobalConfig();

	try {
		await GLOBAL_CONFIG.initialize();
	} catch (error) {
		return false;
	}

	return true;
}

function createGlobalConfig() {
	const { subscribe, set, update } = writable<GlobalConfig>(null!);

	async function initialize() {
		const gcJson = await NATIVE_API.loadFile(CONFIG_STORAGE_FILE);
		set(normalizeGlobalConfig(gcJson == null ? DEFAULT_GLOBAL_CONFIG : JSON.parse(gcJson)));
	}

	async function setAdvancedMode(useAdvancedMode: boolean) {
		var requiresReload: boolean = false;

		update((prev) => {
			if (prev.useAdvancedMode == useAdvancedMode) {
				return prev;
			}

			prev.useAdvancedMode = useAdvancedMode;
			requiresReload = true;
			return prev;
		});

		if (requiresReload) {
			await store();
			await goto('/');
		}
	}

	async function setBubbleMode(useBubbleMode: boolean) {
		var requiresReload: boolean = false;

		update((prev) => {
			if (prev.useBubbleMode == useBubbleMode) {
				return prev;
			}

			prev.useBubbleMode = useBubbleMode;
			requiresReload = true;
			return prev;
		});

		if (requiresReload) {
			await store();
			await goto('/');
		}
	}

	async function setRpcUrl(rpcUrl: string) {
		const normalizedRpcUrl = normalizeRpcUrl(rpcUrl);
		let didChange = false;

		update((prev) => {
			if (prev.rpcUrl == normalizedRpcUrl) {
				return prev;
			}

			didChange = true;
			return {
				...prev,
				rpcUrl: normalizedRpcUrl
			};
		});

		if (didChange) {
			await store();
		}

		return normalizedRpcUrl;
	}

	async function resetRpcUrl() {
		return await setRpcUrl(DEFAULT_RPC_URL);
	}

	async function store() {
		await NATIVE_API.saveFile(
			CONFIG_STORAGE_FILE,
			JSON.stringify(get({ subscribe }))
		);
	}

	return {
		subscribe,
		setAdvancedMode,
		setBubbleMode,
		setRpcUrl,
		resetRpcUrl,
		initialize
	};
}

const DEFAULT_GLOBAL_CONFIG = {
	useAdvancedMode: true,
	useBubbleMode: false,
	rpcUrl: DEFAULT_RPC_URL
} satisfies GlobalConfig;

function normalizeGlobalConfig(config: Partial<GlobalConfig>): GlobalConfig {
	return {
		useAdvancedMode: config.useAdvancedMode ?? DEFAULT_GLOBAL_CONFIG.useAdvancedMode,
		useBubbleMode: config.useBubbleMode ?? DEFAULT_GLOBAL_CONFIG.useBubbleMode,
		rpcUrl: normalizeRpcUrl(config.rpcUrl ?? DEFAULT_GLOBAL_CONFIG.rpcUrl)
	};
}

function normalizeRpcUrl(rpcUrl: string): string {
	const trimmedRpcUrl = rpcUrl.trim();

	if (trimmedRpcUrl.length == 0) {
		throw Error('RPC URL is required.');
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedRpcUrl);
	} catch {
		throw Error('RPC URL must be a valid absolute URL.');
	}

	if (parsedUrl.protocol != 'http:' && parsedUrl.protocol != 'https:') {
		throw Error('RPC URL must start with http:// or https://.');
	}

	parsedUrl.hash = '';
	parsedUrl.search = '';

	if (parsedUrl.pathname == '') {
		parsedUrl.pathname = '/';
	}

	return parsedUrl.toString();
}
