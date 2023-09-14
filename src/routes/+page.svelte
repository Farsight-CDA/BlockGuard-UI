<script lang="ts">
	import { goto } from "$app/navigation";
	import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
	import { NATIVE_API } from "$lib/native-api/native-api";
	import { WALLET, initializeWallet } from "$lib/wallet/wallet";
	import { onMount } from "svelte";

    onMount(() => {
        if (NATIVE_API == null) {
            goto("/error");
        }

        if ($WALLET == null) {
            goto("/setup");
        } else {
            goto("/dashboard");
        }
    });
</script>


