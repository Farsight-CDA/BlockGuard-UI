<script lang="ts">
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import type {
		LeaseDetails,
		ProviderDetails,
		ProviderLeaseStatus
	} from '$lib/types/types';
	import { useVPNConnection } from '$lib/vpn/vpn-connection';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import RefreshIcon from '$static/refresh.svg';
	import { onMount } from 'svelte';
	import type { Writable } from 'svelte/store';

	var wallet = useRequiredWallet();
	var vpnConnection = useVPNConnection();

	var leases: Writable<LeaseDetails[]>;
	$: leases = $wallet.leases;

	const queryPromises: {
		[key: number]:
			| {
					providerDetailsQuery: Promise<ProviderDetails>;
					statusQuery: Promise<ProviderLeaseStatus>;
			  }
			| undefined;
	} = {};

	onMount(() => {
		$leases.forEach((lease) => {
			queryPromises[lease.dseq] = {
				providerDetailsQuery: $wallet.getProviderDetails(lease.provider),
				statusQuery: queryProviderLeaseStatus(lease)
			};
		});
	});

	function queryProviderLeaseStatus(lease: LeaseDetails) {
		return $wallet.getProviderLeaseStatus(
			lease.dseq,
			lease.gseq,
			lease.oseq,
			lease.provider
		);
	}

	function triggerRefreshProviderStatus(lease: LeaseDetails) {
		queryPromises[lease.dseq]!.statusQuery = queryProviderLeaseStatus(lease);
	}

	async function triggerCloseDeployment(lease: LeaseDetails) {
		await $wallet.closeDeployment(lease.dseq);
	}

	async function triggerConnectVPN(lease: LeaseDetails) {
		const leaseStatus = await queryPromises[lease.dseq]!.statusQuery!;

		await vpnConnection.connectVPNToLease(
			lease.dseq,
			`${leaseStatus.forwardedPorts[0].host}:${leaseStatus.forwardedPorts[0].externalPort}`
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
			<th class="pb-2">Actions</th>
		</tr>
	</thead>
	<tbody class="before:content-[' '] before:block before:h-2">
		{#each $leases as lease}
			<tr>
				<td>
					{#await queryPromises[lease.dseq]?.providerDetailsQuery ?? new Promise( () => {} )}
						<LoadingSpinner></LoadingSpinner>
					{:then providerDetails}
						{providerDetails.region}
					{/await}
				</td>
				<td class="flex flex-row justify-around">
					{#await queryPromises[lease.dseq]?.statusQuery ?? new Promise( () => {} )}
						<LoadingSpinner></LoadingSpinner>
					{:then providerLeaseStatus}
						{#if providerLeaseStatus.forwardedPorts.length == 1}
							<p class="text-green-800">Active</p>
						{:else}
							<p class="text-yellow-600">Unknown</p>
						{/if}
					{:catch}
						<p class="text-red-800">Unresponsibe</p>
					{/await}

					<button on:click={() => triggerRefreshProviderStatus(lease)}>
						<img class="h-5" src={RefreshIcon} alt="Refresh Status" />
					</button>
				</td>
				<td>
					{#if $vpnConnection.isActive && $vpnConnection.connection.dseq == lease.dseq}
						<button
							class="bg-yellow-600 px-2 py-1 rounded-md"
							on:click={triggerDisconnectVPN}>Disconnect</button
						>
					{:else if !$vpnConnection.isActive}
						<button
							class="bg-green-800 px-2 py-1 rounded-md"
							on:click={() => triggerConnectVPN(lease)}>Connect</button
						>
					{/if}

					<button
						class="bg-red-800 px-2 py-1 rounded-md"
						on:click={() => triggerCloseDeployment(lease)}>Close</button
					>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
