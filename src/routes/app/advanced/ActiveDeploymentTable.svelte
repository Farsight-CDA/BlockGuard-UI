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
</script>

<table class="text-center">
	<thead class="border-b-2 border-white">
		<tr>
			<th class="pb-2">Location</th>
			<th class="pb-2">Status</th>
			<th class="pb-2">Actions</th>
		</tr>
	</thead>
	<tbody class="before:content-[' '] before:block before:h-2"> </tbody>
</table>
