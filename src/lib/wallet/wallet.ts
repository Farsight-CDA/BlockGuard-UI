import { writable } from "svelte/store";

interface Wallet {
    getAddress(): string;
    getMnemonic(): string;
}

const WALLET_STORAGE_FILE = "wallet.json";

export const WALLET = writable<Wallet | null>(null);

//Tries to load wallet from storage, if not found does nothing
export function initializeWallet() {
    
}