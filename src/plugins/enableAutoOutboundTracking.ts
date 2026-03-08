import { Plausible } from '../Plausible';
import { noop } from '../utils/noop';

export const enableAutoOutboundTracking = (plausible: Plausible) => {
	if (typeof window === 'undefined') return noop;

	const clickCallback = (event: MouseEvent) => {
		// Iterate over all targets to find Anchor element and take its text
		// We do it instead of handle target, since click may appear on nested element
		for (const node of event.composedPath()) {
			if (!(node instanceof HTMLAnchorElement)) continue;

			plausible.sendEvent('Outbound Link: Click', {
				props: {
					url: node.href,
				},
			});
		}
	};

	document.addEventListener('click', clickCallback, { capture: true });

	return function cleanup() {
		document.removeEventListener('click', clickCallback, { capture: true });
	};
};
