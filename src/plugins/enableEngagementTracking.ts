import debounce from 'lodash/debounce';

import { Plausible } from '../Plausible';
import { EngagementTimeTracker } from './EngagementTimeTracker';

function getMaxScroll() {
	return document.body.scrollHeight - window.innerHeight;
}

export const enableEngagementTracking = (plausible: Plausible) => {
	if (typeof window === 'undefined') return;

	const engagementTracker = new EngagementTimeTracker();
	let maxScroll = 0;

	const trackEngagement = debounce(
		() => {
			const scrollDepth = Math.min(
				100,
				Math.round((maxScroll / getMaxScroll()) * 100),
			);

			plausible.sendEvent('Page engagement', {
				props: {
					scrollDepth,
					timeOnPage: Math.round(engagementTracker.getTotalTime() / 1000),
				},
			});
		},
		1500,
		{ leading: true, maxWait: 3000 },
	);

	const trackUserAction = () => {
		// Ignore events if window is inactive
		if (!engagementTracker.isActive()) return;

		maxScroll = Math.max(maxScroll, window.scrollY);
		trackEngagement();
	};

	engagementTracker.start();
	const visibilityChangeCleanup =
		engagementTracker.onVisibilityChanged(trackUserAction);
	window.addEventListener('scroll', trackUserAction);
	return () => {
		window.removeEventListener('scroll', trackUserAction);
		visibilityChangeCleanup();
		engagementTracker.stop();
	};
};
