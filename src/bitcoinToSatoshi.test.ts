import { bitcoinToSatoshi } from "./index";

// tslint:disable:no-magic-numbers
describe("bitcoinToSatoshi", () => {
  it("should calculate correct amount", async () => {
    expect(bitcoinToSatoshi(1)).toBe(100000000);
    expect(bitcoinToSatoshi(2)).toBe(200000000);
    expect(bitcoinToSatoshi(0.1)).toBe(10000000);
  });

  it("should accept a string", async () => {
    expect(bitcoinToSatoshi("10")).toBe(1000000000);
    expect(bitcoinToSatoshi("0.1")).toBe(10000000);
    expect(bitcoinToSatoshi("xxx")).toBeNaN();
  });
});
