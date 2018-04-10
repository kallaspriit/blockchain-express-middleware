import * as express from "express";

export default (): express.Router => {
  const router = express.Router();

  // router.use((_request, _response, next) => {
  //   console.log("middleware..");

  //   next();
  // });

  return router;
};
