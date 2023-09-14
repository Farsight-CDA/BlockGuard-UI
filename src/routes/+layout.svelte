<script lang="ts">
	import { onMount } from "svelte";
    import "../app.css";
    import Logo from "@static/logo.webp"
	import { NATIVE_API, initializeNativeAPI } from "$lib/native-api/native-api";
	import { initializeWallet } from "$lib/wallet/wallet";
	import { WALLET, initializeGlobalConfig } from "$lib/configuration/configuration";
	import { goto } from "$app/navigation";
	import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

    var initialized: boolean = false;

    onMount(async () => {
        const nativeApiWorks = await initializeNativeAPI();
        const globalConfigWorks = await initializeGlobalConfig();
        const walletWorks = await initializeWallet();

        setTimeout(() => {
            if (!nativeApiWorks) {
                goto("/error");
            }
            else {
                if (!walletWorks) {
                    goto("/setup");
                } else {
                    goto("/dashboard");
                }
            }

            initialized = true;
        }, 250);
    });
</script>

<div class="flex flex-col h-full w-full">
    <nav class="bg-gray-900 py-2 px-3">
        <div class="flex flex-row gap-3 items-center">
            <img src="{Logo}" alt="" class="h-12">
            <h1 class="font-bold text-xl">BlockGuard</h1>
        </div>
    </nav>
    <main class="bg-black h-full overflow-y-auto overflow-x-hidden p-3 flex flex-col items-center">
        {#if !initialized}
            <div class="w-full h-full flex justify-center items-center">
                <LoadingSpinner class="lg:w-1/12 w-1/6"></LoadingSpinner>
            </div>
        {:else}
            <slot />
        {/if}
    </main>
    
</div>
