<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;

	export let mnemonics: string;

	function copyToClipboard() {
		navigator.clipboard.writeText(mnemonics);
	}
</script>

<Modal bind:open>
	<div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Export your Mnemonics</h2>

		{#if mnemonics == null}
			<div class="grid grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800">
				<p>No mnemonics this is weard</p>
			</div>
		{:else}
			<button
				on:click={copyToClipboard}
				class="grid grid-cols-4 gap-3 p-4 rounded-xl bg-slate-800"
			>
				{#each mnemonics.split(' ') as word, i}
					<p>{word}</p>
				{/each}
			</button>
			<button
				class="gap-3 p-4 rounded-xl bg-slate-800 transform"
				on:click={copyToClipboard}>Copy</button
			>
		{/if}
	</div></Modal
>
