<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { DeploymentDetails, LeaseDetails } from '$lib/types/types';
	import { toTimespanString } from '$lib/utils/utils';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import type { Writable } from 'svelte/store';

	var wallet = useRequiredWallet();

	var deployments: Writable<DeploymentDetails[]>;
	$: deployments = $wallet.deployments;

	var leases: Writable<LeaseDetails[]>;
	$: leases = $wallet.leases;

	var deadDeployments: DeploymentDetails[] = [];
	$: deadDeployments = $deployments.filter(
		(x) => $leases.find((y) => y.dseq == x.dseq) == null
	);

	var isCloseActionRunning: { [dseq: number]: boolean } = {};

	async function triggerCloseDeployment(dseq: number) {
		try {
			isCloseActionRunning[dseq] = true;
			await $wallet.closeDeployment(dseq);
		} catch (error) {
			isCloseActionRunning[dseq] = false;
		}
	}
</script>

<table class="text-center">
	<thead class="border-b-2 border-white">
		<tr>
			<th class="pb-2"> Age </th>
			<th class="pb-2">Locked Funds</th>
			<th class="pb-2"> Actions </th>
		</tr>
	</thead>
	<tbody class="before:content-[' '] before:block before:h-2">
		{#each deadDeployments as deployment}
			<tr>
				<td>
					{#await $wallet.getBlockTimestamp(deployment.createdAtHeight)}
						<LoadingSpinner></LoadingSpinner>
					{:then blockTimestamp}
						<p>
							{toTimespanString(
								new Date().getTime() - blockTimestamp.getTime()
							)}
						</p>
					{/await}
				</td>
				<td> Not Implemented </td>
				<td>
					<button
						class="bg-red-600 px-3 py-1"
						on:click={() => triggerCloseDeployment(deployment.dseq)}
						disabled={isCloseActionRunning[deployment.dseq]}
					>
						{#if isCloseActionRunning[deployment.dseq]}
							<LoadingSpinner></LoadingSpinner>
						{:else}
							Close
						{/if}
					</button>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
