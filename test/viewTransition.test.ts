import { withViewTransition } from '../src/utils/viewTransition';

// jsdom has neither View Transitions nor matchMedia, so each test adds the ones it needs.
type TestDocument = { startViewTransition?: (callback: () => void) => unknown };
const testDocument = document as unknown as TestDocument;

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  delete testDocument.startViewTransition;
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('withViewTransition', () => {
  it('runs the update right away when the browser has no View Transitions', () => {
    const update = jest.fn();

    withViewTransition(update);

    expect(update).toHaveBeenCalledTimes(1);
  });

  it('runs the update inside a View Transition when the browser has one', () => {
    const update = jest.fn();
    const startViewTransition = jest.fn((callback: () => void) => callback());
    testDocument.startViewTransition = startViewTransition;
    mockReducedMotion(false);

    withViewTransition(update);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('skips the animation when the user asked for reduced motion', () => {
    const update = jest.fn();
    const startViewTransition = jest.fn();
    testDocument.startViewTransition = startViewTransition;
    mockReducedMotion(true);

    withViewTransition(update);

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(1);
  });
});
