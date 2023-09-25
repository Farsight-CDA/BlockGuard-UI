<script lang="ts">
	import { goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import { useOptionalWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useOptionalWallet();

	let dialogElement: HTMLDialogElement;
	var isOpen: boolean = false;

	var mnemonics: string | null = null;
	var hasEnteredValidMnemonics: boolean = false;

	$: hasEnteredValidMnemonics = mnemonics != null;

	export let open: () => Promise<void>;

	async function triggerSaveAndGoToApp() {
		if (hasEnteredValidMnemonics) {
			await wallet.create(mnemonics!);
		}

		await goto('/');
	}

	function dialogClickHandler(e: MouseEvent) {
		if (e.target === dialogElement) {
			dialogElement.close();
			isOpen = false;
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<Modal bind:open>
	<div
		class="flex flex-col"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg mb-3">Import Wallet</h2>

		<textarea
			class="bg-slate-700 p-2 rounded-t-xl h-40 overflow-hidden over"
			bind:value={mnemonics}
		/>

		<button
			disabled={!hasEnteredValidMnemonics}
			class="px-2 py-1 rounded-b-xl"
			on:click={triggerSaveAndGoToApp}
			class:bg-green-400={hasEnteredValidMnemonics}
			class:drop-shadow-glow-green-400={hasEnteredValidMnemonics}
			class:hover:bg-green-500={hasEnteredValidMnemonics}
			class:bg-gray-800={!hasEnteredValidMnemonics}>Go to App</button
		>
	</div>
</Modal>
