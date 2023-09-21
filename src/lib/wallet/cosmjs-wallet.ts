import { NATIVE_API } from '$lib/native-api/native-api';
import {
	DeploymentBid,
	DeploymentDetails,
	LeaseDetails,
	ProviderDetails,
	ProviderLeaseStatus
} from '$lib/types/types';
import { base64ToUInt, retry } from '$lib/utils/utils';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { MsgCreateCertificate } from '@playwo/akashjs/build/protobuf/akash/cert/v1beta1/cert';
import { Deployment_State } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment';
import {
	MsgCloseDeployment,
	type MsgCreateDeployment
} from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
import {
	QueryClientImpl as DeploymentQueryClient,
	QueryDeploymentResponse,
	QueryDeploymentsRequest
} from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query';
import { Bid_State } from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/bid';
import {
	Lease_State,
	MsgCreateLease
} from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/lease';
import {
	QueryClientImpl as MarketQueryClient,
	QueryBidsRequest,
	QueryLeaseResponse,
	QueryLeasesRequest
} from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/query';
import {
	QueryClientImpl as ProviderQueryClient,
	QueryProviderRequest
} from '@playwo/akashjs/build/protobuf/akash/provider/v1beta3/query';
import { getMsgClient, getQueryClient } from '@playwo/akashjs/build/rpc/index';
import type { SDL } from '@playwo/akashjs/build/sdl';
import { messages } from '@playwo/akashjs/build/stargate';
import type {
	ProtobufRpcClient,
	SigningStargateClient
} from '@playwo/akashjs/node_modules/@cosmjs/stargate';
import { toBase64 } from 'pvutils';
import { writable, type Writable } from 'svelte/store';
import type { CertificateInfo, Wallet } from './types';

interface StoredWallet {
	mnemonics: string;
	rpcEndpoint: string;
	certificate: string | null;
}

const GAS_PRICE = 2500 / 100000;

export class CosmJSWallet implements Wallet {
	private wallet: DirectSecp256k1HdWallet;
	private address: string;
	private rpcUrl: string;

	private msgClient: SigningStargateClient;
	private queryClient: ProtobufRpcClient;

	private initialized: boolean;
	private refreshTimeout: NodeJS.Timeout;

	public certificate: Writable<CertificateInfo | null>;
	private _certificate: CertificateInfo | null;
	public balance: Writable<number>;

	public deployments: Writable<DeploymentDetails[]>;
	public leases: Writable<LeaseDetails[]>;

	private blockTimestampCache: Map<number, Date>;
	private providerDetailsCache: Map<string, ProviderDetails>;

	constructor(
		wallet: DirectSecp256k1HdWallet,
		rpcUrl: string,
		certificate: CertificateInfo | null
	) {
		this.wallet = wallet;
		this.address = null!;
		this.rpcUrl = rpcUrl;

		this.msgClient = null!;
		this.queryClient = null!;
		this.initialized = false;

		this._certificate = certificate;
		this.certificate = writable<CertificateInfo | null>(certificate);
		this.balance = writable<number>(0);
		this.deployments = writable<DeploymentDetails[]>([]);
		this.leases = writable<LeaseDetails[]>([]);

		this.blockTimestampCache = new Map<number, Date>();
		this.providerDetailsCache = new Map<string, ProviderDetails>();

		this.refreshTimeout = setInterval(this.refresh.bind(this), 3000);
	}

	//Getters

	getAddress(): string {
		return this.address;
	}

	getMnemonic(): string {
		return this.wallet.mnemonic;
	}

	getRPCUrl(): string {
		return this.rpcUrl;
	}

	async getBlockTimestamp(height: number): Promise<Date> {
		var date = this.blockTimestampCache.get(height);

		if (date != null) {
			return date;
		}

		const block = await this.msgClient.getBlock(height);
		date = new Date(block.header.time);
		this.blockTimestampCache.set(height, date);
		return date;
	}

	async getDeploymentBids(dseq: number): Promise<DeploymentBid[]> {
		const res = await new MarketQueryClient(this.queryClient).Bids(
			QueryBidsRequest.fromPartial({
				filters: {
					dseq: dseq,
					owner: this.address,
					state: Bid_State[Bid_State.open]
				}
			})
		);

		return res.bids.map((b) => DeploymentBid.fromBidResponse(b));
	}

	async getProviderDetails(provider: string): Promise<ProviderDetails> {
		var details = this.providerDetailsCache.get(provider);

		if (details != null) {
			return details;
		}

		const res = await new ProviderQueryClient(this.queryClient).Provider(
			QueryProviderRequest.fromPartial({
				owner: provider
			})
		);

		details = ProviderDetails.fromProvider(res.provider!);
		this.providerDetailsCache.set(provider, details);
		return details;
	}

	//Transactions

