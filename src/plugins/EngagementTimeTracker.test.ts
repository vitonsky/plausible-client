// @vitest-environment jsdom

// WARNING: this test has been generated via LLM
// If you notice any weird things - do not hesitate to change anything

import { EngagementTimeTracker } from './EngagementTimeTracker';

vi.useFakeTimers();

let tracker: EngagementTimeTracker;

beforeEach(() => {
	vi.clearAllMocks();
	tracker = new EngagementTimeTracker();

	Object.defineProperty(document, 'visibilityState', {
		value: 'visible',
		writable: true,
		configurable: true,
	});
	vi.spyOn(document, 'hasFocus').mockReturnValue(true);
});

afterEach(() => {
	tracker.stop();
});

describe('before start', () => {
	test('isActive() returns false', () => {
		expect(tracker.isActive()).toBe(false);
	});

	test('getTotalTime() returns 0', () => {
		expect(tracker.getTotalTime()).toBe(0);
	});

	test('getCurrentSegmentTime() returns 0', () => {
		expect(tracker.getCurrentSegmentTime()).toBe(0);
	});
});

describe('start()', () => {
	test('isActive() returns true when document is visible and focused', () => {
		tracker.start();
		expect(tracker.isActive()).toBe(true);
	});

	test('isActive() returns false when document is hidden', () => {
		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		tracker.start();
		expect(tracker.isActive()).toBe(false);
	});

	test('isActive() returns false when window is not focused', () => {
		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		tracker.start();
		expect(tracker.isActive()).toBe(false);
	});
});

describe('stop()', () => {
	test('resets all state after stop', () => {
		tracker.start();
		vi.advanceTimersByTime(3000);
		tracker.stop();

		expect(tracker.isActive()).toBe(false);
		expect(tracker.getTotalTime()).toBe(0);
		expect(tracker.getCurrentSegmentTime()).toBe(0);
	});

	test('removes event listeners', () => {
		const removeDoc = vi.spyOn(document, 'removeEventListener');
		const removeWin = vi.spyOn(window, 'removeEventListener');

		tracker.start();
		tracker.stop();

		expect(removeDoc).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
		expect(removeWin).toHaveBeenCalledWith('blur', expect.any(Function));
		expect(removeWin).toHaveBeenCalledWith('focus', expect.any(Function));
	});

	test('stop() is a no-op when not started', () => {
		expect(() => tracker.stop()).not.toThrow();
	});
});

describe('time tracking', () => {
	test('accumulates active time while document is visible and focused', () => {
		tracker.start();
		vi.advanceTimersByTime(5000);

		expect(tracker.getTotalTime()).toBe(5000);
		expect(tracker.getCurrentSegmentTime()).toBe(5000);
	});

	test('stops accumulating time when window loses focus', () => {
		tracker.start();
		vi.advanceTimersByTime(3000);

		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		window.dispatchEvent(new Event('blur'));

		vi.advanceTimersByTime(5000);

		// Only the 3000ms before blur should be counted
		expect(tracker.getTotalTime()).toBeCloseTo(3000, -1);
		expect(tracker.getCurrentSegmentTime()).toBe(0);
	});

	test('resumes accumulating time when window regains focus', () => {
		tracker.start();
		vi.advanceTimersByTime(3000);

		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		window.dispatchEvent(new Event('blur'));
		vi.advanceTimersByTime(5000);

		vi.spyOn(document, 'hasFocus').mockReturnValue(true);
		window.dispatchEvent(new Event('focus'));
		vi.advanceTimersByTime(2000);

		// 3000ms before blur + 2000ms after focus
		expect(tracker.getTotalTime()).toBeCloseTo(5000, -1);
	});

	test('stops accumulating time when document becomes hidden', () => {
		tracker.start();
		vi.advanceTimersByTime(2000);

		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		document.dispatchEvent(new Event('visibilitychange'));

		vi.advanceTimersByTime(3000);

		expect(tracker.getTotalTime()).toBeCloseTo(2000, -1);
	});

	test('resumes accumulating time when document becomes visible again', () => {
		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		tracker.start();

		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			configurable: true,
		});
		vi.spyOn(document, 'hasFocus').mockReturnValue(true);
		document.dispatchEvent(new Event('visibilitychange'));

		vi.advanceTimersByTime(4000);

		expect(tracker.getTotalTime()).toBeCloseTo(4000, -1);
	});
});

describe('onVisibilityChanged()', () => {
	test('calls callback with false when window loses focus', () => {
		const callback = vi.fn();
		tracker.start();
		tracker.onVisibilityChanged(callback);

		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		window.dispatchEvent(new Event('blur'));

		expect(callback).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(false);
	});

	test('calls callback with true when document becomes active', () => {
		const callback = vi.fn();
		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			configurable: true,
		});
		tracker.start();
		tracker.onVisibilityChanged(callback);

		vi.spyOn(document, 'hasFocus').mockReturnValue(true);
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			configurable: true,
		});
		window.dispatchEvent(new Event('focus'));

		expect(callback).toHaveBeenCalledOnce();
		expect(callback).toHaveBeenCalledWith(true);
	});

	test('does not call callback when visibility state has not changed', () => {
		const callback = vi.fn();
		tracker.start(); // already active
		tracker.onVisibilityChanged(callback);

		// Dispatch focus while already active -> no state change
		window.dispatchEvent(new Event('focus'));

		expect(callback).not.toHaveBeenCalled();
	});

	test('cleanup function removes the callback', () => {
		const callback = vi.fn();
		tracker.start();
		const cleanup = tracker.onVisibilityChanged(callback);

		cleanup();

		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		window.dispatchEvent(new Event('blur'));

		expect(callback).not.toHaveBeenCalled();
	});

	test('multiple callbacks are all called on visibility change', () => {
		const cb1 = vi.fn();
		const cb2 = vi.fn();
		tracker.start();
		tracker.onVisibilityChanged(cb1);
		tracker.onVisibilityChanged(cb2);

		vi.spyOn(document, 'hasFocus').mockReturnValue(false);
		window.dispatchEvent(new Event('blur'));

		expect(cb1).toHaveBeenCalledOnce();
		expect(cb2).toHaveBeenCalledOnce();
	});
});
