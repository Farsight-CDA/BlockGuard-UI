import type {
	DeploymentBid,
	DeploymentDetails,
	LeaseDetails,
	ProviderDetails,
	ProviderLeaseStatus
} from '$lib/types/types';
import type { MsgCreateDeployment } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg';
import type { SDL } from '@playwo/akashjs/build/sdl';
import type { Writable } from 'svelte/store';

export interface Wallet {
	getAddress(): string;
	getMnemonic(): string;

	getBlockTimestamp(height: number): Promise<Date>;
	getDeploymentBids(dseq: number): Promise<DeploymentBid[]>;
	getProviderDetails(provider: string): Promise<ProviderDetails>;

	certificate: Writable<CertificateInfo | null>;
	balance: Writable<number>;

	averageBlockTime: Writable<number>;

	deployments: Writable<DeploymentDetails[]>;
	leases: Writable<LeaseDetails[]>;

	broadcastCertificate(csr: string, publicKey: string): Promise<void>;
	createDeplyoment(msg: MsgCreateDeployment): Promise<void>;
	closeDeployment(dseq: number): Promise<void>;
	createLease(
		dseq: number,
		gseq: number,
		oseq: number,
		provider: string
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
