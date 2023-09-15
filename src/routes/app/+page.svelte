<script lang="ts">
	import { WALLET, type Wallet } from "$lib/wallet/wallet";
	import { onMount } from "svelte";
	import AddLocationModal from "./AddLocationModal.svelte";
	import StatusLamps from "./StatusLamps.svelte";


    var wallet: Wallet;
    $: wallet = $WALLET!;

    let openAddActiveLocationModal: (() => void);

    function handleAddActiveLocation() {
        openAddActiveLocationModal();
    }
</script>

<AddLocationModal bind:open={openAddActiveLocationModal}></AddLocationModal>

<div class="flex flex-col gap-6 w-full h-full items-center justify-center">
    <div class="w-5/6 xl:w-1/3">
        <StatusLamps></StatusLamps>
    </div>

    <div class="w-5/6 xl:w-1/3 bg-neutral-900 rounded-md flex flex-col justify-center p-4 gap-2">
        <h2 class="text-xl font-bold">Active Connection</h2>
    </div>
    
    <div class="w-5/6 xl:w-1/3 bg-neutral-900 rounded-md flex flex-col justify-center p-4 gap-2">
        <h2 class="text-xl font-bold">Active Locations</h2>
    
        <button class="bg-blue-500 rounded-md px-4 py-1" on:click={handleAddActiveLocation}>Add</button>
    
        <table>
            <thead>
                <tr>
                    <th>
                        Location
                    </th>
                    <th>
                        Age
                    </th>
                    <th>
                        Actions
                    </th>
                </tr>
        
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
    
    
</div>




