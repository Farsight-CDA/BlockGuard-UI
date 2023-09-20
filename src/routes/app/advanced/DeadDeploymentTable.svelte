<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { DeploymentDetails, LeaseDetails } from '$lib/types/types';
	import { WALLET, type Wallet } from '$lib/wallet/wallet';
	import type { Writable } from 'svelte/store';

	var wallet: Wallet;
	$: wallet = $WALLET!;

	var deployments: Writable<DeploymentDetails[]>;
	$: deployments = $WALLET!.deployments;

	var leases: Writable<LeaseDetails[]>;
	$: leases = $WALLET!.leases;

	var deadDeployments: DeploymentDetails[] = [];
	$: deadDeployments = $deployments.filter(
		(x) => $leases.find((y) => y.dseq == x.dseq) == null
	);

	var isCloseActionRunning: { [dseq: number]: boolean };

	async function triggerCloseDeployment(dseq: number) {
		try {
			isCloseActionRunning[dseq] = true;
			await wallet.closeDeployment(dseq);
		} catch (error) {
			isCloseActionRunning[dseq] = false;
		}
	}
</script>

<table>
	<thead>
		<tr>
			<th> Age </th>
			<th>Locked Funds</th>
			<th> Actions </th>
		</tr>
	</thead>
	<tbody>
		{#each deadDeployments as deployment}
			<tr>
				<td>
					{#await wallet.getBlockTimestamp(deployment.createdAtHeight)}
						<LoadingSpinner></LoadingSpinner>
					{:then blockTimestamp}
						<p>{new Date().getTime() - blockTimestamp.getTime()} ms</p>
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
