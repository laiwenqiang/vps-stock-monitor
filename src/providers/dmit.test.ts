import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { DmitProvider } from "./dmit.js";

describe("DmitProvider.supports", () => {
  it("accepts dmit.io and subdomains", () => {
    const provider = new DmitProvider();
    expect(
      provider.supports({
        id: "1",
        provider: "dmit",
        url: "https://dmit.io/cart.php?a=add&pid=123",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe(true);
    expect(
      provider.supports({
        id: "2",
        provider: "dmit",
        url: "https://www.dmit.io",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe(true);
  });

  it("rejects non-dmit hosts or invalid urls", () => {
    const provider = new DmitProvider();
    expect(
      provider.supports({
        id: "3",
        provider: "dmit",
        url: "https://example.com",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe(false);
    expect(
      provider.supports({
        id: "4",
        provider: "dmit",
        url: "not-a-url",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).toBe(false);
  });
});

describe("DmitProvider parsing methods", () => {
  let provider: DmitProvider;

  beforeEach(() => {
    provider = new DmitProvider();
  });

  describe("parseApiResponse", () => {
    it("handles boolean fields correctly", () => {
      const result = (provider as any).parseApiResponse({
        available: true,
        stock: 10,
        price: 99.99,
      });

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(10);
      expect(result.price).toBe(99.99);
    });

    it("handles string boolean values", () => {
      const result = (provider as any).parseApiResponse({
        available: "true",
        stock: 5,
      });

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(5);
    });

    it("handles numeric string values", () => {
      const result = (provider as any).parseApiResponse({
        available: true,
        stock: "15",
        price: "49.99",
      });

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(15);
      expect(result.price).toBe(49.99);
    });

    it("determines inStock from stock quantity", () => {
      const result = (provider as any).parseApiResponse({
        stock: 5,
      });

      expect(result.inStock).toBe(true);
    });

    it("marks as out of stock when stock is 0", () => {
      const result = (provider as any).parseApiResponse({
        stock: 0,
      });

      expect(result.inStock).toBe(false);
    });
  });

  describe("parseHtmlResponse", () => {
    it("detects in-stock from 'Add to Cart' keyword", () => {
      const html = '<button>Add to Cart</button><div>Price: $99</div>';
      const result = (provider as any).parseHtmlResponse(html);

      expect(result.inStock).toBe(true);
    });

    it("detects out-of-stock from 'Out of Stock' keyword", () => {
      const html = '<div>Out of Stock</div>';
      const result = (provider as any).parseHtmlResponse(html);

      expect(result.inStock).toBe(false);
    });

    it("is case-insensitive", () => {
      const html = '<button>add to cart</button>';
      const result = (provider as any).parseHtmlResponse(html);

      expect(result.inStock).toBe(true);
    });

    it("handles Chinese keywords", () => {
      const html = '<button>立即购买</button>';
      const result = (provider as any).parseHtmlResponse(html);

      expect(result.inStock).toBe(true);
    });

    it("throws when no keywords found", () => {
      const html = '<div>Some random content</div>';

      expect(() => (provider as any).parseHtmlResponse(html)).toThrow(
        "Unable to determine stock status"
      );
    });

    it("extracts price from HTML", () => {
      const html = '<button>Add to Cart</button><div>Price: $49.99</div>';
      const result = (provider as any).parseHtmlResponse(html);

      expect(result.price).toBe(49.99);
    });
  });

  describe("parseEmbeddedJson", () => {
    it("extracts JSON from script tag", () => {
      const html = `
        <script type="application/json">
          {"available": true, "stock": 10, "price": 99.99}
        </script>
      `;
      const result = (provider as any).parseEmbeddedJson(html);

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(10);
      expect(result.price).toBe(99.99);
    });

    it("extracts JSON from window.__INITIAL_STATE__", () => {
      const html = `
        <script>
          window.__INITIAL_STATE__ = {"available": true, "stock": 5};
        </script>
      `;
      const result = (provider as any).parseEmbeddedJson(html);

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(5);
    });

    it("handles nested JSON objects", () => {
      const html = `
        <script>
          window.__INITIAL_STATE__ = {"product": {"available": true, "stock": 3}};
        </script>
      `;

      // This should not throw
      expect(() => (provider as any).parseEmbeddedJson(html)).not.toThrow();
    });

    it("handles JSON with braces in strings", () => {
      const html = `
        <script type="application/json">
          {"available": true, "description": "Product {A}", "stock": 10}
        </script>
      `;
      const result = (provider as any).parseEmbeddedJson(html);

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(10);
    });

    it("handles window.__INITIAL_STATE__ with }; in string values", () => {
      const html = `
        <script>
          window.__INITIAL_STATE__ = {"available": true, "note": "Price: $10; Stock: 5", "stock": 8};
        </script>
      `;
      const result = (provider as any).parseEmbeddedJson(html);

      expect(result.inStock).toBe(true);
      expect(result.qty).toBe(8);
    });

    it("throws when no JSON found", () => {
      const html = "<div>No JSON here</div>";

      expect(() => (provider as any).parseEmbeddedJson(html)).toThrow(
        "No embedded JSON found"
      );
    });

    it("provides clear error for malformed JSON", () => {
      const html = `
        <script type="application/json">
          {invalid json}
        </script>
      `;

      expect(() => (provider as any).parseEmbeddedJson(html)).toThrow(
        "Failed to parse JSON from <script> tag"
      );
    });
  });

  describe("extractBalancedJson", () => {
    it("extracts simple JSON object", () => {
      const text = '{"key": "value"}';
      const result = (provider as any).extractBalancedJson(text);

      expect(result).toBe('{"key": "value"}');
    });

    it("extracts nested JSON object", () => {
      const text = '{"outer": {"inner": "value"}}';
      const result = (provider as any).extractBalancedJson(text);

      expect(result).toBe('{"outer": {"inner": "value"}}');
    });

    it("handles braces in string values", () => {
      const text = '{"text": "a{b}c"}';
      const result = (provider as any).extractBalancedJson(text);

      expect(result).toBe('{"text": "a{b}c"}');
    });

    it("handles escaped quotes", () => {
      const text = '{"text": "a\\"b\\"c"}';
      const result = (provider as any).extractBalancedJson(text);

      expect(result).toBe('{"text": "a\\"b\\"c"}');
    });

    it("returns null for unbalanced braces", () => {
      const text = '{"key": "value"';
      const result = (provider as any).extractBalancedJson(text);

      expect(result).toBeNull();
    });
  });
});

describe("DmitProvider.fetchStatus", () => {
  let provider: DmitProvider;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    provider = new DmitProvider();
    originalFetch = fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses HTML response in auto mode", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '<button>Add to Cart</button>',
      headers: new Headers(),
    });

    const result = await provider.fetchStatus({
      id: "1",
      provider: "dmit",
      url: "https://dmit.io/product",
      enabled: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    expect(result.inStock).toBe(true);
  });

  it("respects sourceType parameter", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '{"available": true, "stock": 10}',
      headers: new Headers(),
    });

    const result = await provider.fetchStatus({
      id: "1",
      provider: "dmit",
      url: "https://dmit.io/api/product",
      sourceType: "api",
      enabled: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    expect(result.inStock).toBe(true);
    expect(result.qty).toBe(10);
  });

  it("throws on HTTP error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: new Headers(),
    });

    await expect(
      provider.fetchStatus({
        id: "1",
        provider: "dmit",
        url: "https://dmit.io/product",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).rejects.toThrow("Failed to fetch Dmit page: 403 Forbidden");
  });

  it("handles timeout with AbortError", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error("The operation was aborted");
          error.name = "AbortError";
          reject(error);
        }, 100);
      });
    });

    await expect(
      provider.fetchStatus({
        id: "1",
        provider: "dmit",
        url: "https://dmit.io/product",
        enabled: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      })
    ).rejects.toThrow("Request timeout");
  });
});
