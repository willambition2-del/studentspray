import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithId } from '../../common/types/request-with-id';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  context.switchToHttp().getRequest<RequestWithId>().user);
