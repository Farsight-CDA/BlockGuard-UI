<script lang="ts">
	import { scale } from "svelte/transition";

    let dialogElement: HTMLDialogElement;
    var isOpen: boolean = false;

    var hasSavedMnemonics: boolean = false;

    export const open = function open() {
        dialogElement.showModal();
        isOpen = true;
    }

    function dialogClickHandler(e: MouseEvent) {
        if (e.target === dialogElement) {
            dialogElement.close();
            isOpen = false;
        }
    }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog bind:this={dialogElement} class="p-4 shadow-2xl rounded-lg bg-slate-900" on:click={dialogClickHandler} on:keydown={() => {}}>
    {#if isOpen}
    <div class="flex flex-col items-center" transition:scale={{ duration: 200, delay: 0 }} on:introstart on:outroend>
        <h2 class="font-bold text-lg mb-3">Create Wallet</h2>

        <p>Mnemonics go here...</p>

        <span>
            <input id="copied" type="checkbox" bind:checked={hasSavedMnemonics}>
            <label for="copied">I have saved the mnemonics</label>
        </span>

        <button disabled={!hasSavedMnemonics} class="px-2 py-1" 
            class:bg-green-500={hasSavedMnemonics} class:bg-gray-800={!hasSavedMnemonics}>Go to App</button>
    </div>
    {/if}
</dialog>