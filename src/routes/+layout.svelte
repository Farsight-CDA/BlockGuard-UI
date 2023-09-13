<script lang="ts">
	import { onMount } from "svelte";
    import "../app.css";
    import Logo from "@static/logo.webp"
	import { initializeNativeAPI } from "$lib/native-api/native-api";
	import { initializeWallet } from "$lib/wallet/wallet";

    onMount(() => {
        initializeNativeAPI();
        initializeWallet();
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
        <slot />
    </main>
    
</div>
