<script lang="ts">
	import { WALLET, type Wallet } from "$lib/wallet/wallet";
	import { onMount } from "svelte";

    var wallet: Wallet;
    $: wallet = $WALLET!;
</script>

<button>
    {wallet.getAddress()}
</button>