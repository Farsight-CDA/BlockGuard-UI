<script lang="ts">
	import { scale } from "svelte/transition";
	import  { type Wallet, WALLET } from "$lib/wallet/wallet";
	import { MsgCreateDeployment } from "@playwo/akashjs/build/protobuf/akash/deployment/v1beta3/deploymentmsg";
    import HelloWorldSDL from "@static/hello-world.txt"
	import { SDL } from "@playwo/akashjs/build/sdl";
	import type { DeployedRemote, DeploymentBid } from "$lib/types/types";
	import { onDestroy } from "svelte";


    let dialogElement: HTMLDialogElement;
    var isOpen: boolean = false;

    var refreshInterval: NodeJS.Timeout;

    var wallet: Wallet;
    $: wallet = $WALLET!;

    var bids: DeploymentBid[] | null = null;

    async function trigger() {
        const res = await fetch(HelloWorldSDL)
        const sdlText = await (res).text();

        const sdl = SDL.fromString(sdlText, "beta3");
        const dseq = Math.round(Math.random() * 100000000);

        const msg = MsgCreateDeployment.fromPartial({
            deposit: {
                denom: "uakt",
                amount: "5000000"
            },
            version: await sdl.manifestVersion() ,
            depositor: wallet.getAddress(),
            id: {
                owner: wallet.getAddress(),
                dseq: dseq
            },
            groups: sdl.v3Groups()
        });

        await wallet.createDeplyoment(msg);

        refreshInterval = setInterval(async () => bids = await wallet.getDeploymentBids(dseq), 2000);        
    }

    export const open = function open() {
        dialogElement.showModal();
        isOpen = true;


    }

    onDestroy(() => {
        clearInterval(refreshInterval);
    }); 

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

        <table>
            <thead>
                <tr>
                    <th>
                        Location
                    </th>
                    <th>
                        Provider
                    </th>
                    <th>
                        Price
                    </th>
                    <th>
                        Speed
                    </th>
                </tr>
            </thead>
            <tbody class="text-center">
                {#if bids != null}
                    {#each bids as bid}
                        <!-- svelte-ignore empty-block -->
                        {#await wallet.getProviderDetails(bid.provider)}
                        {:then details} 
                            <tr>
                                <td>
                                    {details.region} ({details.country}, {details.city})
                                </td>
                                <td>
                                    {details.organization} {details.website}
                                <td>
                                    {bid.price} uakt / block
                                </td>
                                <td>
                                    <p>DOWN: {details.networkDownload}</p>
                                    <p>UP: {details.networkUpload}</p>
                                </td>
                            </tr>

                        {/await}

                    {/each}
                {/if}
            </tbody>
        </table>



    </div>
    {/if}
</dialog>