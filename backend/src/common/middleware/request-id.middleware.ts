import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";
import type { RequestWithId } from "../types/request-with-id";

const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const supplied = request.header("x-request-id");
    request.requestId =
      supplied && VALID_REQUEST_ID.test(supplied) ? supplied : randomUUID();
    response.setHeader("x-request-id", request.requestId);
    next();
  }
}
