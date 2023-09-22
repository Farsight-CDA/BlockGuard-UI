import type { Attribute } from '@playwo/akashjs/build/protobuf/akash/base/v1beta3/attribute';
import type { Deployment_State } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment';
import type { QueryDeploymentResponse } from '@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query';
import type { Lease_State } from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/lease';
import type {
	QueryBidResponse,
	QueryLeaseResponse
} from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/query';
import type { Provider } from '@playwo/akashjs/build/protobuf/akash/provider/v1beta3/provider';

export interface DeploymentDetails {
	dseq: number;
	createdAtHeight: number;
	state: Deployment_State;
}
export const DeploymentDetails = {
	fromDeploymentResponse(response: QueryDeploymentResponse) {
		return {
			dseq: response.deployment!.deploymentId!.dseq.toNumber(),
			createdAtHeight: response.deployment!.createdAt.toNumber(),
			state: response.deployment!.state
		} satisfies DeploymentDetails;
	}
};

export interface LeaseDetails {
	dseq: number;
	gseq: number;
	oseq: number;
	state: Lease_State;
	createdAtHeight: number;
	provider: string;
}
export const LeaseDetails = {
	fromLeaseResponse(response: QueryLeaseResponse) {
		return {
			dseq: response.lease!.leaseId!.dseq.toNumber(),
			gseq: response.lease!.leaseId!.gseq,
			oseq: response.lease!.leaseId!.oseq,
			state: response.lease!.state,
			createdAtHeight: response.lease!.createdAt.toNumber(),
			provider: response.lease!.leaseId!.provider
		} satisfies LeaseDetails;
	}
};

export interface DeploymentBid {
	provider: string;
	createdAtHeight: number;
	price: number;

	oseq: number;
	gseq: number;
}
export const DeploymentBid = {
	fromBidResponse(response: QueryBidResponse) {
		return {
			createdAtHeight: response.bid!.createdAt.toNumber(),
			provider: response.bid!.bidId!.provider,
			price: parseFloat(response.bid!.price!.amount),
			oseq: response.bid!.bidId!.oseq,
			gseq: response.bid!.bidId!.gseq
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
	fromProvider(provider: Provider) {
		return {
			provider: provider.owner,
			hostUri: provider.hostUri,
			email: provider.info?.email ?? null,
			website: provider.info?.website ?? null,

			host: tryFindAttribute(provider.attributes, ['host']),
			organization: tryFindAttribute(provider.attributes, ['organization']),
			region: tryFindAttribute(provider.attributes, [
				'region',
				'location-region'
			]),
			country: tryFindAttribute(provider.attributes, ['country']),
			city: tryFindAttribute(provider.attributes, ['city']),

			networkUpload: tryParseFloat(
				tryFindAttribute(provider.attributes, ['network_upload'])
			),
			networkDownload: tryParseFloat(
				tryFindAttribute(provider.attributes, ['network_download'])
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
		const serviceNames = Object.keys(response.services);

		return {
			forwardedPorts: serviceNames.flatMap(
				(name) => response.forwarded_ports[name]
			)
		} satisfies ProviderLeaseStatus;
	}
};

function tryFindAttribute(attributes: Attribute[], names: string[]) {
	for (var i = 0; i < names.length; i++) {
		const name = names[i];
		const val = attributes.find(
			(x) => x.key.toUpperCase() == name.toUpperCase()
		)?.value;

		if (val != null) {
			return val;
		}
	}

	return null;
}

function tryParseFloat(val: string | null) {
	if (val == undefined) {
		return null;
	}

	try {
		return parseFloat(val);
	} catch (error) {
		return null;
	}
}
