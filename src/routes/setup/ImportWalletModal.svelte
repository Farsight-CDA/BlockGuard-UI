<script lang="ts">
	import { goto } from '$app/navigation';
	import MnemonicForm from '$lib/components/MnemonicsForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { useOptionalWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useOptionalWallet();

	var mnemonics: string | null = null;
	var hasEnteredValidMnemonics: boolean = false;

	var innerOpen: () => Promise<void>;

	export const open = async function open() {
		mnemonics = null;
		await innerOpen();
	};

	async function triggerSaveAndGoToApp() {
		await wallet.create(mnemonics!);
		await goto('/');
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<Modal bind:open={innerOpen}>
	<div
		class="flex flex-col gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Import Wallet</h2>

		<MnemonicForm
			bind:mnemonics
			bind:isValid={hasEnteredValidMnemonics}
			mode={'Modifyable'}
		></MnemonicForm>

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
