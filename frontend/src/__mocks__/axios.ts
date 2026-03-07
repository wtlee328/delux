import { vi } from 'vitest';

const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  patch: vi.fn(),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() }
  },
  defaults: {
    headers: {
      common: {},
    }
  }
};

const mockAxios = {
  ...mockAxiosInstance,
  create: vi.fn(() => mockAxiosInstance)
};

export default mockAxios;
