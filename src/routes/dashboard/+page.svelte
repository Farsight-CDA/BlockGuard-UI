<script lang="ts">
	import { WALLET, type Wallet } from "$lib/wallet/wallet";
    import { broadcastCertificate, createCertificate } from "@akashnetwork/akashjs/build/certificates"

    var wallet: Wallet;
    $: wallet = $WALLET!;

    async function triggerPublishCertificate() {
        const cert = await createCertificate(wallet.getAddress());

        await wallet.broadcastCertificate(cert);
    }
</script>

<button>
    {wallet.getAddress()}
</button>

{#await wallet.getBalance()}
    <p>Loading Balance</p>
{:then balance} 
    <p>{balance}</p>
{/await}

<button on:click={triggerPublishCertificate}>
    Pulish Certificate
</button>