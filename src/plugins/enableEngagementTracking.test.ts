// @vitest-environment jsdom

// WARNING: this test has been generated via LLM
// If you notice any weird things - do not hesitate to change anything

import { Plausible } from '../Plausible';
import { enableEngagementTracking } from './enableEngagementTracking';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

vi.useFakeTimers();

beforeEach(() => {
	vi.clearAllMocks();
	mockFetch.mockReset();
	mockFetch.mockImplementation(() => Promise.resolve(new Response('ok')));

	Object.defineProperty(window, 'location', {
		value: {
			href: 'https://example.org/',
			assign: vi.fn(),
			replace: vi.fn(),
		},
		writable: true,
	});

	Object.defineProperty(document, 'visibilityState', {
		value: 'visible',
		writable: true,
		configurable: true,
	});
	vi.spyOn(document, 'hasFocus').mockReturnValue(true);

	// scrollHeight=1000, innerHeight=500 → maxScroll=500
	Object.defineProperty(document.body, 'scrollHeight', {
		value: 1000,
		writable: true,
		configurable: true,
	});
	Object.defineProperty(window, 'innerHeight', {
		value: 500,
		writable: true,
		configurable: true,
	});
	Object.defineProperty(window, 'scrollY', {
		value: 0,
		writable: true,
		configurable: true,
	});
});

function makePlausible() {
	return new Plausible({
		apiHost: 'https://plausible.io',
		domain: 'example.org',
	});
}

function getLastEventBody() {
	const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
	const body = JSON.parse(lastCall[1].body);
	return { eventName: body.n, props: JSON.parse(body.p) };
}

test('sends Page engagement event on scroll', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
	window.dispatchEvent(new Event('scroll'));

	await vi.runAllTimersAsync();

	expect(mockFetch).toHaveBeenCalled();
	const { eventName, props } = getLastEventBody();
	expect(eventName).toBe('Page engagement');
	expect(props.scrollDepth).toBe(50); // 250 / 500 * 100 = 50%
});

test('tracks time on page in seconds', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	vi.advanceTimersByTime(7000);

	Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
	window.dispatchEvent(new Event('scroll'));

	await vi.runAllTimersAsync();

	const { props } = getLastEventBody();
	expect(props.timeOnPage).toBeGreaterThanOrEqual(7);
});

test('tracks max scroll depth across multiple scroll events', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	// Scroll to 80%
	Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	vi.clearAllMocks();

	// Scroll back to 20%
	Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	const { props } = getLastEventBody();
	// Max scroll should still be 80%, not 20%
	expect(props.scrollDepth).toBe(80);
});

test('scrollDepth is capped at 100', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	// Scroll far beyond page end
	Object.defineProperty(window, 'scrollY', { value: 9999, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	const { props } = getLastEventBody();
	expect(props.scrollDepth).toBe(100);
});

test('ignores scroll events when tracker is inactive', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	// Deactivate window
	vi.spyOn(document, 'hasFocus').mockReturnValue(false);
	window.dispatchEvent(new Event('blur'));

	Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	expect(mockFetch).not.toHaveBeenCalled();
});

test('sends event when tracker becomes active again (visibility callback)', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	// Deactivate
	vi.spyOn(document, 'hasFocus').mockReturnValue(false);
	window.dispatchEvent(new Event('blur'));
	await vi.runAllTimersAsync();
	vi.clearAllMocks();

	// Reactivate
	vi.spyOn(document, 'hasFocus').mockReturnValue(true);
	window.dispatchEvent(new Event('focus'));
	await vi.runAllTimersAsync();

	// The onVisibilityChanged callback fires trackUserAction -> trackEngagement
	expect(mockFetch).toHaveBeenCalled();
	const { eventName } = getLastEventBody();
	expect(eventName).toBe('Page engagement');
});

test('cleanup removes scroll listener and stops the tracker', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	expect(typeof cleanup).toBe('function');

	cleanup?.();

	Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	expect(mockFetch).not.toHaveBeenCalled();
});

test('sends event props with correct shape', async () => {
	const plausible = makePlausible();
	const cleanup = enableEngagementTracking(plausible);
	if (cleanup) onTestFinished(cleanup);

	Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
	window.dispatchEvent(new Event('scroll'));
	await vi.runAllTimersAsync();

	const { props } = getLastEventBody();
	expect(props).toMatchObject({
		scrollDepth: expect.any(Number),
		timeOnPage: expect.any(Number),
	});
});
