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
		botScore: expect.any(Number),
		botSignals: expect.any(String),
		sessionAge: 0,
		language: expect.any(String),
		languages: expect.any(String),
		screenSize: '0x0',
		hardwareConcurrency: expect.any(Number),
		deviceMemory: expect.any(Number),
		devicePixelRatio: expect.any(Number),
	});
	expect(eventName).toBe('Session scored');
});
