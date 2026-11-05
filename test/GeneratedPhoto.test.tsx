import { act, fireEvent, screen, within } from '@testing-library/react';
import { renderApp } from './renderApp';
import { loadEditorMask, loadEditorPhoto } from '../src/mockups/editorImage';
import { emptyMask } from '../src/mockups/selection';
import { resetSessionTemplates } from '../src/mockups/catalog';
import { PROMPT_SUFFIX, PhotoError, buildPrompt, geminiGenerator } from '../src/mockups/generate/generatePhoto';

// Spec: specs/mockups.md, Generated photos (ADR 0016). Gemini is a fake fetch; the editor's
// canvas parts and the WebGL renderer are mocked, as in TemplateEditor.test.tsx.
jest.mock('../src/mockups/editorImage', () => ({
  EDITOR_WIDTH: 1000,
  loadEditorPhoto: jest.fn(),
  loadEditorMask: jest.fn(),
  maskToDataUrl: jest.fn(() => 'data:image/png;base64,mask'),
  drawSelection: jest.fn(),
}));
jest.mock('../src/mockups/render/renderPhotoMockup', () => ({ renderPhotoMockup: jest.fn(async () => 'data:image/png;base64,mockup') }));
jest.setTimeout(20000);

const KEY = 'AIzaTestKey123';

