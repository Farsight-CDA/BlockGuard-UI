<script lang="ts">
	import { goto } from '$app/navigation';
	import { generateMnemonics, useOptionalWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useOptionalWallet();

	let dialogElement: HTMLDialogElement;
	var isOpen: boolean = false;

	var generatedMnemonics: string | null;

	var hasSavedMnemonics: boolean = false;

	export const open = function open() {
		dialogElement.showModal();
		isOpen = true;
	};

	async function triggerMnemonicsGeneration() {
		generatedMnemonics = await generateMnemonics();
	}

	async function triggerSaveAndGoToApp() {
		await wallet.create(generatedMnemonics!);
		goto('/app');
	}

	function dialogClickHandler(e: MouseEvent) {
		if (e.target === dialogElement) {
			dialogElement.close();
			isOpen = false;
		}
	}
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialogElement}
	class="p-4 shadow-2xl rounded-lg bg-slate-900"
	on:click={dialogClickHandler}
	on:keydown={() => {}}
>
	{#if isOpen}
		<div
			class="flex flex-col items-center gap-4"
			transition:scale={{ duration: 200, delay: 0 }}
			on:introstart
			on:outroend
		>
			<h2 class="font-bold text-lg">Create Wallet</h2>

			{#if generatedMnemonics == null}
				<button on:click={triggerMnemonicsGeneration}>Generate Mnemonics</button
				>
			{:else}
				<div class="grid grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800">
					{#each generatedMnemonics.split(' ') as word, i}
						<p>{word}</p>
					{/each}
				</div>
			{/if}

			<span>
				<input
					disabled={generatedMnemonics == null}
					id="copied"
					type="checkbox"
					bind:checked={hasSavedMnemonics}
				/>
				<label for="copied">I have saved the mnemonics</label>
			</span>

			<button
				disabled={!hasSavedMnemonics}
				class="px-2 py-1"
				class:bg-green-500={hasSavedMnemonics}
				class:bg-gray-800={!hasSavedMnemonics}
				on:click={triggerSaveAndGoToApp}>Go to App</button
			>
		</div>
	{/if}
</dialog>
