import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

// jsdom does not provide TextEncoder, and React Router needs it.
Object.assign(globalThis, { TextEncoder });
