<script lang="ts">
	import { goto } from '$app/navigation';
	import MnemonicsForm from '$lib/components/MnemonicsForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { useOptionalWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useOptionalWallet();

	var generatedMnemonics: string | null;

	var hasSavedMnemonics: boolean = false;

	export const open = async function open() {
		generatedMnemonics = null;
		hasSavedMnemonics = false;
		await innerOpen();
	};

	let innerOpen: () => Promise<void>;

	async function triggerSaveAndGoToApp() {
		await wallet.create(generatedMnemonics!);
		await goto('/');
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<Modal bind:open={innerOpen}>
	<div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Create Wallet</h2>

		<MnemonicsForm
			mode="Generate"
			bind:mnemonics={generatedMnemonics}
			exposed={true}
		></MnemonicsForm>
		{#if generatedMnemonics != null}
			<span>
				<div class="flex">
					<div class="flex items-center h-5">
						<input
							disabled={generatedMnemonics == null}
							bind:checked={hasSavedMnemonics}
							id="helper-checkbox"
							type="checkbox"
							class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300"
						/>
					</div>
					<div class="ml-2 text-sm">
						<label
							for="helper-checkbox"
							class="font-medium text-gray-900 dark:text-gray-300"
							>I have saved the mnemonics</label
						>
						<p
							id="helper-checkbox-text"
							class="text-xxs font-light text-gray-500 dark:text-gray-300"
						>
							I know that without them, my funds could be lost forever
						</p>
					</div>
				</div>
			</span>
		{/if}
		<button
			disabled={!hasSavedMnemonics}
			class="px-2 py-1 rounded-lg w-full bg-black drop-shadow-glow-black-100"
			class:hover:drop-shadow-glow-red-100={!hasSavedMnemonics}
			class:bg-green-400={hasSavedMnemonics}
			class:hover:bg-red-400={!hasSavedMnemonics}
			class:drop-shadow-glow-green-400={hasSavedMnemonics}
			on:click={triggerSaveAndGoToApp}>Go to App</button
		>
	</div>
</Modal>
