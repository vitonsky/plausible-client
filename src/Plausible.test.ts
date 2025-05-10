import { Plausible } from './Plausible';

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
});

test('should call fetch with correct params', async () => {
	mockFetch.mockReturnValue(new Response('ok'));

	const plausible = new Plausible({
		apiHost: 'https://plausible.io',
		domain: 'example.org',
	});

	expect(
		plausible.sendEvent('test', {
			props: {
				foo: 1,
				bar: 'string',
				baz: null,
			},
		}),
	).resolves.toBeUndefined();

	expect(mockFetch.mock.calls).toEqual([
		[
			'https://plausible.io/api/event',
			{
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: JSON.stringify({
					n: 'test',
					u: 'https://example.org/',
					d: 'example.org',
					r: null,
					w: 1024,
					h: 0,
					p: JSON.stringify({
						foo: 1,
						bar: 'string',
						baz: null,
					}),
				}),
				keepalive: true,
			},
		],
	]);
});

test('events filter', async () => {
	mockFetch.mockReturnValue(new Response('ok'));

	const filter = vi.fn();

	const plausible = new Plausible({
		apiHost: 'https://plausible.io',
		domain: 'example.org',
		filter,
	});

	// Event will not be sent
	vi.clearAllMocks();
	filter.mockReturnValue(false);
	await expect(plausible.sendEvent('test')).resolves.toBeUndefined();
	expect(filter.mock.calls).toEqual([
		[
			{
				deviceWidth: 1024,
				hashMode: false,
				referrer: null,
				url: 'https://example.org/',
			},
		],
	]);
	expect(mockFetch.mock.calls).toEqual([]);

	// Event will be sent
	vi.clearAllMocks();
	filter.mockReturnValue(true);
	await expect(plausible.sendEvent('test')).resolves.toBeUndefined();
	expect(filter.mock.calls).toEqual([
		[
			{
				deviceWidth: 1024,
				hashMode: false,
				referrer: null,
				url: 'https://example.org/',
			},
		],
	]);
	expect(mockFetch.mock.calls).toEqual([
		[
			'https://plausible.io/api/event',
			{
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: JSON.stringify({
					n: 'test',
					u: 'https://example.org/',
					d: 'example.org',
					r: null,
					w: 1024,
					h: 0,
					p: undefined,
				}),
				keepalive: true,
			},
		],
	]);

	// Event will not be sent
	vi.clearAllMocks();
	filter.mockReturnValue(false);
	await expect(plausible.sendEvent('test')).resolves.toBeUndefined();
	expect(filter.mock.calls).toEqual([
		[
			{
				deviceWidth: 1024,
				hashMode: false,
				referrer: null,
				url: 'https://example.org/',
			},
		],
	]);
	expect(mockFetch.mock.calls).toEqual([]);
});
