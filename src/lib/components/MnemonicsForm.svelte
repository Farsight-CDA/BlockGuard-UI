<script lang="ts">
	import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';

	var words: 12 | 24 = 12;

	export let mode: 'Readonly' | 'Modifyable';

	export let mnemonics: string | null = null;
	var mnemonicsInner: string | null = null;
	$: mnemonicsInner = mnemonics;
	$: finalizeMnemonics(isValid, words);

	export let isValid: boolean = false;
	$: validateMnemonics(mnemonicsArr, words).then((x) => (isValid = x));

	var mnemonicsArr: string[] = [];
	$: mnemonicsArr = mnemonicsInner?.split(' ') ?? [];

	var hoverMap: { [index: number]: boolean } = {};
	var focusMap: { [index: number]: boolean } = {};

	async function validateMnemonics(mnemonicsArr: string[], words: number) {
		if (mnemonicsArr.length == 0) {
			return false;
		}

		if (mnemonicsArr.length < words) {
			return false;
		}

		try {
			await DirectSecp256k1HdWallet.fromMnemonic(
				mnemonicsArr
					.reduce(
						(prev, curr, i) => `${prev}` + (i < words ? ` ${curr}` : ''),
						''
					)
					.trim()
			);
			return true;
		} catch (error) {
			return false;
		}
	}

	function finalizeMnemonics(isValid: boolean, words: number) {
		if (!isValid) {
			return;
		}

		mnemonics = mnemonicsArr
			.reduce((prev, curr, i) => `${prev}` + (i < words ? ` ${curr}` : ''), '')
			.trim();
	}

	function setMnemonicWord(word: string, index: number) {
		if (index >= words) {
			words = 24;
		}

		if (mnemonicsInner == null) {
			mnemonicsInner = ' '.repeat(index) + word;
			return;
		}

		var traversedLetters = 0;
		var lettersToReplace = 0;
		for (let i = 0; i < mnemonicsInner.length; i++) {
			if (mnemonicsInner[i] == ' ') {
				if (index == 0) {
					break;
				}

				index--;
			} else if (index == 0) {
				lettersToReplace++;
			}

			traversedLetters++;
		}

		if (index == 0) {
			mnemonicsInner = `${mnemonicsInner.substring(
				0,
				traversedLetters - lettersToReplace
			)}${word}${mnemonicsInner.substring(traversedLetters)}`.trim();
		} else {
			mnemonicsInner = `${mnemonicsInner}${' '.repeat(index)}${word}`.trim();
		}

		mnemonicsArr = mnemonicsInner?.split(' ') ?? [];
	}

	function handleInputPaste(e: ClipboardEvent, index: number) {
		e.stopPropagation();
		e.preventDefault();
		const data = e.clipboardData?.getData('Text') ?? '';
		const words = data.trim().split(' ');
		words.forEach((word, i) => setMnemonicWord(word, index + i));
	}

	function handleInput(element: HTMLInputElement, index: number) {
		element.value = element.value.trim();
		setMnemonicWord(element.value.trim(), index);
	}
</script>

<div class="flex flex-col items-center gap-5">
	<div class="flex flex-row gap-5 bg-slate-950 p-1 rounded-full">
		<button
			class="rounded-full px-3 py-1"
			class:bg-slate-800={words == 12}
			on:click={() => (words = 12)}
			disabled={words == 12}>12 words</button
		>
		<button
			class="rounded-full px-3 py-1"
			class:bg-slate-800={words == 24}
			on:click={() => (words = 24)}
			disabled={words == 24}>24 words</button
		>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each Array.from(Array(words).keys()) as i}
			<div class="flex flex-row items-center justify-end">
				<p class="w-6">{i + 1}.</p>
				<input
					contenteditable="true"
					class="p-2 bg-slate-950 border-gray-700 border rounded-lg w-11/12"
					type={hoverMap[i] || focusMap[i] ? 'text' : 'password'}
					value={mnemonicsArr[i] ?? ''}
					readonly={mode == 'Readonly'}
					on:mouseover={() => (hoverMap[i] = true)}
					on:mouseout={() => (hoverMap[i] = false)}
					on:focus={() => (focusMap[i] = true)}
					on:blur={() => (focusMap[i] = false)}
					on:paste={(e) => handleInputPaste(e, i)}
					on:input={(e) => handleInput(e.currentTarget, i)}
				/>
			</div>
		{/each}
	</div>
</div>