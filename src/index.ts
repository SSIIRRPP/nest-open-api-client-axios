import {
  ConfigurableModuleAsyncOptions,
  ConfigurableModuleBuilder,
  DynamicModule,
  Global,
  Inject,
  Module,
  Provider,
} from '@nestjs/common';
import OpenAPIClientAxios, { OpenAPIClient } from 'openapi-client-axios';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- ok
  interface AxiosApiClient extends OpenAPIClient {}
}

export const AxiosApiClient = 'AxiosApiClientKey';

export const UseAxiosApiClient = (key = AxiosApiClient) =>
  Inject(key || AxiosApiClient);

type OpenAPIClientAxiosOptions = ConstructorParameters<
  typeof OpenAPIClientAxios
>[0];

const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<OpenAPIClientAxiosOptions>()
    .setClassMethodName('forRoot')
    .build();

@Global()
@Module({})
export class OpenApiAxiosClientModule extends ConfigurableModuleClass {
  static forRootAsync(
    options?: ConfigurableModuleAsyncOptions<
      OpenAPIClientAxiosOptions,
      'create'
    > &
      Partial<object>,
    key = AxiosApiClient,
  ): DynamicModule {
    const apiClientProvider: Provider = {
      provide: key,
      useFactory: async (options: OpenAPIClientAxiosOptions) => {
        const privateApi = new OpenAPIClientAxios(options);

        const client = await privateApi.getClient();
        return client;
      },
      inject: [MODULE_OPTIONS_TOKEN],
    };

    return {
      ...super.forRootAsync(options ?? {}),
      providers: [
        ...(super.forRootAsync(options ?? {}).providers || []),
        apiClientProvider,
      ],
      exports: [key],
    };
  }
}
