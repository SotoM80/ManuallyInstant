import { checkServer, CmykServerError, convertPage, fetchCmykColors } from '../src/export/cmykClient';

// jsdom has no fetch: each test decides what the "server" answers
type Answer = { status: number; body?: unknown; headers?: Record<string, string>; bytes?: number[] };

function answer({ status, body, headers = {}, bytes = [] }: Answer) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
    arrayBuffer: async () => new Uint8Array(bytes).buffer,
  };
}

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  Object.assign(globalThis, { fetch: fetchMock });
});

const SERVER = 'http://cmyk.test';

async function kindOf(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error instanceof CmykServerError ? error.kind : 'other';
  }
  return 'none';
}

// Spec: specs/cmykserver.md, Section 2 — the routes, as the app calls them
describe('CMYK client', () => {
  it('reads the profile from health', async () => {
    fetchMock.mockResolvedValue(answer({ status: 200, body: { ok: true, profile: { id: 'FOGRA39', name: 'Coated FOGRA39' } } }));
    await expect(checkServer(SERVER)).resolves.toEqual({ profile: { id: 'FOGRA39', name: 'Coated FOGRA39' } });
    expect(fetchMock.mock.calls[0][0]).toBe('http://cmyk.test/v1/health');
  });

  it('sends the colors as JSON and gives back the answer', async () => {
    const body = { profile: { id: 'FOGRA39', name: 'Coated FOGRA39' }, colors: [{ hex: '#1E88E5', cmyk: { c: 76, m: 42, y: 0, k: 0 } }] };
    fetchMock.mockResolvedValue(answer({ status: 200, body }));
    await expect(fetchCmykColors(SERVER, ['#1E88E5'])).resolves.toEqual(body);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://cmyk.test/v1/cmyk/colors');
    expect(init).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"colors":["#1E88E5"]}' });
  });

  it('gives a page back with its size and bytes', async () => {
    fetchMock.mockResolvedValue(answer({ status: 200, headers: { 'X-Cmyk-Width': '20', 'X-Cmyk-Height': '10' }, bytes: [1, 2, 3] }));
    const page = await convertPage(SERVER, new Blob(['png']));
    expect(page.width).toBe(20);
    expect(page.height).toBe(10);
    expect([...page.bytes]).toEqual([1, 2, 3]);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'image/png' } });
  });

  it('calls a server that does not answer "unreachable"', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await kindOf(checkServer(SERVER))).toBe('unreachable');
  });

  it('calls an error answer "rejected", with the server\'s message', async () => {
    fetchMock.mockResolvedValue(answer({ status: 413, body: { error: 'too_large', message: 'The page is larger than 40 MB.' } }));
    await expect(convertPage(SERVER, new Blob(['png']))).rejects.toMatchObject({ kind: 'rejected', message: 'The page is larger than 40 MB.' });
  });

  it('tries a busy page once more after 2 s, and stops after that', async () => {
    jest.useFakeTimers();
    try {
      const ok = answer({ status: 200, headers: { 'X-Cmyk-Width': '1', 'X-Cmyk-Height': '1' }, bytes: [0] });
      fetchMock.mockResolvedValueOnce(answer({ status: 503 })).mockResolvedValueOnce(ok);
      const page = convertPage(SERVER, new Blob(['png']));
      await jest.advanceTimersByTimeAsync(2000);
      await expect(page).resolves.toMatchObject({ width: 1, height: 1 });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      fetchMock.mockReset().mockResolvedValue(answer({ status: 503 }));
      const busy = kindOf(convertPage(SERVER, new Blob(['png'])));
      await jest.advanceTimersByTimeAsync(2000);
      expect(await busy).toBe('busy');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('gives up on a server that takes too long', async () => {
    jest.useFakeTimers();
    try {
      // A fetch that only ends when it is aborted
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
      );
      const health = kindOf(checkServer(SERVER));
      await jest.advanceTimersByTimeAsync(3000);
      expect(await health).toBe('unreachable');
    } finally {
      jest.useRealTimers();
    }
  });
});
