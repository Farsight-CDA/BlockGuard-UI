<script lang="ts">
	import { goto } from '$app/navigation';
	import { GLOBAL_CONFIG } from '$lib/configuration/configuration';
	import { NATIVE_API } from '$lib/native-api/native-api';
	import { WALLET } from '$lib/wallet/wallet';
	import { onMount } from 'svelte';

	onMount(async () => {
		if (NATIVE_API == null) {
			await goto('/error');
		}

		if ($WALLET == null) {
			await goto('/setup');
		} else {
			if ($GLOBAL_CONFIG?.useAdvancedMode) {
				await goto('/app/advanced');
			} else {
				await goto('/app/simple');
			}
		}
	});
</script>
