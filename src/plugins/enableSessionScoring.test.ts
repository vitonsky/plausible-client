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

	expect(mockFetch.mock.calls).not.toEqual([]);

	expect(mockFetch.mock.calls).toMatchSnapshot();
});
