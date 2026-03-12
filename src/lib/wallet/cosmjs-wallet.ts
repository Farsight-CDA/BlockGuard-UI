import {
	useGlobalConfig,
	type GlobalConfig
} from '$lib/configuration/configuration';
import { NATIVE_API } from '$lib/native-api/native-api';
import { TxTypeUrl, getAkashTypeRegistry } from '$lib/registry/registry';
import type { SDL } from '$lib/sdl/copypasta';
import {
	DeploymentBid,
	DeploymentDetails,
	LeaseDetails,
	ProviderDetails,
	ProviderLeaseStatus
} from '$lib/types/types';
import type { HdPath, Secp256k1Keypair } from '@cosmjs/crypto';
import { Slip10RawIndex } from '@cosmjs/crypto';
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing';
import { SigningStargateClient } from '@cosmjs/stargate';
import { BroadcastTxError } from '@cosmjs/stargate/build/stargateclient';
import { Semaphore } from 'semaphore-promise';
import {
	get,
	writable,
	type Readable,
	type Unsubscriber,
	type Writable
} from 'svelte/store';
import {
	getAkashRpcError,
	getWalletErrorMessage,
	wrapAkashRpcConnectionError
} from './errors';
import type { CertificateInfo, CreateDeploymentMsg, Wallet } from './types';

const DEFAULT_AKASH_REST_URL = 'https://akash-rest.publicnode.com/';
const DEFAULT_AVERAGE_BLOCK_TIME_SECONDS = 6;
const KNOWN_REST_URLS: Record<string, string> = {
	'rpc-akash.ecostake.com': 'https://rest-akash.ecostake.com/',
	'akash-rpc.polkachu.com': 'https://akash-api.polkachu.com/',
	'akash-rpc.kleomedes.network': 'https://akash-api.kleomedes.network/',
	'akash-mainnet-rpc.cosmonautstakes.com':
		'https://akash-mainnet-rest.cosmonautstakes.com/',
	'akash-rpc.w3coins.io': 'https://akash-api.w3coins.io/',
	'akash-rpc.publicnode.com': DEFAULT_AKASH_REST_URL,
	'akash.rpc.arcturian.tech': 'https://akash.api.arcturian.tech/',
	'akash.api.pocket.network': 'https://akash.api.pocket.network/'
};

interface StoredWallet {
	mnemonics: string;
	certificate: string | null;
}

export class CosmJSWallet implements Wallet {
	private wallet: DirectSecp256k1HdWallet;
	private address: string = null!;

	private msgClient: SigningStargateClient = null!;
	private rpcUrl: string;
	private connectedRpcUrl: string | null = null;

	public certificate: Writable<CertificateInfo | null> =
		writable<CertificateInfo | null>(null);
	private _certificate: CertificateInfo | null;
	public balance: Writable<number> = writable(0);
	public rpcError: Writable<string | null> = writable(null);

	public averageBlockTime: Writable<number> = writable(
		DEFAULT_AVERAGE_BLOCK_TIME_SECONDS
	);

	public deployments: Writable<DeploymentDetails[]> = writable([]);
	public leases: Writable<LeaseDetails[]> = writable([]);

	public gasPrice: Writable<number> = writable(0.0000001);

	private blockTimestampCache: Map<number, Date> = new Map();
	private providerDetailsCache: Map<string, ProviderDetails> = new Map();

	private txSemaphore: Semaphore = new Semaphore(1);

	private initialized: boolean = false;
	private refreshTimeout: NodeJS.Timeout = setInterval(
		this.refresh.bind(this),
		12000
	);
	private refreshAverageBlockTimeTimeout: NodeJS.Timeout = setInterval(
		this.refreshAverageBlockTime.bind(this),
		600000
	);

	private configUnsubscribe: Unsubscriber;

	constructor(
		wallet: DirectSecp256k1HdWallet,
		certificate: CertificateInfo | null,
		globalConfig: Readable<GlobalConfig>
	) {
		this.wallet = wallet;

		this._certificate = certificate;
		this.certificate.set(certificate);

		const currentRPCUrl = get(globalConfig)?.rpcUrl;
		if (currentRPCUrl == null) {
			throw Error('GLOBAL_CONFIG must be initialized before Wallet');
		}
		this.rpcUrl = currentRPCUrl;

		this.configUnsubscribe = globalConfig.subscribe((config) => {
			if (config == null) {
				throw Error('GLOBAL_CONFIG must be initialized before Wallet');
			}

			const rpcUrlChanged = this.rpcUrl !== config.rpcUrl;
			this.rpcUrl = config.rpcUrl;

			if (!this.initialized || !rpcUrlChanged) {
				return;
			}

			void this.reconnectClients();
		});
	}

