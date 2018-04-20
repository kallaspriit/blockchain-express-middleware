import { getPaymentRequestQrCode } from "./index";

const RECEIVING_ADDRESS = "2FupTEd3PDF7HVxNrzNqQGGoWZA4rqiphq";

// tslint:disable:no-magic-numbers
describe("getPaymentRequestQrCode", () => {
  it("should return correct image", async () => {
    const image = getPaymentRequestQrCode(RECEIVING_ADDRESS, 100, "Test message");

    // can't really say it's correct but at least detect a change
    expect(await streamToString(image)).toMatchSnapshot();
  });

  it("should accept optional qr code options", async () => {
    const image = getPaymentRequestQrCode(RECEIVING_ADDRESS, 100, "Test message", {
      size: 10,
    });

    // can't really say it's correct but at least detect a change
    expect(await streamToString(image)).toMatchSnapshot();
  });
});

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise<string>(resolve => {
    let result = "";

    stream.on("data", chunk => {
      result += chunk;
    });

    stream.on("end", () => {
      resolve(result);
    });
  });
}
