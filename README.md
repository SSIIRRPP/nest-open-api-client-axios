# @jsirp/nestjs-open-api-client-axios

This package is a container that wraps [openapi-client-axios](https://www.npmjs.com/package/openapi-client-axios) and provides you an easy way to instantiate a client and inject it wherever you want.

### Usage

```typescript
import {
  OpenApiAxiosModule,
  UseAxiosApiClient,
  UseAxiosApiClientConfig,
} from '@jsirp/nest-open-api-client-axios';
import { OpenAPIV3 } from 'openapi-client-axios';
import definition from '../path-to-json-api-definition';

// Define a way key to ve able to identify the client instance
const SOME_API_KEY = 'SOME_API_KEY';

// You can create your own decorators with this key to abstract its injection
export const UseSomeApi = () => UseAxiosApiClient(SOME_API_KEY);
// You can acces the configuration object you used to create the client too.
export const UseSomeApiConfig = () => UseAxiosApiClientConfig(PRIVATE_API_KEY);

@Module({
  imports: [
    OpenApiAxiosModule.forClients(
      [
        {
          key: SOME_API_KEY,
          // Configuration object passed to new OpenAPIClientAxios()
          config: {
            definition: definition as OpenAPIV3.Document,
          },
        },
      ],
      // Pass true if you want the client to be available globally.
      true,
    ),
  ],
})
export class SomeApiModule {}
```

Then use it in some service:

```typescript
@Injectable()
export class SomeService {
  constructor(
    @UsePrivateApi() private readonly apiClient: AxiosApiClient, // You can pass your own typing, or use the global accesible AxiosApiClient
    @UsePrivateApiConfig()
    private readonly apiClientConfig: AxiosApiClientConfig, // type AxiosApiClientConfig is available globally too.
  ) {}

  callApi() {
    return this.apiClient.some_api_call();
  }
}
```

You can also instantiate it asyncronously:

```typescript
@Module({
  imports: [
    OpenApiAxiosModule.forClientsAsync([
      {
        key: SOME_API_KEY,
        useFactory: async (configService: ConfigService) => {
          return {
            definition: definition as OpenAPIV3.Document,
            withServer: {
              url: configService.get('API_URL'),
            },
          };
        },
        inject: [ConfigService],
        imports: [ConfigModule],
      },
    ]),
  ],
})
export class SomeApiModule {}
```
