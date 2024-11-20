import OpenAPIClientAxios, { OpenAPIClient } from 'openapi-client-axios';
import { ModuleMetadata, FactoryProvider } from '@nestjs/common';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- ok
  interface AxiosApiClient extends OpenAPIClient {}
  interface AxiosApiClientConfig extends OpenApiAxiosClientOptions {
    global: boolean;
  }
}

export type OpenAPIClientAxiosOptions = ConstructorParameters<
  typeof OpenAPIClientAxios
>[0];

export type OpenApiAxiosClientOptions = {
  config: OpenAPIClientAxiosOptions;
  key: string;
};

export interface AsyncOpenApiAxiosClientOptions
  extends Pick<ModuleMetadata, 'imports'> {
  key: string;
  useFactory: (
    ...args: any[]
  ) => Promise<OpenAPIClientAxiosOptions> | OpenAPIClientAxiosOptions;
  inject?: FactoryProvider['inject'];
}
