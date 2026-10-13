import { keepInPlace } from '../src/utils/scrollAnchor';

// jsdom has no layout, so each test says where the element is on screen, frame by frame.
let frames: FrameRequestCallback[] = [];
let now = 0;

function runFrame(time: number) {
  now = time;
  const pending = frames;
  frames = [];
  pending.forEach((callback) => callback(time));
}

function elementAt(...tops: number[]) {
  const element = document.createElement('button');
  let call = 0;
  element.getBoundingClientRect = () => ({ top: tops[Math.min(call++, tops.length - 1)] }) as DOMRect;
  return element;
}

beforeEach(() => {
  frames = [];
  now = 0;
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  window.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  window.cancelAnimationFrame = jest.fn(() => {
    frames = [];
  });
  window.scrollBy = jest.fn() as unknown as typeof window.scrollBy;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('keepInPlace', () => {
  it('scrolls the page by what the element moved, so it stays still on screen', () => {
    // Starts at 500; a section above folds and moves it up to 380.
    keepInPlace(elementAt(500, 380));

    runFrame(16);

    expect(window.scrollBy).toHaveBeenCalledWith({ top: -120, behavior: 'instant' });
  });

  it('does not scroll while the element has not moved', () => {
    keepInPlace(elementAt(500, 500));

    runFrame(16);

    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it('stops following once the fold animation is over', () => {
    keepInPlace(elementAt(500, 500), 100);

    runFrame(50);
    runFrame(120);

    expect(frames).toHaveLength(0);
  });

  it('stops as soon as the user scrolls on their own', () => {
    keepInPlace(elementAt(500, 380));

    window.dispatchEvent(new Event('wheel'));
    runFrame(16);

    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
