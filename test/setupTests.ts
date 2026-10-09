import '@testing-library/jest-dom';
import { TextEncoder } from 'util';

// jsdom does not provide TextEncoder, and React Router needs it.
Object.assign(globalThis, { TextEncoder });

// jsdom does not provide object URLs, and the logo preview uses them.
URL.createObjectURL = (file: Blob) => `blob:${(file as File).name}`;
