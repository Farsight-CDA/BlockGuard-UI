import ToolTipFromAction from './ToolTipFromAction.svelte';

export function tooltip(element: HTMLElement) {
	let title: string;
	let tooltipComponent: ToolTipFromAction;
	function mouseOver(event: MouseEvent) {
		title = element.getAttribute('title') ?? '';
		element.removeAttribute('title');

		tooltipComponent = new ToolTipFromAction({
			props: {
				title: title,
				x: event.pageX,
				y: event.pageY
			},
			target: document.body
		});
	}
	function mouseMove(event: MouseEvent) {
		tooltipComponent.$set({
			x: event.pageX,
			y: event.pageY
		});
	}
	function mouseLeave() {
		tooltipComponent.$destroy();
		element.setAttribute('title', title);
	}

	element.addEventListener('mouseover', mouseOver);
	element.addEventListener('mouseleave', mouseLeave);
	element.addEventListener('mousemove', mouseMove);

	return {
		destroy() {
			element.removeEventListener('mouseover', mouseOver);
			element.removeEventListener('mouseleave', mouseLeave);
			element.removeEventListener('mousemove', mouseMove);
		}
	};
}
