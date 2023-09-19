<script lang="ts">
	import { type Wallet, WALLET } from '$lib/wallet/wallet';

	export let dseq: number;
	export let createdAtHeight: number;

	export let gseq: number | null = null;
	export let oseq: number | null = null;
	export let provider: string | null = null;

	var wallet: Wallet;
	$: wallet = $WALLET!;

	async function triggerCloseDeployment(dseq: number) {
		await wallet.closeDeployment(dseq);
	}
</script>

<tr>
	<td>
		{#if provider != null}
			{#await wallet.getProviderDetails(provider)}
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
		{#await wallet.getBlockTimestamp(createdAtHeight)}
			...
		{:then timestamp}
			{Math.round((new Date().getTime() - timestamp.getTime()) / 60000)} mins
		{/await}
	</td>
	<td>
		{#if gseq != null && oseq != null}
			{#await wallet.getProviderLeaseStatus(dseq, gseq, oseq, `${provider}`)}
				...
			{:then leaseStatus}
				<p>
					{`${leaseStatus.forwardedPorts[0].host}:${leaseStatus.forwardedPorts[0].externalPort}`}
				</p>
			{/await}
		{:else}
			<p>Not Connected</p>
		{/if}
	</td>
	<td>
		<button>Connect</button>
		<button on:click={() => triggerCloseDeployment(dseq)}>Close</button>
	</td>
</tr>
