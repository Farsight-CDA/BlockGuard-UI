import type { SDL } from '$lib/sdl/copypasta';
import type {
	DeploymentBid,
	DeploymentDetails,
	LeaseDetails,
	ProviderDetails,
	ProviderLeaseStatus
} from '$lib/types/types';
import type { Writable } from 'svelte/store';

export interface CreateDeploymentMsg {
	id: {
		owner: string;
		dseq: number;
	};
	groups: any[];
	hash: Uint8Array;
	deposit: {
		amount: {
			denom: string;
			amount: string;
		};
		sources: number[];
	};
}

export interface Wallet {
	getAddress(): string;
	getMnemonic(): string;

	getVPNCredentials(
		index: number
	): Promise<{ username: string; password: string }>;
	getBlockTimestamp(height: number): Promise<Date>;
	getDeploymentBids(dseq: number): Promise<DeploymentBid[]>;
	getProviderDetails(provider: string): Promise<ProviderDetails>;

	certificate: Writable<CertificateInfo | null>;
	balance: Writable<number>;
	rpcError: Writable<string | null>;

	averageBlockTime: Writable<number>;

	deployments: Writable<DeploymentDetails[]>;
	leases: Writable<LeaseDetails[]>;

	broadcastCertificate(csr: string, publicKey: Uint8Array): Promise<void>;
	createDeployment(msg: CreateDeploymentMsg): Promise<void>;
	closeDeployment(dseq: number): Promise<void>;
	createLease(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string,
		bseq: number
	): Promise<void>;
	submitManifest(dseq: number, provider: string, sdl: SDL): Promise<void>;
	getProviderLeaseStatus(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string
	): Promise<ProviderLeaseStatus>;
}
export interface CertificateInfo {
	csr: string;
	pubkey: string;
	privkey: string;
}
