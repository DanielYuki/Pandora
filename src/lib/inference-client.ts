// TODO: improve inference client for template (heavily based on GRPC -> think if this is the best approach)

import * as grpc from '@grpc/grpc-js';
import {
  type InferenceRequest,
  type InferenceResponse,
  InferenceServiceClient,
} from './generated/inference';

export class InferenceClient {
  private client: InferenceServiceClient;

  constructor(serverAddress: string = 'localhost:50051') {
    // Use SSL credentials for Cloud Run services, insecure for local development
    const credentials =
      serverAddress.includes('run.app') || serverAddress.includes('googleapis.com')
        ? grpc.credentials.createSsl()
        : grpc.credentials.createInsecure();

    this.client = new InferenceServiceClient(serverAddress, credentials);
  }

  async infer(request: InferenceRequest): Promise<InferenceResponse> {
    return new Promise((resolve, reject) => {
      this.client.infer(request, (error: grpc.ServiceError | null, response: InferenceResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  close(): void {
    this.client.close();
  }
}

export { InferenceRequest, InferenceResponse } from './generated/inference';
