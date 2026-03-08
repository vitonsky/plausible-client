import { EventTransformer } from '../Plausible';

/**
 * Compose multiple transformers into one
 */
export const transformers = (...transformers: EventTransformer[]): EventTransformer => {
	return (event, eventName) => {
		return transformers.reduce(
			(event, transformer) => transformer(event, eventName),
			event,
		);
	};
};
