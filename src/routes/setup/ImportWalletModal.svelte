<script lang="ts">
	import { goto } from '$app/navigation';
	import { WALLET } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	let dialogElement: HTMLDialogElement;
	var isOpen: boolean = false;

	var mnemonics: string | null = null;
	var hasEnteredValidMnemonics: boolean = false;

	$: hasEnteredValidMnemonics = mnemonics != null;

	export const open = function open() {
		isOpen = true;
		dialogElement.showModal();
	};

	async function triggerSaveAndGoToApp() {
		if (hasEnteredValidMnemonics) {
			await WALLET.create(mnemonics!);
		}

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
			class="flex flex-col"
			transition:scale={{ duration: 200, delay: 0 }}
			on:introstart
			on:outroend
		>
			<h2 class="font-bold text-lg mb-3">Import Wallet</h2>

			<textarea class="bg-slate-700 p-2" bind:value={mnemonics} />

			<button
				disabled={!hasEnteredValidMnemonics}
				class="px-2 py-1"
				on:click={triggerSaveAndGoToApp}
				class:bg-green-500={hasEnteredValidMnemonics}
				class:bg-gray-800={!hasEnteredValidMnemonics}>Go to App</button
			>
		</div>
	{/if}
</dialog>
