import type { Deployment_State } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deployment";
import type { QueryDeploymentResponse } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/query";

export interface DeployedRemote {
    id: number;
    createdAtHeight: number;
    state: Deployment_State;
}

export const DeployedRemote = {
    fromDeploymentInfo(deployment: QueryDeploymentResponse) {
        return {
            id: deployment.deployment!.deploymentId!.dseq.toNumber(),
            createdAtHeight: deployment.deployment!.createdAt.toNumber(),
            state: deployment.deployment!.state
        } satisfies DeployedRemote;
    }
}