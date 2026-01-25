import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./types.js";

describe("DEFAULT_CONFIG", () => {
  it("matches documented defaults", () => {
    expect(DEFAULT_CONFIG).toEqual({
      notifyOnRestock: true,
      notifyOnOutOfStock: false,
      notifyOnPriceChange: false,
      minNotifyInterval: 60,
      maxErrorCount: 5,
      requestTimeout: 10,
    });
  });
});
