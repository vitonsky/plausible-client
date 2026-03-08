/* eslint-disable spellcheck/spell-checker */
// @vitest-environment jsdom

import { Plausible } from '../Plausible';
import { enableAutoOutboundTracking } from './enableAutoOutboundTracking';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const locationSpyon = vi.spyOn(window, 'location', 'get');

beforeEach(() => {
	vi.clearAllMocks();
	locationSpyon.mockReturnValue(new URL('https://example.org') as any as Location);

	mockFetch.mockReturnValue(new Response('ok'));

	document.body.innerHTML = `<div><a id="internal" href="#foo">internal link</a> <a id="external" href="https://google.com/">external link</a> <a id="nested" href="https://example.com"><span>nested text</span></a></div>`;
});

const plausible = new Plausible({
	apiHost: 'https://plausible.io',
	domain: 'example.org',
});

enableAutoOutboundTracking(plausible, { captureText: true });

test('Ignore clicks by links with the same origin', async () => {
	locationSpyon.mockReturnValue(new URL('https://example.org') as any as Location);

	const anchorElm = document.querySelector('a#internal') as HTMLAnchorElement;
	expect(anchorElm).toBeInstanceOf(HTMLAnchorElement);

	anchorElm.click();
	expect(mockFetch).not.toHaveBeenCalled();

	anchorElm.href = 'https://example.org/foo';
	anchorElm.click();
	expect(mockFetch).not.toHaveBeenCalled();

	anchorElm.href = 'https://example.org/nested/foo';
	anchorElm.click();
	expect(mockFetch).not.toHaveBeenCalled();

	anchorElm.href = '/';
	anchorElm.click();
	expect(mockFetch).not.toHaveBeenCalled();

	anchorElm.href = 'https://google.com';
	anchorElm.click();
	expect(mockFetch).toHaveBeenCalledTimes(1);
});

test('Capture click for simple link', async () => {
	const anchorElm = document.querySelector('a#external') as HTMLAnchorElement;
	expect(anchorElm).toBeInstanceOf(HTMLAnchorElement);
	anchorElm.click();

	expect(mockFetch).toHaveBeenLastCalledWith('https://plausible.io/api/event', {
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		body: JSON.stringify({
			n: 'Outbound Link: Click',
			u: 'https://example.org/',
			d: 'example.org',
			r: null,
			w: 1024,
			h: 0,
			p: JSON.stringify({
				url: 'https://google.com/',
				text: 'external link',
			}),
		}),
		keepalive: true,
	});
});

test('Capture click for link text', async () => {
	const spanElm = document.querySelector('a#nested > span') as HTMLSpanElement;
	expect(spanElm).toBeInstanceOf(HTMLSpanElement);
	spanElm.click();

	expect(mockFetch).toHaveBeenLastCalledWith('https://plausible.io/api/event', {
		method: 'POST',
		headers: { 'Content-Type': 'text/plain' },
		body: JSON.stringify({
			n: 'Outbound Link: Click',
			u: 'https://example.org/',
			d: 'example.org',
			r: null,
			w: 1024,
			h: 0,
			p: JSON.stringify({
				url: 'https://example.com/',
				text: 'nested text',
			}),
		}),
		keepalive: true,
	});
});
