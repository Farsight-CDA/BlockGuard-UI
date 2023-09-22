<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type { LeaseDetails } from '$lib/types/types';
	import { useVPNConnection } from '$lib/vpn/vpn-connection';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { Lease_State } from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/lease';
	import type { Writable } from 'svelte/store';

	var wallet = useRequiredWallet();
	var vpnConnection = useVPNConnection();

	var leases: Writable<LeaseDetails[]>;
	$: leases = $wallet.leases;

	const closeDeploymentPromises: {
		[key: number]: Promise<void> | undefined;
	} = {};

	async function triggerCloseDeployment(lease: LeaseDetails) {
		closeDeploymentPromises[lease.dseq] = $wallet.closeDeployment(lease.dseq);
		await closeDeploymentPromises[lease.dseq];
	}

	async function triggerConnectVPN(lease: LeaseDetails) {
		if ($vpnConnection.isUpdating || lease.status == null) {
			return;
		}

		await vpnConnection.connectVPNToLease(
			lease.dseq,
			`${lease.status.forwardedPorts[0].host}:${lease.status.forwardedPorts[0].externalPort}`
		);
	}

	async function triggerDisconnectVPN() {
		await vpnConnection.closeVPNConnection();
	}
</script>

<table class="text-center">
	<thead class="border-b-2 border-white">
		<tr>
			<th class="pb-2">Location</th>
			<th class="pb-2">Status</th>
			<th class="pb-2">Reachability</th>
			<th class="pb-2">Actions</th>
		</tr>
	</thead>
	<tbody class="before:content-[' '] before:block before:h-2">
		{#each $leases.sort((a, b) => a.createdAtHeight - b.createdAtHeight) as lease}
			<tr
				class:border={$vpnConnection.isActive &&
					$vpnConnection.connection.dseq == lease.dseq}
				class:border-gray-300={$vpnConnection.isActive &&
					$vpnConnection.connection.dseq == lease.dseq}
				class:bg-gray-500={$vpnConnection.isActive &&
					$vpnConnection.connection.dseq == lease.dseq}
			>
				<td>
					{lease.providerDetails.region}
				</td>
				<td>
					<p>{Lease_State[lease.state]}</p>
				</td>
				<td>
					{#if lease.status == null}
						<p class="text-red-800">Unresponsive</p>
					{:else if lease.status.forwardedPorts.length == 1}
						<p class="text-green-800">Active</p>
					{:else}
						<p class="text-yellow-600">Unknown</p>
					{/if}
				</td>
				<td>
					<div class="flex flex-row justify-end gap-3">
						{#if $vpnConnection.isActive && $vpnConnection.connection.dseq == lease.dseq}
							<button
								class="bg-yellow-600 px-2 py-1 rounded-md"
								disabled={$vpnConnection.isUpdating}
								on:click={triggerDisconnectVPN}>Disconnect</button
							>
						{:else if !$vpnConnection.isActive && !$vpnConnection.isUpdating}
							<button
								class="bg-green-800 px-2 py-1 rounded-md"
								on:click={() => triggerConnectVPN(lease)}>Connect</button
							>
						{/if}

						{#if !$vpnConnection.isActive || ($vpnConnection.isActive && $vpnConnection.connection.dseq != lease.dseq)}
							<button
								class="bg-red-800 px-2 py-1 rounded-md"
								disabled={closeDeploymentPromises[lease.dseq] != null}
								on:click={() => triggerCloseDeployment(lease)}
							>
								{#if closeDeploymentPromises[lease.dseq] != null}
									<LoadingSpinner></LoadingSpinner>
								{:else}
									Close
								{/if}
							</button>
						{/if}
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
