// @vitest-environment node
import { Plausible } from './Plausible';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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
