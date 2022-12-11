import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomLoggerInstance as Logger } from '../logger/logger.service';
import { RequestWithEmail } from 'src/types';
import { verifyJWTToken } from 'src/utils/jwt';
import { throwJWTError } from 'src/utils/exceptions';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: RequestWithEmail, res: Response, next: () => void) {
    Logger.debug("validating token,", "AuthMiddleware");
    const authorization = req.headers.authorization;
    if (!authorization) {
      Logger.debug("authorization not set in header");
      throwJWTError("UnAuthorized");
    }

    const { userDetails } = verifyJWTToken(authorization.split(" ")[1]) as any;
    Logger.debug(JSON.stringify(userDetails), "AuthMiddleWare");

    req.user = userDetails;
    next();
  }
}
