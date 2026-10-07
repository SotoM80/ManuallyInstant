import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../src/App';

// Tests have no real browser URL, so the router keeps its "URL" in memory.
// Starts on the Brand Manual page by default, where the title form lives.
export function renderApp(path = '/brand-manual') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
