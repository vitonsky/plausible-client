// @vitest-environment jsdom
import { EventProps } from '../Plausible';
import { BrowserUIDStorage, CookieStorage, userId } from './userId';

const eventProps = {
	url: '/',
	referrer: null,
	deviceWidth: 0,
} satisfies EventProps;

test('UID must be persistent', () => {
	const transformer = userId();
	expect(localStorage.getItem('plausible_uid')).toEqual(null);

	expect(transformer({ ...eventProps, props: {} }, 'test')).toEqual({
		...eventProps,
		props: {
			uid: expect.any(String),
		},
	} satisfies EventProps);

	const uid = localStorage.getItem('plausible_uid');
	expect(uid).not.toEqual(null);

	expect(transformer({ ...eventProps, props: {} }, 'test')).toEqual({
		...eventProps,
		props: {
			uid,
		},
	} satisfies EventProps);
	expect(localStorage.getItem('plausible_uid')).toEqual(uid);
});

test('UID must be stored in provided storage with a specified key', () => {
	const storage = new CookieStorage();
	expect(storage.getItem('uid')).toEqual(null);

	const transformer = userId({
		storage: new BrowserUIDStorage({ store: storage, key: 'uid' }),
	});
	expect(transformer({ ...eventProps, props: {} }, 'test')).toEqual({
		...eventProps,
		props: {
			uid: expect.any(String),
		},
	} satisfies EventProps);

	expect(storage.getItem('uid')).not.toEqual(null);
});

test('UID must be added when props is undefined', () => {
	const transformer = userId();
	expect(transformer(eventProps, 'test')).toEqual({
		...eventProps,
		props: {
			uid: expect.any(String),
		},
	} satisfies EventProps);
});

test('UID must be merged with props', () => {
	const transformer = userId();
	expect(transformer({ ...eventProps, props: { foo: 1, bar: '2' } }, 'test')).toEqual({
		...eventProps,
		props: {
			uid: expect.any(String),
			foo: 1,
			bar: '2',
		},
	} satisfies EventProps);
});