	//Getters

	getAddress(): string {
		return this.address;
	}

	getMnemonic(): string {
		return this.wallet.mnemonic;
	}

	private bytesToHex(bytes: Uint8Array): string {
		const hex = [];
		for (let i = 0; i < bytes.length; i++) {
			const currentByte = bytes[i].toString(16).padStart(2, '0'); // Pad with zeros
			hex.push(currentByte);
		}
		return hex.join('');
	}

	async getVPNCredentials(
		index: number
	): Promise<{ username: string; password: string }> {
		const path: HdPath = [
			Slip10RawIndex.hardened(44),
			Slip10RawIndex.hardened(1),
			Slip10RawIndex.normal(index),
			Slip10RawIndex.normal(69 + index)
		];
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const keypair: Secp256k1Keypair = await this.wallet.getKeyPair(path);

		return {
			username: this.bytesToHex(keypair.pubkey),
			password: this.bytesToHex(keypair.privkey)
		};
	}

	async getBlockTimestamp(height: number): Promise<Date> {
		const normalizedHeight = Math.trunc(height);

		if (normalizedHeight <= 0) {
			throw Error(`Block height must be greater than 0, got ${height}`);
		}

		var date = this.blockTimestampCache.get(normalizedHeight);

		if (date != null) {
			return date;
		}

		const block = await this.msgClient.getBlock(normalizedHeight);
		date = new Date(block.header.time);
		this.blockTimestampCache.set(normalizedHeight, date);
		setTimeout(() => this.blockTimestampCache.delete(normalizedHeight), 300000);
		return date;
	}

	async getDeploymentBids(dseq: number): Promise<DeploymentBid[]> {
		const res = await this.fetchAkashRestJson<{ bids: { bid?: any }[] }>(
			`akash/market/v1beta5/bids/list?filters.owner=${encodeURIComponent(this.address)}&filters.dseq=${dseq}&filters.state=open`
		);

		return (res.bids ?? []).map((bid) => DeploymentBid.fromBidResponse(bid));
	}

	async getProviderDetails(provider: string): Promise<ProviderDetails> {
		var details = this.providerDetailsCache.get(provider);

		if (details != null) {
			return details;
		}

		const res = await this.fetchAkashRestJson<{ provider?: any }>(
			`akash/provider/v1beta4/providers/${encodeURIComponent(provider)}`
		);

		details = ProviderDetails.fromProvider(res.provider ?? {});
		this.providerDetailsCache.set(provider, details);
		setTimeout(() => this.providerDetailsCache.delete(provider), 300000);
		return details;
	}

	//Transactions

	async broadcastCertificate(csr: string, publicKey: string): Promise<void> {
		const encoder = new TextEncoder();

		await this.sendTx(TxTypeUrl.MsgCreateCertificate, {
			owner: this.address,
			cert: encoder.encode(csr),
			pubkey: encoder.encode(publicKey)
		});
	}

	async createDeployment(msg: CreateDeploymentMsg): Promise<void> {
		await this.sendTx(TxTypeUrl.MsgCreateDeployment, msg);
	}

	async closeDeployment(dseq: number): Promise<void> {
		await this.sendTx(TxTypeUrl.MsgCloseDeployment, {
			id: {
				owner: this.address,
				dseq: dseq
			}
		});
	}

	async createLease(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string,
		bseq: number
	): Promise<void> {
		await this.sendTx(TxTypeUrl.MsgCreateLease, {
			bidId: {
				dseq: dseq,
				gseq: gseq,
				oseq: oseq,
				provider: provider,
				owner: this.address,
				bseq: bseq
			}
		});
	}

	// Provider

	async submitManifest(
		dseq: number,
		provider: string,
		sdl: SDL
	): Promise<void> {
		const providerDetails = await this.getProviderDetails(provider);

		await NATIVE_API.mtlsFetch(
			'PUT',
			new URL(`deployment/${dseq}/manifest`, providerDetails.hostUri).href,
			sdl.manifestSortedJSON(),
			this._certificate!.csr,
			this._certificate!.privkey
		);
	}

