import { NATIVE_API } from '$lib/native-api/native-api';
import { writable, type Writable } from 'svelte/store';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

import type { pems } from '@playwo/akashjs/build/certificates';
import { CosmJSWallet } from './cosmjs-wallet';
import type { Certificate } from '@playwo/akashjs/build/protobuf/akash/cert/v1beta3/cert';
import type { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
import type {
	DeploymentDetails,
	DeploymentBid,
	ProviderDetails,
	LeaseDetails
} from '$lib/types/types';

//Necessary for type registrations!
import cert from '@playwo/akashjs/build/protobuf/akash/cert/v1beta3/cert';
import deply from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment';
import type { SDL } from '@playwo/akashjs/build/sdl';

export interface Wallet {
	getAddress(): string;
	getMnemonic(): string;

	getBlockTimestamp(height: number): Promise<Date>;
	getDeploymentBids(dseq: number): Promise<DeploymentBid[]>;
	getProviderDetails(provider: string): Promise<ProviderDetails>;

	certificate: Writable<CertificateInfo | null>;
	balance: Writable<number>;

	deployments: Writable<DeploymentDetails[]>;
	leases: Writable<LeaseDetails[]>;

	broadcastCertificate(csr: string, publicKey: string): Promise<void>;
	createDeplyoment(msg: MsgCreateDeployment): Promise<void>;
	closeDeployment(dseq: number): Promise<void>;
	createLease(dseq: number, gseq: number, oseq: number, provider: string): Promise<void>;
	submitManifest(dseq: number, provider: string, sdl: SDL): Promise<boolean>;
}
export interface CertificateInfo {
	csr: string;
	pubkey: string;
	privkey: string;
}

const WALLET_STORAGE_FILE = 'wallet.json';

export const WALLET = writable<Wallet | null>(null);
var wallet: CosmJSWallet | null = null;

//Tries to load wallet from storage, if not found does nothing
export async function initializeWallet() {
	const content = await NATIVE_API.loadFile(WALLET_STORAGE_FILE);

	if (content == null) {
		return;
	}

	const cosmJSWallet = await CosmJSWallet.deserialize(content);

	WALLET.set(cosmJSWallet);
	wallet = cosmJSWallet;

	return true;
}

export function disposeWallet() {
	wallet?.dispose();

	WALLET.set(null);
	wallet = null;
}

async function storeCurrentWallet() {
	if (wallet == null) {
		throw 'Failed to save wallet, none is currently set!';
	}

	const encodedWallet = await wallet.serialize();
	NATIVE_API.saveFile(WALLET_STORAGE_FILE, encodedWallet);
}

export async function setNewWallet(mnemonic: string) {
	const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'akash' });
	const cosmJSWallet = new CosmJSWallet(hdWallet, 'https://akash-rpc.polkachu.com:443', null);
	await cosmJSWallet.initialize();

	WALLET.set(cosmJSWallet);
	wallet = cosmJSWallet;
	await storeCurrentWallet();
}

export async function setNewCertificate(csr: string, pubkey: string, privkey: string) {
	wallet?.setCertificate({
		csr: csr,
		pubkey: pubkey,
		privkey: privkey
	});

	await storeCurrentWallet();
}

export async function generateMnemonics() {
	return (await DirectSecp256k1HdWallet.generate(24)).mnemonic;
}