	async broadcastCertificate(csr: string, publicKey: string): Promise<void> {
		const encodedCsr = base64ToUInt(toBase64(csr!));
		const encdodedPublicKey = base64ToUInt(toBase64(publicKey!));

		await this.sendTransaction(
			messages.MsgCreateCertificate,
			MsgCreateCertificate.fromPartial({
				owner: this.address,
				cert: encodedCsr,
				pubkey: encdodedPublicKey
			})
		);
	}

	async createDeplyoment(msg: MsgCreateDeployment): Promise<void> {
		await this.sendTransaction(messages.MsgCreateDeployment, msg);
	}

	async closeDeployment(dseq: number): Promise<void> {
		await this.sendTransaction(
			messages.MsgCloseDeployment,
			MsgCloseDeployment.fromPartial({
				id: {
					owner: this.address,
					dseq: dseq
				}
			})
		);
	}

	async createLease(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string
	): Promise<void> {
		await this.sendTransaction(
			messages.MsgCreateLease,
			MsgCreateLease.fromPartial({
				bidId: {
					dseq: dseq,
					gseq: gseq,
					oseq: oseq,
					provider: provider,
					owner: this.address
				}
			})
		);
	}

	// Provider

	async submitManifest(
		dseq: number,
		provider: string,
		sdl: SDL
	): Promise<boolean> {
		const providerDetails = await this.getProviderDetails(provider);

		const attempt = () =>
			NATIVE_API.mtlsFetch(
				'PUT',
				new URL(`deployment/${dseq}/manifest`, providerDetails.hostUri).href,
				sdl.manifestSortedJSON(),
				this._certificate!.csr,
				this._certificate!.privkey
			);

		try {
			await retry(attempt, [1000, 3000, 5000]);
			return true;
		} catch (error) {
			return false;
		}
	}

	async getProviderLeaseStatus(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string
	): Promise<ProviderLeaseStatus> {
		const providerDetails = await this.getProviderDetails(provider);

		const attempt = () =>
			NATIVE_API.mtlsFetch<ProviderLeaseStatusResponse>(
				'GET',
				new URL(`lease/${dseq}/${gseq}/${oseq}/status`, providerDetails.hostUri)
					.href,
				'',
				this._certificate!.csr,
				this._certificate!.privkey
			);

		try {
			const response = await retry(attempt, [1000, 3000, 5000]);
			return ProviderLeaseStatus.fromResponse(response);
		} catch (error) {
			throw Error(`Contacting Provider Failed: ${error}`);
		}
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

	private async loadCurrentDeployments(): Promise<QueryDeploymentResponse[]> {
		const res = await new DeploymentQueryClient(this.queryClient).Deployments(
			QueryDeploymentsRequest.fromPartial({
				filters: {
					owner: this.address,
					state: Deployment_State[Deployment_State.active]
				}
			})
		);
		return res.deployments;
	}

	private async loadCurrentLeases(): Promise<QueryLeaseResponse[]> {
		const res = await new MarketQueryClient(this.queryClient).Leases(
			QueryLeasesRequest.fromPartial({
				filters: {
					owner: this.address,
					state: Lease_State[Lease_State.active]
				}
			})
		);
		return res.leases;
	}

	private async sendTransaction(
		type: messages,
		messageBody: any,
		gasMultiplicator: number = 1.35
	) {
		const message = {
			typeUrl: type,
			value: messageBody
		};
		const memo = 'BlockGuard';
		const gas = Math.ceil(
			gasMultiplicator *
				(await this.msgClient.simulate(this.address, [message], memo))
		);
		await this.msgClient.signAndBroadcast(
			this.address,
			[message],
			{
				amount: [
					{
						denom: 'uakt',
						amount: `${Math.ceil(GAS_PRICE * gas)}`
					}
				],
				gas: `${gas}`
			},
			memo
		);
	}

	//Lifetime

	async initialize(): Promise<void> {
		this.address = (await this.wallet.getAccounts())[0].address;

		this.msgClient = await getMsgClient(this.rpcUrl, this.wallet);
		this.queryClient = await getQueryClient(this.rpcUrl);

		this.initialized = true;
		await this.refresh();
	}

	async refresh() {
		if (!this.initialized) {
			return;
		}

		const newBalance = await this.loadCurrentBalance();
		this.balance.set(newBalance);

		const newDeployments = await this.loadCurrentDeployments();
		this.deployments.set(
			newDeployments.map((d) => DeploymentDetails.fromDeploymentResponse(d))
		);

		const newLeases = await this.loadCurrentLeases();
		this.leases.set(newLeases.map((l) => LeaseDetails.fromLeaseResponse(l)));
	}

	dispose() {
		console.log('Cleared - ' + this.refreshTimeout);
		clearInterval(this.refreshTimeout);
	}

	//Serialization

	async serialize() {
		const storedWallet = {
			mnemonics: this.wallet.mnemonic,
			rpcEndpoint: this.rpcUrl,
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
			storedWallet.rpcEndpoint,
			certificate
		);
		await cosmJsWallet.initialize();
		return cosmJsWallet;
	}
}
