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
	import { Lease_State } from '@playwo/akashjs/build/protobuf/akash/market/v1beta3/lease';
	import type { Writable } from 'svelte/store';

	var wallet = useRequiredWallet();
	var vpnConnection = useVPNConnection();

	var leases: Writable<LeaseDetails[]>;
	$: leases = $wallet.leases;

	const leasePromises: {
		[key: number]:
			| {
					providerDetailsQuery: Promise<ProviderDetails>;
					statusQuery: Promise<ProviderLeaseStatus>;
					closeDeployment: Promise<void> | null;
			  }
			| undefined;
	} = {};
	var connectionPromiseRunning: boolean = false;

	$: $leases.forEach((lease) => {
		if (leasePromises[lease.dseq] == null) {
			startLeaseQueries(lease);
		}
	});

	function startLeaseQueries(lease: LeaseDetails) {
		leasePromises[lease.dseq] = {
			providerDetailsQuery: $wallet.getProviderDetails(lease.provider),
			statusQuery: queryProviderLeaseStatus(lease),
			closeDeployment: null
		};
	}

	function queryProviderLeaseStatus(lease: LeaseDetails) {
		return $wallet.getProviderLeaseStatus(
			lease.dseq,
			lease.gseq,
			lease.oseq,
			lease.provider
		);
	}

	function triggerRefreshProviderStatus(lease: LeaseDetails) {
		leasePromises[lease.dseq]!.statusQuery = queryProviderLeaseStatus(lease);
	}

	async function triggerCloseDeployment(lease: LeaseDetails) {
		if (leasePromises[lease.dseq]?.closeDeployment != null) {
			return;
		}

		leasePromises[lease.dseq]!.closeDeployment = $wallet.closeDeployment(
			lease.dseq
		);
		await leasePromises[lease.dseq]!.closeDeployment;
	}

	async function triggerConnectVPN(lease: LeaseDetails) {
		if (connectionPromiseRunning) {
			return;
		}
		connectionPromiseRunning = true;

		try {
			const leaseStatus = await leasePromises[lease.dseq]!.statusQuery!;

			await vpnConnection.connectVPNToLease(
				lease.dseq,
				`${leaseStatus.forwardedPorts[0].host}:${leaseStatus.forwardedPorts[0].externalPort}`
			);
		} finally {
			connectionPromiseRunning = false;
		}
	}

	async function triggerDisconnectVPN() {
		if (connectionPromiseRunning) {
			return;
		}
		connectionPromiseRunning = true;

		try {
			await vpnConnection.closeVPNConnection();
		} finally {
			connectionPromiseRunning = false;
		}
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
		{#each $leases as lease}
			<tr>
				<td>
					{#await leasePromises[lease.dseq]?.providerDetailsQuery ?? new Promise( () => {} )}
						<LoadingSpinner></LoadingSpinner>
					{:then providerDetails}
						{providerDetails.region}
					{/await}
				</td>
				<td>
					<p>{Lease_State[lease.state]}</p>
				</td>
				<td>
					<div class="flex flex-row justify-around">
						{#await leasePromises[lease.dseq]?.statusQuery ?? new Promise( () => {} )}
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
					</div>
				</td>
				<td>
					<div class="flex flex-row justify-end gap-3">
						{#if $vpnConnection.isActive && $vpnConnection.connection.dseq == lease.dseq}
							<button
								class="bg-yellow-600 px-2 py-1 rounded-md"
								disabled={connectionPromiseRunning}
								on:click={triggerDisconnectVPN}>Disconnect</button
							>
						{:else if !$vpnConnection.isActive}
							<button
								class="bg-green-800 px-2 py-1 rounded-md"
								disabled={connectionPromiseRunning}
								on:click={() => triggerConnectVPN(lease)}>Connect</button
							>
						{/if}

						{#if !$vpnConnection.isActive || ($vpnConnection.isActive && $vpnConnection.connection.dseq != lease.dseq)}
							<button
								class="bg-red-800 px-2 py-1 rounded-md"
								disabled={leasePromises[lease.dseq]?.closeDeployment != null}
								on:click={() => triggerCloseDeployment(lease)}
							>
								{#if leasePromises[lease.dseq]?.closeDeployment != null}
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
