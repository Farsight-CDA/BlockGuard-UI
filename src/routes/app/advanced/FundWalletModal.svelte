<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;

	function copyToClipboard() {
		navigator.clipboard.writeText($wallet.getAddress());
	}
</script>

<Modal bind:open>
	<div
		class="flex flex-col items-center gap-4 pb-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Fund your Wallet</h2>

		<p>Send at least 5.5 AKT to</p>
		<button
			on:click={copyToClipboard}
			class="p-2 bg-blue-400 rounded-md drop-shadow-glow-blue-400"
			>{$wallet.getAddress()}</button
		>
	</div>
	<div class="flex flex-row gap-4">
		<button
			on:click={() => null}
			class="bg-gray-600 p-3 rounded-md w-full"
			disabled={true}
			>Kado Money
			<p
				id="helper-checkbox-text"
				class="text-xxs font-light text-gray-500 dark:text-gray-300"
			>
				comming soon
			</p></button
		>
		<button
			on:click={() => null}
			class="bg-gray-600 p-3 rounded-md w-full"
			disabled={true}
			>Kip API
			<p
				id="helper-checkbox-text"
				class="text-xxs font-light text-gray-500 dark:text-gray-300"
			>
				comming soon
			</p></button
		>
	</div>
</Modal>
