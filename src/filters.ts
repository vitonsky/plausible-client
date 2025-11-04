import { EventFilter } from './Plausible';

export const skipForHosts =
	(hostnames = ['localhost']): EventFilter =>
	(event) => {
		for (const hostname of hostnames) {
			// Skip all events while development
			if (location.hostname === hostname) {
				console.warn(
					`Analytics event is skipped because of hostname is ${hostname}`,
					event,
				);
				return false;
			}
		}

		return true;
	};

export const skipByFlag =
	(key = 'plausible_ignore', storage = window.localStorage): EventFilter =>
	() =>
		storage[key] !== 'true';

/**
 * Compose multiple filters into one
 *
 * @param filters EventFilter[]
 * @returns EventFilter
 */
export const filters =
	(...filters: EventFilter[]): EventFilter =>
	(event, eventName) =>
		filters.every((filter) => filter(event, eventName));
