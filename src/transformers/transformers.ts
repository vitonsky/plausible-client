import { EventTransformer } from '../Plausible';

export const transformers = (transformers: EventTransformer[]): EventTransformer => {
	return (event, eventName) => {
		return transformers.reduce(
			(event, transformer) => transformer(event, eventName),
			event,
		);
	};
};
