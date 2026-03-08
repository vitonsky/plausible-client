// @vitest-environment jsdom
import { filters, skipByFlag, skipForHosts } from './filters';
import { EventProps } from './Plausible';

const eventProps = {
	url: '/',
	referrer: null,
	deviceWidth: 0,
} satisfies EventProps;

const setURL = (url: string) => {
	Object.defineProperty(window, 'location', {
		value: new URL(url),
		writable: true,
	});
};

const spyConsoleWarn = vi.spyOn(console, 'warn');

beforeEach(() => {
	setURL('https://example.org/');
	vi.resetAllMocks();
});

test('Skip hosts', () => {
	const transformer = skipForHosts();

	setURL('https://example.org/');
	expect(transformer(eventProps, 'test')).toBe(true);

	setURL('http://localhost/');
	expect(transformer(eventProps, 'test')).toBe(false);

	const transformer2 = skipForHosts(['google.com', 'example.com']);

	setURL('http://google.com/');
	expect(transformer2(eventProps, 'test')).toBe(false);
	expect(spyConsoleWarn).lastCalledWith(
		`Analytics event "test" is skipped because of hostname is google.com`,
		eventProps,
	);

	setURL('http://example.com/');
	expect(transformer2(eventProps, 'test')).toBe(false);
	expect(spyConsoleWarn).lastCalledWith(
		`Analytics event "test" is skipped because of hostname is example.com`,
		eventProps,
	);

	setURL('http://localhost/');
	expect(transformer2(eventProps, 'test')).toBe(true);
	setURL('https://example.org/');
	expect(transformer(eventProps, 'test')).toBe(true);
});

test('Skip by flag in storage', () => {
	const key = 'ignore';
	const transformer = skipByFlag(key, localStorage);

	localStorage.clear();
	expect(transformer(eventProps, 'test')).toBe(true);

	localStorage.setItem(key, 'true');
	expect(transformer(eventProps, 'test')).toBe(false);
	expect(transformer(eventProps, 'test')).toBe(false);
	expect(transformer(eventProps, 'test')).toBe(false);

	localStorage.setItem(key, 'false');
	expect(transformer(eventProps, 'test')).toBe(true);
});

test('Compose filters', () => {
	expect(filters()(eventProps, 'test')).toBe(true);

	expect(
		filters(
			() => true,
			() => true,
			() => true,
		)(eventProps, 'test'),
	).toBe(true);

	expect(
		filters(
			() => true,
			() => false,
			() => true,
		)(eventProps, 'test'),
	).toBe(false);
});
