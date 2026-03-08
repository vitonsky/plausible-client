// @vitest-environment jsdom

import { Plausible } from '../Plausible';
import { enableSessionScoring } from './enableSessionScoring';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

vi.useFakeTimers();

beforeEach(() => {
	vi.clearAllMocks();

	Object.defineProperty(window, 'location', {
		value: {
			href: 'https://example.org/',
			assign: vi.fn(),
			replace: vi.fn(),
		},
		writable: true,
	});
});

test('session must be scored at a next animation frame', async () => {
	mockFetch.mockReturnValue(new Response('ok'));

	const plausible = new Plausible({
		apiHost: 'https://plausible.io',
		domain: 'example.org',
	});

	enableSessionScoring(plausible);

	vi.advanceTimersToNextFrame();

	const eventBody = JSON.parse(mockFetch.mock.calls[0][1].body);
	const eventName = eventBody.n;
	const payload = JSON.parse(eventBody.p);
	expect(payload).toMatchObject({
		botScore: 1,
		botSignals: 'no_plugins',
		sessionAge: 0,
		language: 'en-US',
		languages: 'en-US,en',
		screenSize: '0x0',
		hardwareConcurrency: 16,
		deviceMemory: 0,
		devicePixelRatio: 1,
	});
	expect(eventName).toBe('Session scored');
});
