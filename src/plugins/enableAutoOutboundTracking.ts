import { Plausible } from '../Plausible';
import {
	enableLinkClicksCapture,
	LinkClickPluginConfig,
} from './enableLinkClicksCapture';

export const enableAutoOutboundTracking = (
	plausible: Plausible,
	config: LinkClickPluginConfig = {},
) => {
	return enableLinkClicksCapture(plausible, {
		eventName: 'Outbound Link: Click',
		...config,
		filter(url, text) {
			// Skip links with the same origin
			if (typeof window !== 'undefined') {
				try {
					const linkUrl = new URL(url, location.href);
					if (linkUrl.origin === location.origin) return false;
				} catch {
					// Invalid URL, let it through to be filtered by user or tracked
				}
			}

			// Apply user filter
			if (config.filter) return config.filter(url, text);

			return true;
		},
	});
};
