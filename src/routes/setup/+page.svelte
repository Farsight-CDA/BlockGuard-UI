<script lang="ts">
	import { onMount } from "svelte";
	import CreateWalletModal from "./CreateWalletModal.svelte";
	import ImportWalletModal from "./ImportWalletModal.svelte";

    let openCreateWalletModal: (() => void);
    let openImportWalletModal: (() => void);

    function handleCreateWallet() {
        openCreateWalletModal();
    }

    function handleImportWallet() {
        openImportWalletModal();
    }
</script>

<h2 class="text-lg font-bold">Welcome to BlockGuard!</h2>

<div class="flex flex-col gap-3 p-4 border-white border-2 rounded-lg bg-slate-950">
    <button class="bg-green-600 p-3 rounded-md" on:click={handleCreateWallet}>Create Wallet <br /> (Recommended)</button>
    <button class="bg-blue-600 p-3 rounded-md" on:click={handleImportWallet}>Import from Mnemonic</button>
</div>

<CreateWalletModal bind:open={openCreateWalletModal} />
<ImportWalletModal bind:open={openImportWalletModal} />