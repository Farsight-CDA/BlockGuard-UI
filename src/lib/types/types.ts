import type { Deployment_State } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment";
import type { QueryDeploymentResponse } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query";
import type { QueryBidResponse } from "@playwo/akashjs/build/protobuf/akash/market/v1beta3/query";
import type { Bid_State } from "@playwo/akashjs/build/protobuf/akash/market/v1beta3/bid";

export interface DeployedRemote {
    id: number;
    createdAtHeight: number;
    state: Deployment_State;
}
export const DeployedRemote = {
    fromDeploymentResponse(response: QueryDeploymentResponse) {
        return {
            id: response.deployment!.deploymentId!.dseq.toNumber(),
            createdAtHeight: response.deployment!.createdAt.toNumber(),
            state: response.deployment!.state
        } satisfies DeployedRemote;
    }
}

export interface DeploymentBid {
    provider: string;
    createdAtHeight: number;
}
export const DeploymentBid = {
    fromBidResponse(response: QueryBidResponse) {
        return {
            createdAtHeight: response.bid!.createdAt.toNumber(),
            provider: response.bid!.bidId!.provider
        } satisfies DeploymentBid;
    }
}
