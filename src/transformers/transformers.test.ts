// @vitest-environment jsdom
import { EventProps } from '../Plausible';
import { transformers } from './transformers';

const eventProps = {
	url: '/',
	referrer: null,
	deviceWidth: 0,
} satisfies EventProps;

test('Apply all transformers', () => {
	const transformer = transformers([
		(event) => ({ ...event, props: { foo: 100 } }),
		(event) => {
			event.props!.foo = 1;
			return event;
		},
		(event) => {
			event.props!.bar = 2;
			return event;
		},
	]);

	expect(transformer({ ...eventProps, props: {} }, 'test')).toEqual({
		...eventProps,
		props: {
			foo: 1,
			bar: 2,
		},
	} satisfies EventProps);
});
