import {
  ConfigurableModuleBuilder,
  DynamicModule,
  Global,
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
@Module({})
export class OpenApiAxiosModule extends OmitType(ConfigurableModuleClass, [
  'forRoot',
  'forRootAsync',
]) {
  static forClients(
    options: OpenApiAxiosClientOptions[],
    global = false,
  ): DynamicModule {
    const clientProviders = options.flatMap(({ config, key }) => {
      const clientApiToken = generateApiClientToken(key);
      const clientApiConfigToken = generateApiClientConfigToken(key);

      return [
        {
          provide: clientApiToken,
          useFactory: async (clientRegistryService: ClientRegistryService) => {
            if (!clientRegistryService.registerClient(key)) {
              throw new Error(
                `Client with key "${key}" has already been registered.`,
              );
            }

            const privateApi = new OpenAPIClientAxios(config);
            const client = await privateApi.getClient();
            return client;
          },
          inject: [ClientRegistryService],
        },
        {
          provide: clientApiConfigToken,
          useValue: config,
        },
      ];
    });

    return {
      module: OpenApiAxiosModule,
      providers: [...clientProviders, ClientRegistryService],
      exports: clientProviders.map(provider => provider.provide),
      global,
    };
  }

  static forClientsAsync(
    options: AsyncOpenApiAxiosClientOptions[],
    global: boolean = false,
  ): DynamicModule {
    const asyncModules = options.map(({ key, imports, useFactory, inject }) => {
      const clientApiToken = `${key}_API_CLIENT`;
      const clientConfigToken = `${key}_API_CONFIG`;

      const clientProviders = [
        {
          provide: clientApiToken,
          useFactory: async (
            clientRegistryService: ClientRegistryService,
            ...args: any[]
          ) => {
            if (!clientRegistryService.registerClient(key)) {
              throw new Error(
                `Client with key "${key}" has already been registered.`,
              );
            }

            const config = await useFactory(...args);
            const privateApi = new OpenAPIClientAxios(config);
            const client = await privateApi.getClient();
            return client;
          },
          inject: [ClientRegistryService, ...(inject || [])],
        },
        {
          provide: clientConfigToken,
          useFactory: async (...args: any[]) => await useFactory(...args),
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
      imports: asyncModules.flatMap(m => m.imports || []),
      providers: [
        ...asyncModules.flatMap(m => m.providers || []),
        ClientRegistryService,
      ],
      exports: asyncModules.flatMap(m => m.exports || []),
      global,
    };
  }
}
