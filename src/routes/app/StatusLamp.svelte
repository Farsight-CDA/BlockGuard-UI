<script lang="ts" context="module">
    export enum StatusLampStatus {
        Unset,
        Error,
        ActionRequired,
        Warning,
        Ready
    }
</script>

<script lang="ts">
	import { createEventDispatcher } from "svelte";

    export let name: string;
    export let status: StatusLampStatus;
    export let clickable: boolean = false;

    export let value: number | null = null;

    const dispatch = createEventDispatcher();

    function triggerForwardClick() {
        dispatch('click');
    }    
</script>

<div class="flex flex-col gap-1 justify-center items-center bg-neutral-900 rounded-md p-2">
    <button class="w-5/6 aspect-square rounded-full flex justify-center items-center"
        on:click={triggerForwardClick} on:keydown={() => {}} disabled={!clickable}
        class:bg-neutral-500={status == StatusLampStatus.Unset}
        class:bg-red-800={status == StatusLampStatus.Error}
        class:bg-yellow-500={status == StatusLampStatus.Warning}
        class:bg-green-500={status == StatusLampStatus.Ready}
        class:bg-red-400={status == StatusLampStatus.ActionRequired}
        >
        {#if value != null}
            <p>{value}</p>
        {/if}
    </button>
    <p>{name}</p>
</div>