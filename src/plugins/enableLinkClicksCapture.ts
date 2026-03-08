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
		// See the docs https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
		const isMainButton = event.button === 0;
		const isMiddleButton = event.button === 1;

		// Skip any clicks except default click (via tap/left mouse button),
		// and mouse middle button click.
		if (!isMainButton && !isMiddleButton) return;

		// Iterate over all targets to find Anchor element and take its text
		// We do it instead of handle target, since click may appear on nested element
		const linkElement = event
			.composedPath()
			.find((node) => node instanceof HTMLAnchorElement) as
			| HTMLAnchorElement
			| undefined;
		if (!linkElement) return;

		const url = linkElement.href;
		const text = (linkElement.textContent as string | null)?.trim() ?? '';

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
	document.addEventListener('auxclick', clickCallback);

	return function cleanup() {
		document.removeEventListener('click', clickCallback, { capture: true });
		document.removeEventListener('auxclick', clickCallback);
	};
};
