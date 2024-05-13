<script lang="ts">
	import { goto } from '$app/navigation';
	import { useGlobalConfig } from '$lib/configuration/configuration';
	import { useOptionalWallet } from '$lib/wallet/wallet';
	import { onMount } from 'svelte';
	import '../polifills';

	var wallet = useOptionalWallet();
	var globalConfig = useGlobalConfig();

	onMount(async () => {
		if ($wallet == null) {
			await goto('/setup');
		} else {
			if ($globalConfig.useAdvancedMode) {
				await goto('/app/advanced');
			} else {
				await goto('/app/simple');
			}
		}
	});
</script>
