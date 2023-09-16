<script lang="ts">
	import { scale } from "svelte/transition";
	import  { type Wallet, WALLET } from "$lib/wallet/wallet";
	import { MsgCreateDeployment } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg";
    import HelloWorldSDL from "@static/hello-world.txt"
	import { SDL } from "@playwo/akashjs/build/sdl";
    import node from "node:crypto"
	import { base64ToUInt } from "$lib/utils/utils";
    import { toBase64 } from "pvutils"
	import type { DeployedRemote } from "$lib/types/types";
	import type { Writable } from "svelte/store";

    let dialogElement: HTMLDialogElement;
    var isOpen: boolean = false;

    var wallet: Wallet;
    $: wallet = $WALLET!;

    async function trigger() {
        const res = await fetch(HelloWorldSDL)
        const sdlText = await (res).text();

        const sdl = SDL.fromString(sdlText, "beta3");

        const msg = MsgCreateDeployment.fromPartial({
            deposit: {
                denom: "uakt",
                amount: "5000000"
            },
            version: await sdl.manifestVersion() ,
            depositor: wallet.getAddress(),
            id: {
                owner: wallet.getAddress(),
                dseq: 5
            },
            groups: sdl.v3Groups()
        });

        await wallet.createDeplyoment(msg)
    }

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
    <div class="flex flex-col items-center gap-4" transition:scale={{ duration: 200, delay: 0 }} on:introstart on:outroend>
        <h2 class="font-bold text-lg">Add Active Location</h2>

        1. <button on:click={trigger}>Create Deployment</button>

        2. Select Location
    </div>
    {/if}
</dialog>