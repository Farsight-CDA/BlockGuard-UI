<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;

	var mnemonics: string;
	$: mnemonics = $wallet.getMnemonic();

	function copyToClipboard() {
		navigator.clipboard.writeText(mnemonics);
	}
</script>

<Modal bind:open
	><div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Export your Mnemonics</h2>

		<button on:click={copyToClipboard} class="bg-green-600 p-3 rounded-md"
			>{mnemonics}</button
		>
	</div></Modal
>
