<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		GLOBAL_CONFIG,
		initializeGlobalConfig
	} from '$lib/configuration/configuration';
	import { initializeNativeAPI } from '$lib/native-api/native-api';
	import { initializeWalletStore, useOptionalWallet } from '$lib/wallet/wallet';
	import Gear from '$static/gear.svg';
	import Logo from '$static/logo.webp';
	import { onMount } from 'svelte';
	import '../app.css';
	import ExportMnemonicModal from './app/ExportMnemonicModal.svelte';

	var wallet: ReturnType<typeof useOptionalWallet>;

	var initialized: boolean = false;

	onMount(async () => {
		const nativeApiWorks = await initializeNativeAPI();
		const globalConfigWorks = await initializeGlobalConfig();
		const walletWorks = await initializeWalletStore();

		wallet = useOptionalWallet();

		setTimeout(async () => {
			if (!nativeApiWorks) {
				await goto('/error');
			} else {
				if (!walletWorks) {
					await goto('/setup');
				} else {
					if ($GLOBAL_CONFIG?.useAdvancedMode) {
						await goto('/app/advanced');
					} else {
						await goto('/app/simple');
					}
				}
			}

			initialized = true;
		}, 250);
	});

	const sidebarWith = 80;
	let sidebarOpen = false;
	let sidebarTranslate = 0;

	function toggleSidebarAnimation() {
		if (sidebarOpen == true) {
			sidebarTranslate = 0;
		} else if (sidebarOpen == false) {
			sidebarTranslate = -sidebarWith;
		}
	}

	function closeSidebarStatus() {
		if (sidebarOpen == true) {
			closeSidebar();
		} else if (sidebarOpen == false) {
			sidebarOpen = true;
		}
	}

	function closeSidebar() {
		sidebarTranslate = 0;
		setTimeout(() => {
			sidebarOpen = false;
		}, 1000);
	}

	let showConfirmation = false;

	async function logout() {
		if (showConfirmation) {
			closeSidebar();
			await goto('/setup');
			await wallet.clear();
		}

		showConfirmation = true;

		setTimeout(() => {
			showConfirmation = false;
		}, 5000);
	}

	function openExport() {
		sidebarTranslate = 0;
		openExportMnemonicModal();
	}

	export let openExportMnemonicModal: () => Promise<void>;
</script>

<div class="flex flex-row h-full w-full">
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="flex flex-col h-full w-full z-10
        transition-transform duration-1000 transform translate-x-0"
		style={`transform: translateX(${sidebarTranslate}%)`}
		on:click={closeSidebarStatus}
	>
		<nav
			class={`bg-gray-900 py-2 px-3 flex flex-row justify-between ${
				sidebarOpen == true ? 'rounded-tr-2xl' : ''
			}`}
		>
			<div class="flex flex-row gap-3 items-center">
				<img src={Logo} alt="" class="h-12" />
				<h1 class="font-bold text-xl">BlockGuard</h1>
			</div>

			<button on:click={toggleSidebarAnimation}>
				<img src={Gear} class="h-12 invert" alt="Settings" />
			</button>
		</nav>
		<main
			class={`bg-black h-full overflow-y-auto overflow-x-hidden p-3 flex flex-col items-center ${
				sidebarOpen == true ? 'rounded-br-2xl' : ''
			}`}
		>
			{#if !initialized}
				<div class="w-full h-full flex justify-center items-center">
					<LoadingSpinner class="lg:w-1/12 w-1/6"></LoadingSpinner>
				</div>
			{:else}
				<slot />
			{/if}
		</main>
	</div>
	{#if sidebarOpen}
		<div
			class="absolute top-0 right-0 flex flex-col h-full items-center pt-32 gap-5
            rounded-l-2xl bg-gray-900"
			style={`width: ${sidebarWith - 0.8}%`}
		>
			{#if $wallet != null}
				<button on:click={logout} class="bg-red-600 p-3 rounded-md"
					>{showConfirmation ? 'You sure?' : 'Log Out'}</button
				>
				<button on:click={openExport} class="bg-green-600 p-3 rounded-md"
					>Export Mnemonics</button
				>
				<ExportMnemonicModal
					mnemonics={$wallet.getMnemonic()}
					bind:open={openExportMnemonicModal}
				/>
			{/if}
		</div>
	{/if}
</div>
