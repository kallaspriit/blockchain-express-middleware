import { satoshiToBitcoin } from "./index";

// tslint:disable:no-magic-numbers
describe("satoshiToBitcoin", () => {
  it("should calculate correct amount", async () => {
    expect(satoshiToBitcoin(100000000)).toBe(1);
    expect(satoshiToBitcoin(200000000)).toBe(2);
    expect(satoshiToBitcoin(10000000)).toBe(0.1);
  });
});
