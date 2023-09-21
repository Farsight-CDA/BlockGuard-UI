import { NATIVE_API } from '$lib/native-api/native-api';
import { writable } from 'svelte/store';

export interface GlobalConfig {
	useAdvancedMode: boolean;
	rpcUrl: string;
}

const CONFIG_STORAGE_FILE = 'config.json';

export const GLOBAL_CONFIG = writable<GlobalConfig | null>(null);

//Tries to load config from storage, if not found does nothing
export async function initializeGlobalConfig() {
	const globalConfigJson = await NATIVE_API.loadFile(CONFIG_STORAGE_FILE);

	GLOBAL_CONFIG.set(
		globalConfigJson == null
			? DEFAULT_GLOBAL_CONFIG
			: JSON.parse(globalConfigJson)
	);

	return true;
}

const DEFAULT_GLOBAL_CONFIG = {
	useAdvancedMode: true,
	rpcUrl: 'https://rpc-akash.ecostake.com:443'
} satisfies GlobalConfig;
