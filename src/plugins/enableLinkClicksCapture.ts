import { Plausible } from '../Plausible';
import { noop } from '../utils/noop';

export type LinkClickPluginConfig = {
	eventName?: string;
	captureText?: boolean;
	filter?: (url: string, text: string) => boolean;
};

export const enableLinkClicksCapture = (
	plausible: Plausible,
	config: LinkClickPluginConfig = {},
) => {
	if (typeof window === 'undefined') return noop;

	const {
		eventName = 'Link click',
		captureText = false,
		/**
		 * When filter returns `false`, the event will be dropped
		 */
		filter,
	} = config;

	const clickCallback = (event: MouseEvent) => {
		// Iterate over all targets to find Anchor element and take its text
		// We do it instead of handle target, since click may appear on nested element
		const linkElement = event
			.composedPath()
			.find((node) => node instanceof HTMLAnchorElement);
		if (!linkElement) return;

		const url = linkElement.href;
		const text = linkElement.textContent.trim();

		// Skip event
		if (filter && !filter(url, text)) return;

		plausible.sendEvent(eventName, {
			props: {
				url,
				text: captureText ? text : undefined,
			},
		});
	};

	document.addEventListener('click', clickCallback, { capture: true });

	return function cleanup() {
		document.removeEventListener('click', clickCallback, { capture: true });
	};
};
