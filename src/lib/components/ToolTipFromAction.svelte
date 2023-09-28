<script lang="ts">
	export let title: string;
	export let x: number;
	export let y: number;
</script>

<div
	class="border border-white bg-neutral-700 px-3 py-1 absolute z-50 rounded-md shadow-md"
	style="
		top: {y + 5}px;
		left: {x + 5}px;"
>
	{title}
</div>
