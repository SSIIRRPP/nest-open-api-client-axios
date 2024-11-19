import { Inject } from '@nestjs/common';
import { generateApiClientConfigToken, generateApiClientToken } from './util';

export const UseAxiosApiClient = (key: string) =>
  Inject(generateApiClientToken(key));

export const UseAxiosApiClientConfig = (key: string) =>
  Inject(generateApiClientConfigToken(key));
