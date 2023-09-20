<script lang="ts">
	import { WALLET, type Wallet } from '$lib/wallet/wallet';
	import AddLocationModal from './AddLocationModal.svelte';
	import StatusLamps from './StatusLamps.svelte';
	import type { DeploymentDetails, LeaseDetails } from '$lib/types/types';
	import type { Writable } from 'svelte/store';
	import ActiveLocationRow from './ActiveLocationRow.svelte';
	import { VPN_MANAGER } from '$lib/vpn-manager/vpn-manager';
	import DeadDeploymentTable from './DeadDeploymentTable.svelte';

	var wallet: Wallet;
	$: wallet = $WALLET!;

	var balance: Writable<number>;
	$: balance = $WALLET!.balance;

	var deployments: Writable<DeploymentDetails[]>;
	$: deployments = $WALLET!.deployments;

	var leases: Writable<LeaseDetails[]>;
	$: leases = $WALLET!.leases;

	let openAddActiveLocationModal: () => Promise<void>;

	function handleAddActiveLocation() {
		openAddActiveLocationModal();
	}
</script>

<AddLocationModal bind:open={openAddActiveLocationModal}></AddLocationModal>

<div class="flex flex-col gap-6 w-full h-full items-center justify-center">
	<div class="w-5/6 xl:w-1/3">
		<StatusLamps></StatusLamps>
	</div>

	<div
		class="w-5/6 xl:w-1/3 bg-neutral-900 rounded-md flex flex-col justify-center p-4 gap-4"
	>
		<h2 class="text-xl font-bold">Active Locations</h2>

		<button
			disabled={$balance < 5.1}
			class="bg-blue-500 rounded-md px-4 py-1"
			on:click={handleAddActiveLocation}>Add</button
		>

		<table>
			<thead>
				<tr>
					<th> Location </th>
					<th> Age </th>
					<th> Status </th>
					<th> Actions </th>
				</tr>
			</thead>
			<tbody class="text-center">
				{#each $leases as lease}
					<ActiveLocationRow
						dseq={lease.dseq}
						gseq={lease.gseq}
						oseq={lease.oseq}
						provider={lease.provider}
						createdAtHeight={lease.createdAtHeight}
					></ActiveLocationRow>
				{/each}
			</tbody>
		</table>

		<h2 class="text-xl font-bold">Inactive Deployments</h2>

		<DeadDeploymentTable></DeadDeploymentTable>
	</div>
</div>