	async getProviderLeaseStatus(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string
	): Promise<ProviderLeaseStatus> {
		const providerDetails = await this.getProviderDetails(provider);

		const response = await NATIVE_API.mtlsFetch<ProviderLeaseStatusResponse>(
			'GET',
			new URL(`lease/${dseq}/${gseq}/${oseq}/status`, providerDetails.hostUri)
				.href,
			'',
			this._certificate!.csr,
			this._certificate!.privkey
		);

		return ProviderLeaseStatus.fromResponse(response);
	}

	//Internal

	setCertificate(certificate: CertificateInfo) {
		this.certificate.set(certificate);
		this._certificate = certificate;
	}

	private async loadCurrentBalance(): Promise<number> {
		return (
			parseInt((await this.msgClient.getBalance(this.address, 'uakt')).amount) /
			1000000
		);
	}

	private async loadAverageBlockTime(): Promise<number> {
		const height = await this.msgClient.getHeight();
		const fallbackAverageBlockTime =
			get(this.averageBlockTime) || DEFAULT_AVERAGE_BLOCK_TIME_SECONDS;

		if (height <= 1) {
			return fallbackAverageBlockTime;
		}

		const sampleHeight = Math.max(1, height - 1000);
		const sampledBlockCount = height - sampleHeight;

		if (sampledBlockCount <= 0) {
			return fallbackAverageBlockTime;
		}

		const currentBlockTimestamp = await this.getBlockTimestamp(height);
		const oldBlockTimestamp = await this.getBlockTimestamp(sampleHeight);
		const sampledTimespan =
			(currentBlockTimestamp.getTime() - oldBlockTimestamp.getTime()) / 1000;

		if (sampledTimespan <= 0) {
			return fallbackAverageBlockTime;
		}

		return sampledTimespan / sampledBlockCount;
	}

	private async loadCurrentDeployments(): Promise<{ deployment?: any }[]> {
		const res = await this.fetchAkashRestJson<{
			deployments: { deployment?: any }[];
		}>(
			`akash/deployment/v1beta4/deployments/list?filters.owner=${encodeURIComponent(this.address)}&filters.state=active`
		);
		return res.deployments ?? [];
	}

	private async loadCurrentLeases(): Promise<{ lease?: any }[]> {
		const res = await this.fetchAkashRestJson<{ leases: { lease?: any }[] }>(
			`akash/market/v1beta5/leases/list?filters.owner=${encodeURIComponent(this.address)}&filters.state=active`
		);
		return res.leases ?? [];
	}

	private async loadLeaseDetails(lease: {
		lease?: any;
	}): Promise<LeaseDetails> {
		const leaseId = lease.lease?.id ?? lease.lease?.leaseId;
		const providerDetails = await this.getProviderDetails(
			leaseId?.provider ?? ''
		);

		const providerStatus = await this.getProviderLeaseStatus(
			parseInt(`${leaseId?.dseq ?? 0}`, 10),
			parseInt(`${leaseId?.gseq ?? 0}`, 10),
			parseInt(`${leaseId?.oseq ?? 0}`, 10),
			leaseId?.provider ?? ''
		).catch(() => null);

		return LeaseDetails.fromLeaseResponse(
			lease,
			providerDetails,
			providerStatus
		);
	}

	private async sendTx(
		type: TxTypeUrl,
		messageBody: any,
		gasMultiplication: number = 1.35
	) {
		const message = {
			typeUrl: type,
			value: messageBody
		};
		const memo = 'BlockGuard';

		try {
			for (let i = 0; i < 3; i++) {
				const check = await this.trySendTx(
					type,
					messageBody,
					gasMultiplication
				);
				if (check) {
					return;
				}
			}
		} catch (error) {
			console.error(`TX Failed: ${error}`);
			throw error;
		}
	}

	private async trySendTx(
		type: TxTypeUrl,
		messageBody: any,
		gasMultiplication: number
	) {
		const message = {
			typeUrl: type,
			value: messageBody
		};

		const release = await this.txSemaphore.acquire();

		const memo = 'BlockGuard';
		const gas = await this.msgClient.simulate(this.address, [message], memo);

		try {
			await this.msgClient.signAndBroadcast(
				this.address,
				[message],
				{
					amount: [
						{
							denom: 'uakt',
							amount: `${Math.ceil(
								get(this.gasPrice) * gas * gasMultiplication
							)}`
						}
					],
					gas: `${Math.floor(gas * gasMultiplication)}`
				},
				memo
			);
			return true;
		} catch (error) {
			if (!(error instanceof BroadcastTxError) || error.code != 13) {
				throw error;
			}
			const match = error.message.match(/required: (\d+)uakt/);

			if (match === null) {
				throw error;
			}

			this.gasPrice.set((1.0001 * parseFloat(match[1])) / gas);
			return false; // Failure
		} finally {
			await new Promise((resolve) => setTimeout(resolve, 300));
			release();
		}
	}

