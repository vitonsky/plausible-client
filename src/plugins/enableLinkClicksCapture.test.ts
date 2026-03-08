// @vitest-environment jsdom

import { Plausible } from '../Plausible';
import { enableLinkClicksCapture } from './enableLinkClicksCapture';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const locationSpyon = vi.spyOn(window, 'location', 'get');

beforeEach(() => {
	vi.clearAllMocks();
	locationSpyon.mockReturnValue(new URL('https://example.org') as any as Location);
	mockFetch.mockReturnValue(new Response('ok'));

	document.body.innerHTML = `<a id="link" href="https://example.com">click me</a>`;
});

const plausible = new Plausible({
	apiHost: 'https://plausible.io',
	domain: 'example.org',
});

enableLinkClicksCapture(plausible);

test('Ignore right-click (button=2) on a link', () => {
	const anchorElm = document.querySelector('a#link') as HTMLAnchorElement;
	expect(anchorElm).toBeInstanceOf(HTMLAnchorElement);

	anchorElm.dispatchEvent(new MouseEvent('click', { button: 2, bubbles: true }));

	expect(mockFetch).not.toHaveBeenCalled();
});

test('Capture middle mouse button click via auxclick event', () => {
	const anchorElm = document.querySelector('a#link') as HTMLAnchorElement;
	expect(anchorElm).toBeInstanceOf(HTMLAnchorElement);

	anchorElm.dispatchEvent(new MouseEvent('auxclick', { button: 1, bubbles: true }));

	expect(mockFetch).toHaveBeenCalledTimes(1);
	expect(mockFetch).toHaveBeenCalledWith(
		'https://plausible.io/api/event',
		expect.objectContaining({
			method: 'POST',
		}),
	);
});
