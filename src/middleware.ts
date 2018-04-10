import * as express from "express";

export default (): express.RequestHandler => (_request, _response, _next) => {
  const router = express.Router();

  return router;
};
