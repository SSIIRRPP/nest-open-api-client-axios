import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientRegistryService {
  private registeredClientKeys = new Set<string>();

  registerClient(clientKey: string): boolean {
    if (this.registeredClientKeys.has(clientKey)) {
      return false;
    }
    this.registeredClientKeys.add(clientKey);
    return true;
  }

  isClientRegistered(clientKey: string): boolean {
    return this.registeredClientKeys.has(clientKey);
  }
}
