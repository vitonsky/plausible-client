/* eslint-disable spellcheck/spell-checker */
// @vitest-environment jsdom

import { Plausible } from '../Plausible';
import { enableAutoOutboundTracking } from './enableAutoOutboundTracking';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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

	mockFetch.mockReturnValue(new Response('ok'));
});

document.body.innerHTML = `<div><a href="#foo">foo</a> <a href="#bar">bar</a> <a href="#baz"><span>baz</span></a></div>`;

const plausible = new Plausible({
	apiHost: 'https://plausible.io',
	domain: 'example.org',
});

enableAutoOutboundTracking(plausible, { captureText: true });

test('Capture click for simple link', async () => {
	const anchorElm1 = document.querySelector('a[href="#foo"]') as HTMLAnchorElement;
	expect(anchorElm1).toBeInstanceOf(HTMLAnchorElement);
	anchorElm1.click();

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
				url: 'https://example.org/#foo',
				text: 'foo',
			}),
		}),
		keepalive: true,
	});
});

test('Capture click for link text', async () => {
	const spanElm = document.querySelector('a[href="#baz"] > span') as HTMLSpanElement;
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
				url: 'https://example.org/#baz',
				text: 'baz',
			}),
		}),
		keepalive: true,
	});
});
