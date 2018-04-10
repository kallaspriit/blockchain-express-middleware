import * as express from "express";
import { Api } from "./index";

export interface IQrCodeParameters {
  address: string;
  amount: number | string;
  message: string;
}

export default (): express.Router => {
  const router = express.Router();

  // handle qr image request
  router.get("/qr", async (request, response, _next) => {
    const { address, amount, message } = request.query as IQrCodeParameters;

    const paymentRequestQrCode = Api.getPaymentRequestQrCode(address, amount, message);

    response.setHeader("Content-Type", "image/png");
    paymentRequestQrCode.pipe(response);
  });

  return router;
};
