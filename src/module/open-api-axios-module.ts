import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Global,
  Logger,
  LoggerService,
  Module,
} from '@nestjs/common';
import OpenAPIClientAxios from 'openapi-client-axios';
import { ClientRegistryService } from '../services/client-registry.service';
import {
  AsyncOpenApiAxiosClientOptions,
  OpenApiAxiosClientOptions,
  OpenAPIClientAxiosOptions,
} from '../types';
import { generateApiClientConfigToken, generateApiClientToken } from '../util';
import { OmitType } from '@nestjs/mapped-types';

const { ConfigurableModuleClass } =
  new ConfigurableModuleBuilder<OpenAPIClientAxiosOptions>()
    .setClassMethodName('forRoot')
    .setFactoryMethodName('forClient')
    .build();

@Global()
@Module({
  providers: [Logger],
})
export class OpenApiAxiosModule extends OmitType(ConfigurableModuleClass, [
  'forRoot',
  'forRootAsync',
]) {
  private static clientRegistryService = new ClientRegistryService();
  private static initialized: boolean;
  private static logger: LoggerService = new Logger();

  static forRoot<T extends LoggerService>(Logger?: new () => T) {
    if (this.initialized) {
      this.logger.error(
        'OpenApiAxiosModule.forRoot has already been executed',
        OpenApiAxiosModule.name,
      );
      throw new Error('OpenApiAxiosModule.forRoot has already been executed');
    }
    if (Logger) {
      this.logger = new Logger();
    }
    this.initialized = true;
  }

  private static checkOptions(
    options: AsyncOpenApiAxiosClientOptions[] | OpenApiAxiosClientOptions[],
  ) {
    options.forEach(({ key }) => {
      if (!this.clientRegistryService.registerClient(key)) {
        this.logger.error(
          `OpenApiAxiosClient with key "${key}" has already been registered.`,
          OpenApiAxiosModule.name,
        );
        throw new Error(
          `OpenApiAxiosClient with key "${key}" has already been registered.`,
        );
      }
    });
  }

  static forClients(
    options: OpenApiAxiosClientOptions[],
    global = false,
  ): DynamicModule {
    this.checkOptions(options);
    const clientProviders = options.flatMap(({ config, key }) => {
      const clientApiToken = generateApiClientToken(key);
      const clientApiConfigToken = generateApiClientConfigToken(key);

      return [
        {
          provide: clientApiToken,
          useFactory: async () => {
            const privateApi = new OpenAPIClientAxios(config);
            const client = await privateApi.getClient();
            return client;
          },
        },
        {
          provide: clientApiConfigToken,
          useValue: { config, key, global },
        },
      ];
    });

    return {
      module: OpenApiAxiosModule,
      providers: clientProviders,
      exports: clientProviders.map(provider => provider.provide),
      global,
    };
  }

  static async forClientsAsync(
    options: AsyncOpenApiAxiosClientOptions[],
    global: boolean = false,
  ): Promise<DynamicModule> {
    this.checkOptions(options);
    const asyncClients = options.map(({ key, imports, useFactory, inject }) => {
      const clientApiToken = generateApiClientToken(key);
      const clientApiConfigToken = generateApiClientConfigToken(key);

      const clientProviders = [
        {
          provide: clientApiToken,
          useFactory: async (...args: any[]) => {
            const config = await useFactory(...args);
            const privateApi = new OpenAPIClientAxios(config);
            const client = await privateApi.getClient();
            return client;
          },
          inject: inject || [],
        },
        {
          provide: clientApiConfigToken,
          useFactory: async (...args: any[]) => ({
            config: await useFactory(...args),
            key,
            global,
          }),
          inject: inject || [],
        },
      ];

      return {
        module: OpenApiAxiosModule,
        providers: clientProviders,
        exports: clientProviders.map(provider => provider.provide),
        imports,
      };
    });

    return {
      module: OpenApiAxiosModule,
      imports: asyncClients.flatMap(m => m.imports || []),
      providers: [...asyncClients.flatMap(m => m.providers || [])],
      exports: asyncClients.flatMap(m => m.exports || []),
      global,
    };
  }
}
