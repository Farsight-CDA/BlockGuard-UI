<script lang="ts">
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		initializeGlobalConfig,
		useGlobalConfig
	} from '$lib/configuration/configuration';
	import { initializeNativeAPI } from '$lib/native-api/native-api';
	import { initializeWalletStore, useOptionalWallet } from '$lib/wallet/wallet';
	import Gear from '$static/gear.svg';
	import Logo from '$static/logo.webp';
	import SettingsIcon from '$static/settings.svg';
	import { onMount } from 'svelte';
	import '../app.css';
	import ExportMnemonicModal from './app/ExportMnemonicModal.svelte';

	var wallet: ReturnType<typeof useOptionalWallet>;
	var globalConfig: ReturnType<typeof useGlobalConfig>;

	var initialized: boolean = false;

	onMount(async () => {
		const nativeApiWorks = await initializeNativeAPI();
		const globalConfigWorks = await initializeGlobalConfig();
		const walletWorks = await initializeWalletStore();

		wallet = useOptionalWallet();
		globalConfig = useGlobalConfig();

		if (!nativeApiWorks || !globalConfigWorks) {
			await goto('/error');
		} else {
			if (!walletWorks) {
				await goto('/setup');
			} else {
				if ($globalConfig?.useAdvancedMode) {
					await goto('/app/advanced');
				} else {
					await goto('/app/simple');
				}
			}
		}

		initialized = true;
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

	export let openExportMnemonicModal: () => Promise<void>;
	sidebarOpen = true;
	sidebarTranslate = -80;
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
			class="absolute top-0 right-0 flex flex-col h-full items-center gap-5
            rounded-l-2xl bg-black p-4"
			style={`width: ${sidebarWith - 0.8}%`}
		>
			<span class="mr-3 text-lg font-medium text-gray-300"> Settings </span>
			<div class="bg-gray-900 p-4 rounded-lg w-full">
				<label class="flex justify-between items-center cursor-pointer">
					<img class="h-6" src={SettingsIcon} alt="" />

					<span class="ml-1 text-sm font-medium text-gray-300">
						Advanced Mode
					</span>
					<div class="ml-auto relative inset-y-0 right-0 w-11 h-6">
						<input
							type="checkbox"
							class="sr-only peer"
							checked={$globalConfig?.useAdvancedMode}
							on:change={(e) =>
								globalConfig.setAdvancedMode(e.currentTarget.checked)}
						/>
						<div
							class="w-11 h-6 bg-gray-200 rounded-full
							peer dark:bg-gray-700 peer-checked:after:translate-x-full
							after:absolute after:top-[2px] after:left-[2px] after:bg-white
							after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
						></div>
					</div>
				</label>
			</div>

			{#if $wallet != null}
				<button
					on:click={openExportMnemonicModal}
					class="bg-gray-900 p-3 rounded-md w-full">Export Mnemonics</button
				>
				<ExportMnemonicModal
					mnemonics={$wallet.getMnemonic()}
					bind:open={openExportMnemonicModal}
				/>
				<button
					on:click={logout}
					class={`${
						showConfirmation ? 'bg-red-600 p-3 ' : 'bg-red-900 p-3 '
					} w-full rounded-md mt-auto`}
					>{showConfirmation ? 'You sure?' : 'Log Out'}</button
				>
			{/if}
		</div>
	{/if}
</div>