// A Gemini answer: an image, or an error with its HTTP status
function answer(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response;
}
const IMAGE = answer(200, { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: btoa('png') } }] } }] });
const BAD_KEY = answer(400, { error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' } });
const NO_BILLING = answer(429, {
  error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded for metric: generate_content_free_tier_requests, limit: 0' },
});

// The app also fetches its local templates when it starts: that call gets a 404, and only the
// calls to Gemini reach geminiMock
let geminiMock: jest.Mock;
let fetchMock: jest.Mock;
beforeEach(() => {
  resetSessionTemplates();
  (loadEditorPhoto as jest.Mock).mockResolvedValue({
    pixels: { data: new Uint8ClampedArray(400), width: 10, height: 10 },
    size: [100, 100],
    scale: 0.1,
  });
  (loadEditorMask as jest.Mock).mockImplementation(async (_mask, width, height) => emptyMask(width, height));
  geminiMock = jest.fn(async () => IMAGE);
  fetchMock = jest.fn((url: string, init?: RequestInit) =>
    url.startsWith('https://generativelanguage.googleapis.com/') ? geminiMock(url, init) : Promise.resolve(answer(404, {})),
  );
  globalThis.fetch = fetchMock;
  localStorage.clear();
  sessionStorage.clear();
});

function failureOf(promise: Promise<unknown>) {
  return promise.then(
    () => 'no failure',
    (error) => (error instanceof PhotoError ? error.failure : error.name),
  );
}

describe('The Gemini generator', () => {
  it('adds the fixed suffix to the product', () => {
    expect(buildPrompt('  tote bag ')).toBe(`tote bag${PROMPT_SUFFIX}`);
  });

  it('sends the prompt, and the trimmed key in a header, never in the URL (scenario 28)', async () => {
    const photo = await geminiGenerator.generate({ product: 'tote bag', apiKey: `  ${KEY}\n` });
    const [url, init] = geminiMock.mock.calls[0];
    expect(url).not.toContain(KEY);
    expect(init.headers['x-goog-api-key']).toBe(KEY);
    expect(JSON.parse(init.body).contents[0].parts[0].text).toBe(`tote bag${PROMPT_SUFFIX}`);
    expect(photo.type).toBe('image/png');
  });

  it('tells a wrong key, a key without billing, too many requests and a refused description apart', async () => {
    const generate = (response: Response) => {
      geminiMock.mockResolvedValueOnce(response);
      return failureOf(geminiGenerator.generate({ product: 'mug', apiKey: KEY }));
    };
    expect(await generate(BAD_KEY)).toBe('key');
    expect(await generate(answer(403, {}))).toBe('key');
    expect(await generate(NO_BILLING)).toBe('billing');
    expect(await generate(answer(429, { error: { message: 'Too many requests' } }))).toBe('quota');
    expect(await generate(answer(200, { promptFeedback: { blockReason: 'SAFETY' } }))).toBe('refused');
    expect(await generate(answer(200, { candidates: [{ content: { parts: [] } }] }))).toBe('other');
    expect(await generate(answer(500, {}))).toBe('other');
  });

  it('tells a network error, but not a cancelled request', async () => {
    geminiMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await failureOf(geminiGenerator.generate({ product: 'mug', apiKey: KEY }))).toBe('network');

    const controller = new AbortController();
    controller.abort();
    geminiMock.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
    expect(await failureOf(geminiGenerator.generate({ product: 'mug', apiKey: KEY, signal: controller.signal }))).toBe('AbortError');
  });
});

describe('Generate a photo', () => {
  function openPanel() {
    fireEvent.click(screen.getByRole('button', { name: /7\. Mockups/ }));
    const form = screen.getByRole('form', { name: 'Mockups' });
    fireEvent.click(within(form).getByRole('button', { name: 'Generate a photo' }));
    return form;
  }

  function fill(form: HTMLElement, key: string, product: string) {
    fireEvent.change(within(form).getByLabelText('API key'), { target: { value: key } });
    fireEvent.change(within(form).getByLabelText('Product'), { target: { value: product } });
  }

  async function generate(form: HTMLElement) {
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Generate' }));
    });
  }

  it('waits for a key and a product', () => {
    renderApp();
    const form = openPanel();
    const button = within(form).getByRole('button', { name: 'Generate' });
    expect(button).toBeDisabled();
    fill(form, KEY, '   ');
    expect(button).toBeDisabled();
    fill(form, KEY, 'ceramic mug');
    expect(button).toBeEnabled();
  });

  it('opens the template editor with the photo, named after the product (scenario 27)', async () => {
    renderApp();
    const form = openPanel();
    fill(form, KEY, 'ceramic mug');
    await generate(form);
    const editor = screen.getByRole('dialog', { name: 'Template editor' });
    expect(within(editor).getByLabelText('Name')).toHaveValue('ceramic mug');
  });

  it('never keeps the key (scenario 29)', async () => {
    renderApp();
    const form = openPanel();
    fill(form, KEY, 'ceramic mug');
    await generate(form);
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage });
    expect(stored).not.toContain(KEY);
  });

  it('shows a refused key, keeps both fields, and opens no editor (scenario 30)', async () => {
    geminiMock.mockResolvedValueOnce(BAD_KEY);
    renderApp();
    const form = openPanel();
    fill(form, KEY, 'ceramic mug');
    await generate(form);
    expect(within(form).getByRole('alert')).toHaveTextContent('The API key was not accepted');
    expect(within(form).getByLabelText('API key')).toHaveValue(KEY);
    expect(within(form).getByLabelText('Product')).toHaveValue('ceramic mug');
    expect(screen.queryByRole('dialog', { name: 'Template editor' })).not.toBeInTheDocument();
  });

  it('says when the key has no billing (scenario 31)', async () => {
    geminiMock.mockResolvedValueOnce(NO_BILLING);
    renderApp();
    const form = openPanel();
    fill(form, KEY, 'ceramic mug');
    await generate(form);
    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Your Gemini plan does not include images; turn on billing in Google AI Studio',
    );
  });

  it('cancels a request without an error (scenario 32)', async () => {
    geminiMock.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) =>
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        ),
    );
    renderApp();
    const form = openPanel();
    fill(form, KEY, 'ceramic mug');
    await generate(form);
    expect(within(form).getByRole('button', { name: 'Generating…' })).toBeDisabled();
    await act(async () => {
      fireEvent.click(within(form).getByRole('button', { name: 'Cancel' }));
    });
    expect(within(form).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(form).getByRole('button', { name: 'Generate' })).toBeEnabled();
    expect(screen.queryByRole('dialog', { name: 'Template editor' })).not.toBeInTheDocument();
  });
});
