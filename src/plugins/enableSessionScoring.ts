import { Plausible } from '../Plausible';
import { CookieStorage } from '../transformers/CookieStorage';

export type BotDetectionResult = {
	isBot: boolean;
	score: number;
	signals: string[];
};

export function getBotSignals(): BotDetectionResult {
	let score = 0;
	const signals: string[] = [];

	// 1. WebDriver flag (strong)
	if (navigator.webdriver) {
		score += 3;
		signals.push('webdriver');
	}

	// 2. Headless Chrome userAgent
	if (/HeadlessChrome/i.test(navigator.userAgent)) {
		score += 3;
		signals.push('headless_ua');
	}

	// 3. Missing plugins (common in headless)
	if (navigator.plugins.length === 0) {
		score += 1;
		signals.push('no_plugins');
	}

	// 4. No languages defined
	if (!navigator.languages || navigator.languages.length === 0) {
		score += 1;
		signals.push('no_languages');
	}

	// 5. Broken outer/inner width ratio (headless artifact)
	if (window.outerWidth === 0 || window.outerHeight === 0) {
		score += 2;
		signals.push('zero_outer_dimensions');
	}

	// 7. Extremely low hardware signals
	if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 1) {
		score += 1;
		signals.push('low-cpu');
	}

	const isBot = score >= 3;

	return { isBot, score, signals };
}

export const enableSessionScoring = (
	plausible: Plausible,
	config: { storage?: Storage; firstVisitKey?: string } = {},
) => {
	if (typeof window === 'undefined') return;

	const {
		storage = (typeof window !== 'undefined'
			? localStorage || sessionStorage
			: undefined) || new CookieStorage(),
		firstVisitKey = 'plausible_first_visit',
	} = config;

	function getFirstVisit() {
		try {
			const firstVisitRaw = storage.getItem(firstVisitKey);
			if (!firstVisitRaw) return null;

			return new Date(firstVisitRaw);
		} catch (_error) {
			return null;
		}
	}

	const botSignals = getBotSignals();
	requestAnimationFrame(() => {
		const firstVisit = getFirstVisit();
		if (!firstVisit) {
			storage.setItem(firstVisitKey, new Date().toISOString());
		}

		plausible.sendEvent('Session scored', {
			props: {
				// Trivial bots highlighting
				botScore: botSignals.score,
				botSignals: botSignals.signals.join(','),

				sessionAge: firstVisit
					? Math.round((Date.now() - firstVisit.getTime()) / 1000)
					: 0,

				// Region
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				language: navigator.language,
				// Optional check is added for some bot browsers
				languages: navigator.languages?.join(','),

				// Device
				screenSize: `${window.screen.width}x${window.screen.height}`,
				hardwareConcurrency: navigator.hardwareConcurrency,
				deviceMemory: (navigator as any)?.deviceMemory ?? 0,
				devicePixelRatio: window.devicePixelRatio || 1,
			},
		});
	});
};
