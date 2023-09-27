<script lang="ts">
	import { useGlobalConfig } from '$lib/configuration/configuration';
	import CreateWalletModal from './CreateWalletModal.svelte';
	import ImportWalletModal from './ImportWalletModal.svelte';
	import WelcomeAnimation from './WelcomeAnimation.svelte';

	let openCreateWalletModal: () => Promise<void>;
	let openImportWalletModal: () => Promise<void>;

	var globalConfig = useGlobalConfig();

	function handleCreateWallet() {
		openCreateWalletModal();
	}

	function handleImportWallet() {
		openImportWalletModal();
	}
</script>

<WelcomeAnimation>
	<div class="w-full h-full items-center justify-center flex flex-col">
		<div
			class="rounded-xl p-5 bg-neutral-800 bg-opacity-75 text-center drop-shadow-glow-black-100"
		>
			<h2 class="text-2xl font-bold">Welcome to BlockGuard VPN!</h2>
			<p>Your permissionless gateway to a free internet.</p>

			<hr class="mt-3" />

			<div class="flex flex-col gap-8 p-4 rounded-lg">
				<button
					class="bg-green-600 p-3 hover:bg-green-500 drop-shadow-glow-green-400 rounded-md"
					on:click={handleCreateWallet}
					>Create Wallet <br /> (Recommended)</button
				>
				<button
					class="bg-blue-600 hover:bg-blue-500 p-3 shadow-lg drop-shadow-glow-blue-400 rounded-md"
					on:click={handleImportWallet}>Import existing wallet</button
				>
			</div>
		</div>

		<CreateWalletModal bind:open={openCreateWalletModal} />
		<ImportWalletModal bind:open={openImportWalletModal} />
	</div>
</WelcomeAnimation>
