<script lang="ts">
	import type { ProviderLeaseStatus } from '$lib/types/types';
	import { useVPNConnection } from '$lib/vpn/vpn-connection';
	import { useRequiredWallet } from '$lib/wallet/wallet';

	export let dseq: number;
	export let createdAtHeight: number;

	export let gseq: number | null = null;
	export let oseq: number | null = null;
	export let provider: string | null = null;

	var wallet = useRequiredWallet();

	const vpnConnection = useVPNConnection();

	async function triggerCloseDeployment(dseq: number) {
		await $wallet.closeDeployment(dseq);
	}

	async function triggerConnectVPN(
		dseq: number,
		leaseStatus: ProviderLeaseStatus
	) {
		await vpnConnection.connectVPNToLease(
			dseq,
			`${leaseStatus.forwardedPorts[0].host}:${leaseStatus.forwardedPorts[0].externalPort}`
		);
	}
</script>

<tr>
	<td>
		{#if provider != null}
			{#await $wallet.getProviderDetails(provider)}
				...
			{:then details}
				<p>
					{details.region}
				</p>
			{/await}
		{:else}
			<p>Not Connected</p>
		{/if}
	</td>
	<td>
		{#await $wallet.getBlockTimestamp(createdAtHeight)}
			...
		{:then timestamp}
			{Math.round((new Date().getTime() - timestamp.getTime()) / 60000)} mins
		{/await}
	</td>

	{#if gseq != null && oseq != null}
		{#await $wallet.getProviderLeaseStatus(dseq, gseq, oseq, `${provider}`)}
			<td> ... </td>
			<td>
				<button on:click={() => triggerCloseDeployment(dseq)}>Close</button>
			</td>
		{:then leaseStatus}
			<td>
				<p>
					{`${leaseStatus.forwardedPorts[0].host}:${leaseStatus.forwardedPorts[0].externalPort}`}
				</p>
			</td>

			<td>
				<button on:click={() => triggerConnectVPN(dseq, leaseStatus)}
					>Connect</button
				>
				<button on:click={() => triggerCloseDeployment(dseq)}>Close</button>
			</td>
		{:catch}
			<td><p>Not Connected</p></td>
			<td>
				<button on:click={() => triggerCloseDeployment(dseq)}>Close</button>
			</td>
		{/await}
	{:else}
		<td><p>Not Connected</p></td>
		<td>
			<button on:click={() => triggerCloseDeployment(dseq)}>Close</button>
		</td>
	{/if}
</tr>
