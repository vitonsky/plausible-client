/**
 * Returns user ID. This is unique string to identify a user
 * The UID does not require a cryptographic randomness, so a pseudo random is acceptable
 */
export const getSessionId = () => {
	try {
		return crypto.randomUUID();
	} catch {
		return 'fallback-' + String(Math.round(Math.random() * 10000000000));
	}
};
