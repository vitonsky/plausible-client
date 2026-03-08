// @vitest-environment node
import { filters, skipByFlag, skipForHosts } from './filters';
import { Plausible } from './Plausible';
import { enableAutoOutboundTracking } from './plugins/enableAutoOutboundTracking';
import { enableAutoPageviews } from './plugins/enableAutoPageviews';
import { enableSessionScoring } from './plugins/enableSessionScoring';
import { transformers, userId } from './transformers';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const randomUUIDSpy = vi.spyOn(globalThis.crypto, 'randomUUID');

beforeEach(() => {
	vi.clearAllMocks();
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
			revenue: {
				currency: 'USD',
				amount: 1,
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
					u: '',
					d: 'example.org',
					r: null,
					w: 0,
					h: 0,
					p: JSON.stringify({
						foo: 1,
						bar: 'string',
						baz: null,
					}),
					revenue: JSON.stringify({
						currency: 'USD',
						amount: 1,
					}),
				}),
				keepalive: true,
			},
		],
	]);
});

test('plugins must not throw in a server environment', async () => {
	mockFetch.mockReturnValue(new Response('ok'));

	const fakeUUID = '000-000-000-000-000';
	randomUUIDSpy.mockReturnValue(fakeUUID);

	const plausible = new Plausible({
		apiHost: 'https://plausible.io',
		domain: 'example.org',
		filter: filters(skipForHosts(['localhost']), skipByFlag('test')),
		transform: transformers(userId()),
	});

	enableAutoPageviews(plausible);
	enableAutoOutboundTracking(plausible);
	enableSessionScoring(plausible);

	await plausible.sendEvent('test', {
		props: {
			foo: 1,
			bar: 'string',
			baz: null,
		},
		revenue: {
			currency: 'USD',
			amount: 1,
		},
	});

	expect(mockFetch.mock.calls).toEqual([
		[
			'https://plausible.io/api/event',
			{
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: JSON.stringify({
					n: 'test',
					u: '',
					d: 'example.org',
					r: null,
					w: 0,
					h: 0,
					p: JSON.stringify({
						foo: 1,
						bar: 'string',
						baz: null,
						uid: fakeUUID,
					}),
					revenue: JSON.stringify({
						currency: 'USD',
						amount: 1,
					}),
				}),
				keepalive: true,
			},
		],
	]);
});
