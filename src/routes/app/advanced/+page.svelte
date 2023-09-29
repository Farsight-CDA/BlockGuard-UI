<script lang="ts">
	import { tooltip } from '$lib/components/tooltip';
	import type { DeploymentDetails, LeaseDetails } from '$lib/types/types';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import type { Writable } from 'svelte/store';
	import ActiveDeploymentTable from './ActiveDeploymentTable.svelte';
	import AddLocationModal from './AddLocationModal.svelte';
	import DeadDeploymentTable from './DeadDeploymentTable.svelte';
	import { StatusLampStatus } from './StatusLamp.svelte';
	import StatusLamps from './StatusLamps.svelte';

	var wallet = useRequiredWallet();

	var balance: Writable<number>;
	$: balance = $wallet!.balance;

	var deployments: Writable<DeploymentDetails[]>;
	$: deployments = $wallet!.deployments;

	var leases: Writable<LeaseDetails[]>;
	$: leases = $wallet!.leases;

	let openAddActiveLocationModal: () => Promise<void>;

	function handleAddActiveLocation() {
		openAddActiveLocationModal();
	}

	$: openAddActiveLocationModal?.();

	var clientStatus: StatusLampStatus;
	var fundStatus: StatusLampStatus;
	var certificateStatus: StatusLampStatus;
	var connectionStatus: StatusLampStatus;

	var readyToAddLocation: boolean;
	$: readyToAddLocation =
		(fundStatus == StatusLampStatus.Ready ||
			fundStatus == StatusLampStatus.Warning) &&
		certificateStatus == StatusLampStatus.Ready;

	var addLocationStatusMessage: string;
	$: addLocationStatusMessage =
		fundStatus != StatusLampStatus.Ready &&
		fundStatus != StatusLampStatus.Warning
			? 'Not enough funds'
			: certificateStatus != StatusLampStatus.Ready
			? 'No certificate deployed'
			: '';
</script>

<AddLocationModal bind:open={openAddActiveLocationModal}></AddLocationModal>

<div class="flex flex-col gap-6 w-11/12 sm:w-2/3 xl:w-1/2 my-auto">
	<StatusLamps
		bind:vpnClientLampStatus={clientStatus}
		bind:fundsLampStatus={fundStatus}
		bind:certificateLampStatus={certificateStatus}
		bind:connectionLampStatus={connectionStatus}
	/>

	<div
		class="w-full bg-neutral-900 rounded-md flex flex-col justify-center p-4 gap-6"
	>
		<div class="w-full flex justify-between items-center">
			<h2 class="text-2xl font-bold">Active Locations</h2>

			<button
				disabled={!readyToAddLocation}
				class:bg-gray-500={!readyToAddLocation}
				class:bg-blue-500={readyToAddLocation}
				class="rounded-md px-6 py-2"
				on:click={handleAddActiveLocation}
				title={addLocationStatusMessage}
				use:tooltip>Add Location</button
			>
		</div>

		<ActiveDeploymentTable></ActiveDeploymentTable>

		<h2 class="text-2xl font-bold">Inactive Deployments</h2>

		<DeadDeploymentTable></DeadDeploymentTable>
	</div>
</div>
