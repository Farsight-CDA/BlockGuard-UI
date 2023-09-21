<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;
</script>

<Modal bind:open
	><div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Fund your Wallet</h2>

		<p>Send at least 5.5 AKT to</p>
		<code class="p-2 bg-slate-600 rounded-md">{$wallet.getAddress()}</code>
	</div></Modal
>
