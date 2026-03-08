function isDocumentActive() {
	return document.visibilityState === 'visible' && document.hasFocus();
}

export class EngagementTimeTracker {
	public isActive() {
		return this.state?.isActive ?? false;
	}

	public getTotalTime() {
		if (!this.state) return 0;

		return this.state.activeTime + this.getCurrentSegmentTime();
	}

	public getCurrentSegmentTime() {
		if (!this.state) return 0;
		const { isActive, runningEngagementStart } = this.state;

		return isActive && runningEngagementStart !== null
			? Date.now() - runningEngagementStart
			: 0;
	}

	protected state: {
		isActive: boolean;
		activeTime: number;
		cleanup: () => void;
		runningEngagementStart: number | null;
	} | null = null;

	public start() {
		if (this.state) return;

		const isActive = isDocumentActive();

		const onVisibilityChange = () => this.updateVisibilityState();
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('blur', onVisibilityChange);
		window.addEventListener('focus', onVisibilityChange);

		const cleanup = () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('blur', onVisibilityChange);
			window.removeEventListener('focus', onVisibilityChange);
		};

		this.state = {
			isActive,
			activeTime: 0,
			cleanup,
			runningEngagementStart: isActive ? Date.now() : null,
		};
	}

	public stop() {
		if (!this.state) return;

		this.state.cleanup();
		this.state = null;
	}

	protected updateVisibilityState() {
		if (!this.state) return;

		const isActive = isDocumentActive();

		// Skip if no changes
		if (this.state.isActive === isActive) return;

		if (isActive) {
			// Reset start time once user back to document
			this.state.runningEngagementStart = Date.now();
		} else {
			// Record last activity segment
			this.state.activeTime += this.getCurrentSegmentTime();
			this.state.runningEngagementStart = null;
		}

		// Update active state
		this.state.isActive = isActive;

		// Notify subscribers
		this.callbacks.forEach((onChange) => {
			onChange(isActive);
		});
	}

	protected readonly callbacks = new Set<(isVisible: boolean) => void>();
	public onVisibilityChanged(callback: (isVisible: boolean) => void) {
		this.callbacks.add(callback);

		return () => {
			this.callbacks.delete(callback);
		};
	}
}
