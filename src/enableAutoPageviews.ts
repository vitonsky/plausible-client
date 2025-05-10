import { Plausible } from './Plausible';

// Source: https://github.com/plausible/plausible-tracker/blob/ab75723ad10660cbaee3718d1b0a670e2dfd717d/src/lib/tracker.ts#L253-L284
export const enableAutoPageviews = (plausible: Plausible) => {
	const trackPageview = () => plausible.sendEvent('pageview');
	const page = () => trackPageview();
	// Attach pushState and popState listeners
	const originalPushState = history.pushState;
	if (originalPushState) {
		history.pushState = function(data, title, url) {
			originalPushState.apply(this, [data, title, url]);
			page();
		};
		addEventListener('popstate', page);
	}

	// Trigger first page view
	trackPageview();

	return function cleanup() {
		if (originalPushState) {
			history.pushState = originalPushState;
			removeEventListener('popstate', page);
		}
	};
};
