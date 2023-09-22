import { goto } from '$app/navigation';
import { NATIVE_API } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';

export interface GlobalConfig {
	useAdvancedMode: boolean;
	rpcUrl: string;
}

const CONFIG_STORAGE_FILE = 'config.json';

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
	var initialized = false;

	async function initialize() {
		const gcJson = await NATIVE_API.loadFile(CONFIG_STORAGE_FILE);
		set(gcJson == null ? DEFAULT_GLOBAL_CONFIG : JSON.parse(gcJson));
		initialized = true;
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
			await goto('/');
		}
	}

	return {
		subscribe,
		setAdvancedMode,
		initialize
	};
}

const DEFAULT_GLOBAL_CONFIG = {
	useAdvancedMode: true,
	rpcUrl: 'https://rpc-akash.ecostake.com:443'
} satisfies GlobalConfig;
