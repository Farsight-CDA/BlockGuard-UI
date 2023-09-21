import { NATIVE_API } from '$lib/native-api/native-api';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { writable, type Invalidator, type Subscriber } from 'svelte/store';
import { CosmJSWallet } from './cosmjs-wallet';

//Necessary for type registrations!
import type { Wallet } from './types';
import { GLOBAL_CONFIG } from '$lib/configuration/configuration';

const WALLET_STORAGE_FILE = 'wallet.json';

var WALLET: ReturnType<typeof createWalletStore> = null!;

export function useRequiredWallet() {
	return {
		...WALLET,
		subscribe: (
			run: Subscriber<Wallet>,
			invalidate?: Invalidator<Wallet> | undefined
		) => {
			if (WALLET == null) {
				throw Error('Wallet not initialized');
			}

			return WALLET.subscribe(
				(wallet) => {
					if (wallet == null) {
						throw Error('Wallet required but not set');
					}
					run(wallet!);
				},
				(wallet) => {
					if (wallet == null) {
						throw Error('Wallet required but not set');
					}
					invalidate?.(wallet!);
				}
			);
		}
	};
}

export function useOptionalWallet() {
	return WALLET;
}

export async function initializeWalletStore() {
	WALLET = createWalletStore();
	return await WALLET.initialize();
}

function createWalletStore() {
	const { subscribe, set } = writable<Wallet | null>(
		null,
		() => () => dispose()
	);
	var wallet: CosmJSWallet | null = null;

	async function initialize() {
		const content = await NATIVE_API.loadFile(WALLET_STORAGE_FILE);

		if (content == null) {
			return false;
		}

		const cosmJSWallet = await CosmJSWallet.deserialize(content);

		set(cosmJSWallet);
		wallet = cosmJSWallet;

		return true;
	}

	function dispose() {
		wallet?.dispose();

		set(null);
		wallet = null;
	}

	async function create(mnemonic: string) {
		const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
			prefix: 'akash'
		});
		const cosmJSWallet = new CosmJSWallet(hdWallet, null);
		await cosmJSWallet.initialize();

		set(cosmJSWallet);
		wallet = cosmJSWallet;
		await store();
	}

	async function store() {
		if (wallet == null) {
			throw 'Failed to save wallet, none is currently set!';
		}

		const encodedWallet = await wallet.serialize();
		await NATIVE_API.saveFile(WALLET_STORAGE_FILE, encodedWallet);
	}

	async function clear() {
		if (wallet == null) {
			throw 'Failed to delete wallet, none is currently set!';
		}

		await NATIVE_API.clearFile(WALLET_STORAGE_FILE);
		dispose();
	}

	async function setCertificate(csr: string, pubkey: string, privkey: string) {
		wallet?.setCertificate({
			csr: csr,
			pubkey: pubkey,
			privkey: privkey
		});

		await store();
	}

	return {
		subscribe,
		setCertificate,
		create,
		initialize,
		dispose,
		clear
	};
}

export async function generateMnemonics() {
	return (await DirectSecp256k1HdWallet.generate(24)).mnemonic;
}
