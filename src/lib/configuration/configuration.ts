import { writable } from "svelte/store";

export interface GlobalConfig {

}

const CONFIG_STORAGE_FILE = "config.json";

export const WALLET = writable<GlobalConfig | null>(null);

//Tries to load config from storage, if not found does nothing
export async function initializeGlobalConfig() {
    return true;
}