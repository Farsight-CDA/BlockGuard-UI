<script lang="ts">
	import { useGlobalConfig } from '$lib/configuration/configuration';
	import CreateWalletModal from './CreateWalletModal.svelte';
	import ImportWalletModal from './ImportWalletModal.svelte';
	import WelcomeAnimation from './WelcomeAnimation.svelte';

	let openCreateWalletModal: () => Promise<void>;
	let openImportWalletModal: () => Promise<void>;

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

<WelcomeAnimation>
	<div class="w-full h-full items-center justify-center flex flex-col">
		<h2 class="text-2xl font-bold mb-4">Welcome to BlockGuard!</h2>
		{#if agbRead == false}
			<button
				on:click={agreeToAgb}
				class="w-full gap-3 p-4 rounded-lg mt-4
				hover:bg-gray-600 active:bg-gray-600 focus:outline-none
				focus:ring focus:ring-gray-200 max-w-lg"
			>
				<p class="text-sm font-medium text-left">
					This is your gateway to unrestricted online freedom. With us, you can
					surf the web without boundaries, breaking free from geo-blocking
					constraints. Experience the internet as it should be, where censorship
					and restrictions are a thing of the past. You should visit our webisd
					for technical information
				</p>
				<p class="text-xs text-right mt-1">press to hide this dialog</p>
			</button>
		{/if}
		<div class="flex flex-col gap-4 p-4 rounded-lg">
			<button
				class="bg-green-400 p-3 hover:bg-green-500 drop-shadow-glow-green-400 rounded-md"
				on:click={handleCreateWallet}>Create Wallet <br /> (Recommended)</button
			>
			<button
				class="bg-blue-400 hover:bg-blue-500 p-3 shadow-lg drop-shadow-glow-blue-400 rounded-md"
				on:click={handleImportWallet}>Import from Mnemonic</button
			>
		</div>

		<CreateWalletModal bind:open={openCreateWalletModal} />
		<ImportWalletModal bind:open={openImportWalletModal} />
	</div>
</WelcomeAnimation>
