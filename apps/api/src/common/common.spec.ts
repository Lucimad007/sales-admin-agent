import { describe, expect, it } from "vitest";
import { money } from "./db-utils";
import { DomainError, conflict } from "./domain-error";

describe("money", () => {
  it("formats numeric strings to two decimals", () => {
    expect(money("1200")).toBe("1200.00");
    expect(money("1200.5")).toBe("1200.50");
  });
});

describe("domain errors", () => {
  it("maps conflict to 409", () => {
    const err = conflict("email taken");
    expect(err).toBeInstanceOf(DomainError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});
