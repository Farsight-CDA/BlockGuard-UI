import { NATIVE_API } from '$lib/native-api/native-api';
import { writable, type Writable } from 'svelte/store';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { CosmJSWallet } from './cosmjs-wallet';

//Necessary for type registrations!
import cert from '@playwo/akashjs/build/protobuf/akash/cert/v1beta3/cert';
import deply from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment';
import type { Wallet } from './types';

const WALLET_STORAGE_FILE = 'wallet.json';

export const WALLET = useWallet();

function useWallet() {
	const { subscribe, update, set } = writable<Wallet | null>(
		null,
		() => () => dispose()
	);
	var wallet: CosmJSWallet | null = null;

	async function initialize() {
		const content = await NATIVE_API.loadFile(WALLET_STORAGE_FILE);

		if (content == null) {
			return;
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
		const cosmJSWallet = new CosmJSWallet(
			hdWallet,
			'https://akash-rpc.polkachu.com:443',
			null
		);
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
