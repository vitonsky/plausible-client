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
				if (url.startsWith(location.origin)) return false;
			}

			// Apply user filter
			if (config.filter) return config.filter(url, text);

			return true;
		},
	});
};
