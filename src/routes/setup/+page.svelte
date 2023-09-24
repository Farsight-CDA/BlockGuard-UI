<script lang="ts">
	import { useGlobalConfig } from '$lib/configuration/configuration';
	import CreateWalletModal from './CreateWalletModal.svelte';
	import ImportWalletModal from './ImportWalletModal.svelte';

	let openCreateWalletModal: () => void;
	let openImportWalletModal: () => void;

	var globalConfig = useGlobalConfig();
	let agbRead = $globalConfig.agbRead;

	function handleCreateWallet() {
		openCreateWalletModal();
	}

	function handleImportWallet() {
		openImportWalletModal();
	}

	function agreeToAgb() {
		const url =
			'http://4.bp.blogspot.com/-fEXyKe5WLmk/UZ0uDdCJrCI/AAAAAAAAL_o/kS5Jzlu7IDE/s400/gandalf.gif';
		window.open(url, '_blank');
		globalConfig.setAgbRead(true);
		agbRead = true;
	}
</script>

<h2 class="text-lg font-bold mt-4">Welcome to BlockGuard!</h2>
{#if agbRead == false}
	<button
		on:click={agreeToAgb}
		class="w-full gap-3 p-4 border-white border-2 rounded-lg mt-4
	hover:bg-gray-600 active:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-200 max-w-lg"
	>
		<p class="text-sm font-medium text-left">
			This is your gateway to unrestricted online freedom. With us, you can surf
			the web without boundaries, breaking free from geo-blocking constraints.
			Experience the internet as it should be, where censorship and restrictions
			are a thing of the past. You should visit our webisd for technical
			information
		</p>
		<p class="text-xs text-right mt-1">press to hide this dialog</p>
	</button>
{/if}
<div
	class="flex flex-col gap-3 p-4 border-white border-2 rounded-lg bg-slate-950"
>
	<button class="bg-green-600 p-3 rounded-md" on:click={handleCreateWallet}
		>Create Wallet <br /> (Recommended)</button
	>
	<button class="bg-blue-600 p-3 rounded-md" on:click={handleImportWallet}
		>Import from Mnemonic</button
	>
</div>

<CreateWalletModal bind:open={openCreateWalletModal} />
<ImportWalletModal bind:open={openImportWalletModal} />
