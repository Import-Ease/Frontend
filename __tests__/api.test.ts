import { calculateCost, searchProducts, fetchShipments } from '../src/services/api';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function errorResponse(status: number, message: string) {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(JSON.stringify({ error: message })),
  };
}

describe('API error propagation', () => {
  describe('calculateCost', () => {
    it('returns result on success', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        shipping: 100, harbour: 50, duties: 30, transport: 20, insurance: 10, total: 210,
      }));

      const result = await calculateCost({
        origin: 'China',
        goodsType: 'general goods',
        weightKg: 100,
        insurance: false,
      });

      expect(result.total).toBe(210);
    });

    it('throws error on server failure', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(500, 'Internal server error'));

      await expect(
        calculateCost({ origin: 'China', goodsType: 'general goods', weightKg: 100, insurance: false }),
      ).rejects.toThrow('Internal server error');
    });

    it('throws error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(
        calculateCost({ origin: 'China', goodsType: 'general goods', weightKg: 100, insurance: false }),
      ).rejects.toThrow('Network request failed');
    });
  });

  describe('searchProducts', () => {
    it('returns results on success', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([{ productName: 'Cocoa' }]));

      const results = await searchProducts('cocoa');
      expect(results).toHaveLength(1);
      expect(results[0].productName).toBe('Cocoa');
    });

    it('throws error on 404', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(404, 'Not found'));

      await expect(searchProducts('missing')).rejects.toThrow('Not found');
    });
  });

  describe('fetchShipments', () => {
    it('throws error on 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(401, 'Unauthorized'));

      await expect(fetchShipments('bad-token')).rejects.toThrow('Unauthorized');
    });

    it('throws error on 500', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server error'));

      await expect(fetchShipments('token')).rejects.toThrow('Server error');
    });

    it('sends Authorization header', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await fetchShipments('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });
  });

  describe('request() handles non-JSON responses', () => {
    it('returns text when response is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('plain text response'),
      });

      const result = await searchProducts('test');
      expect(result).toBe('plain text response');
    });
  });

  describe('request() error message extraction', () => {
    it('extracts message from JSON error body', async () => {
      mockFetch.mockResolvedValueOnce(errorResponse(400, 'Validation failed'));

      await expect(searchProducts('test')).rejects.toThrow('Validation failed');
    });

    it('falls back to generic message when no error/message field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve('{}'),
      });

      await expect(searchProducts('test')).rejects.toThrow('Request failed');
    });

    it('uses string body as message when response is plain text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: () => Promise.resolve('Bad gateway'),
      });

      await expect(searchProducts('test')).rejects.toThrow('Bad gateway');
    });
  });
});
