import { describe, expect, it } from "vitest";
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