	//Lifetime

	async initialize(): Promise<void> {
		this.address = (await this.wallet.getAccounts())[0].address;
		await this.initializeClients();
		this.initialized = true;
		await this.refresh();
		await this.refreshAverageBlockTime();
	}

	async initializeClients() {
		try {
			const msgClient = await SigningStargateClient.connectWithSigner(
				this.rpcUrl,
				this.wallet,
				{
					registry: new Registry(getAkashTypeRegistry())
				}
			);

			this.msgClient = msgClient;
			this.connectedRpcUrl = this.rpcUrl;
		} catch (error) {
			throw wrapAkashRpcConnectionError(this.rpcUrl, error);
		}
	}

	private async reconnectClients() {
		try {
			await this.initializeClients();
			await this.refresh();
			await this.refreshAverageBlockTime();
		} catch (error) {
			this.handleWalletLoadError(error);
		}
	}

	async refresh() {
		if (!this.initialized || this.connectedRpcUrl != this.rpcUrl) {
			return;
		}

		try {
			const newBalance = await this.loadCurrentBalance();
			this.balance.set(newBalance);

			const newDeployments = await this.loadCurrentDeployments();
			this.deployments.set(
				newDeployments.map((d) => DeploymentDetails.fromDeploymentResponse(d))
			);

			const newLeases = await this.loadCurrentLeases();
			this.leases.set(
				await Promise.all(newLeases.map((x) => this.loadLeaseDetails(x)))
			);
			this.rpcError.set(null);
		} catch (error) {
			this.handleWalletLoadError(error);
		}
	}

	async refreshAverageBlockTime() {
		if (!this.initialized || this.connectedRpcUrl != this.rpcUrl) {
			return;
		}

		try {
			const newAverageBlockTime = await this.loadAverageBlockTime();
			this.averageBlockTime.set(newAverageBlockTime);
		} catch (error) {
			this.handleWalletLoadError(error, false);
		}
	}

	private handleWalletLoadError(error: unknown, clearData: boolean = true) {
		const akashRpcError = getAkashRpcError(this.rpcUrl, error);
		const walletError = akashRpcError ?? error;

		if (clearData) {
			this.deployments.set([]);
			this.leases.set([]);
		}

		this.rpcError.set(getWalletErrorMessage(walletError));
		console.error('Failed to refresh cosmjs-wallet.', walletError);
	}

	private async fetchAkashRestJson<T>(path: string): Promise<T> {
		const response = await fetch(new URL(path, this.getRestUrl()).toString());

		if (!response.ok) {
			throw Error(
				`REST query failed with (${response.status}): ${await response.text()}`
			);
		}

		return (await response.json()) as T;
	}

	private getRestUrl() {
		try {
			const rpc = new URL(this.rpcUrl);
			return KNOWN_REST_URLS[rpc.hostname] ?? DEFAULT_AKASH_REST_URL;
		} catch {
			return DEFAULT_AKASH_REST_URL;
		}
	}

	dispose() {
		clearInterval(this.refreshTimeout);
		clearInterval(this.refreshAverageBlockTimeTimeout);
		this.configUnsubscribe();
	}

	//Serialization

	async serialize() {
		const storedWallet = {
			mnemonics: this.wallet.mnemonic,
			certificate:
				this._certificate != null
					? (JSON.stringify(this._certificate) as string)
					: null
		} satisfies StoredWallet;

		return JSON.stringify(storedWallet);
	}

	static async deserialize(content: string) {
		const storedWallet = JSON.parse(content) as StoredWallet;

		const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(
			storedWallet.mnemonics,
			{
				prefix: 'akash'
			}
		);
		const certificate =
			storedWallet.certificate != null
				? (JSON.parse(storedWallet.certificate) as CertificateInfo)
				: null;

		const cosmJsWallet = new CosmJSWallet(
			hdWallet,
			certificate,
			useGlobalConfig()
		);
		await cosmJsWallet.initialize();
		return cosmJsWallet;
	}
}
