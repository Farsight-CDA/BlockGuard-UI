<script lang="ts">
	import MnemonicsForm from '$lib/components/MnemonicsForm.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { useRequiredWallet } from '$lib/wallet/wallet';
	import { scale } from 'svelte/transition';

	var wallet = useRequiredWallet();

	export let open: () => Promise<void>;

	export let mnemonics: string;

	function copyToClipboard() {
		navigator.clipboard.writeText(mnemonics);
	}
</script>

<Modal bind:open>
	<div
		class="flex flex-col items-center gap-4"
		transition:scale={{ duration: 200, delay: 0 }}
		on:introstart
		on:outroend
	>
		<h2 class="font-bold text-lg">Export your Mnemonics</h2>

		<MnemonicsForm {mnemonics} mode="View" exposed={true}></MnemonicsForm>
	</div>
</Modal>
