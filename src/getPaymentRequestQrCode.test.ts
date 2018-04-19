import { getPaymentRequestQrCode } from "./index";

const RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";

// tslint:disable:no-magic-numbers
describe("getPaymentRequestQrCode", () => {
  it("should return correct image", async done => {
    const image = getPaymentRequestQrCode(RECEIVING_ADDRESS, 100, "Test message");

    let result = "";

    image.on("data", chunk => {
      result += chunk;
    });

    image.on("end", () => {
      // can't really say it's correct but at least detect a change
      expect(result).toMatchSnapshot();

      done();
    });
  });
});
