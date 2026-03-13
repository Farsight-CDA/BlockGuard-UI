import type { ProviderLeaseStatusResponse } from './responses';

export type DeploymentState = 'invalid' | 'active' | 'closed' | string;
export type LeaseState =
	| 'invalid'
	| 'active'
	| 'insufficient_funds'
	| 'closed'
	| string;

interface RawAttribute {
	key?: string;
	value?: string;
}

interface RawDeploymentId {
	owner?: string;
	dseq?: string | number;
}

interface RawDeployment {
	id?: RawDeploymentId;
	deploymentId?: RawDeploymentId;
	deployment_id?: RawDeploymentId;
	state?: string | number;
	createdAt?: string | number;
	created_at?: string | number;
}

interface RawLeaseId extends RawDeploymentId {
	gseq?: string | number;
	oseq?: string | number;
	provider?: string;
	bseq?: string | number;
}

interface RawLease {
	id?: RawLeaseId;
	leaseId?: RawLeaseId;
	lease_id?: RawLeaseId;
	state?: string | number;
	price?: {
		amount?: string;
		denom?: string;
	};
	createdAt?: string | number;
	created_at?: string | number;
}

interface RawBid {
	id?: RawLeaseId;
	bidId?: RawLeaseId;
	bid_id?: RawLeaseId;
	price?: {
		amount?: string;
		denom?: string;
	};
	createdAt?: string | number;
	created_at?: string | number;
}

interface RawProvider {
	owner?: string;
	hostUri?: string;
	host_uri?: string;
	info?: {
		email?: string;
		website?: string;
	};
	attributes?: RawAttribute[];
}

export interface DeploymentDetails {
	dseq: number;
	createdAtHeight: number;
	state: DeploymentState;
}

export const DeploymentDetails = {
	fromDeploymentResponse(response: { deployment?: RawDeployment }) {
		const deployment = response.deployment ?? {};
		const deploymentId =
			deployment.id ??
			deployment.deploymentId ??
			deployment.deployment_id ??
			{};

		return {
			dseq: toNumber(deploymentId.dseq),
			createdAtHeight: toNumber(deployment.createdAt ?? deployment.created_at),
			state: normalizeDeploymentState(deployment.state)
		} satisfies DeploymentDetails;
	}
};

export interface LeaseDetails {
	dseq: number;
	gseq: number;
	oseq: number;
	state: LeaseState;
	createdAtHeight: number;
	providerDetails: ProviderDetails;
	status: ProviderLeaseStatus | null;
}

export const LeaseDetails = {
	fromLeaseResponse(
		response: { lease?: RawLease },
		providerDetails: ProviderDetails,
		providerStatus: ProviderLeaseStatus | null
	) {
		const lease = response.lease ?? {};
		const leaseId = lease.id ?? lease.leaseId ?? lease.lease_id ?? {};

		return {
			dseq: toNumber(leaseId.dseq),
			gseq: toNumber(leaseId.gseq),
			oseq: toNumber(leaseId.oseq),
			state: normalizeLeaseState(lease.state),
			createdAtHeight: toNumber(lease.createdAt ?? lease.created_at),
			providerDetails,
			status: providerStatus
		} satisfies LeaseDetails;
	}
};

export interface DeploymentBid {
	provider: string;
	createdAtHeight: number;
	price: number;
	oseq: number;
	gseq: number;
	bseq: number;
}

export const DeploymentBid = {
	fromBidResponse(response: { bid?: RawBid }) {
		const bid = response.bid ?? {};
		const bidId = bid.id ?? bid.bidId ?? bid.bid_id ?? {};

		return {
			createdAtHeight: toNumber(bid.createdAt ?? bid.created_at),
			provider: bidId.provider ?? '',
			price: parseFloat(bid.price?.amount ?? '0'),
			oseq: toNumber(bidId.oseq),
			gseq: toNumber(bidId.gseq),
			bseq: toNumber(bidId.bseq)
		} satisfies DeploymentBid;
	}
};

export interface ProviderDetails {
	provider: string;
	hostUri: string;
	email: string | null;
	website: string | null;
	host: string | null;
	organization: string | null;
	region: string | null;
	country: string | null;
	city: string | null;
	networkUpload: number | null;
	networkDownload: number | null;
}

export const ProviderDetails = {
	fromProvider(provider: RawProvider) {
		const attributes = provider.attributes ?? [];

		return {
			provider: provider.owner ?? '',
			hostUri: provider.hostUri ?? provider.host_uri ?? '',
			email: provider.info?.email ?? null,
			website: provider.info?.website ?? null,
			host: tryFindAttribute(attributes, ['host']),
			organization: tryFindAttribute(attributes, ['organization']),
			region: tryFindAttribute(attributes, ['region', 'location-region']),
			country: tryFindAttribute(attributes, ['country']),
			city: tryFindAttribute(attributes, ['city']),
			networkUpload: tryParseFloat(
				tryFindAttribute(attributes, ['network_upload', 'network-speed-up'])
			),
			networkDownload: tryParseFloat(
				tryFindAttribute(attributes, ['network_download', 'network-speed-down'])
			)
		} satisfies ProviderDetails;
	}
};

export interface ProviderLeaseStatus {
	forwardedPorts: ProviderLeasePort[];
}

export interface ProviderLeasePort {
	host: string;
	port: number;
	externalPort: number;
	proto: string;
	name: string;
}

export const ProviderLeaseStatus = {
	fromResponse(response: ProviderLeaseStatusResponse) {
		const serviceNames = Object.keys(response.services ?? {});

		return {
			forwardedPorts: serviceNames.flatMap(
				(name) => response.forwarded_ports?.[name] ?? []
			)
		} satisfies ProviderLeaseStatus;
	}
};

export function formatLeaseState(state: LeaseState) {
	return state.replaceAll('_', ' ');
}

function tryFindAttribute(attributes: RawAttribute[], names: string[]) {
	for (const name of names) {
		const value = attributes.find(
			(attribute) => attribute.key?.toUpperCase() == name.toUpperCase()
		)?.value;

		if (value != null) {
			return value;
		}
	}

	return null;
}

function tryParseFloat(value: string | null) {
	if (value == null) {
		return null;
	}

	try {
		return parseFloat(value);
	} catch {
		return null;
	}
}

function toNumber(value: string | number | undefined) {
	if (typeof value == 'number') {
		return value;
	}

	if (typeof value == 'string') {
		return parseInt(value, 10);
	}

	return 0;
}

function normalizeDeploymentState(
	state: string | number | undefined
): DeploymentState {
	if (typeof state == 'string') {
		return state;
	}

	if (state == 1) {
		return 'active';
	}

	if (state == 2) {
		return 'closed';
	}

	return 'invalid';
}

function normalizeLeaseState(state: string | number | undefined): LeaseState {
	if (typeof state == 'string') {
		return state;
	}

	if (state == 1) {
		return 'active';
	}

	if (state == 2) {
		return 'insufficient_funds';
	}

	if (state == 3) {
		return 'closed';
	}

	return 'invalid';
}

export const DeploymentState = {
	invalid: 'invalid',
	active: 'active',
	closed: 'closed'
} as const;
