import {
  KlaviyoEvents,
  KlaviyoProfileProperties,
  type KlaviyoEventProperties,
  type KlaviyoProfile
} from './klaviyo.types';
import { klaviyoService } from './klaviyo.service';

export type MessageChannel = 'admin';

export interface MessageReceivedEventParams {
  patientId: string;
  email: string;
  channel: MessageChannel;
  additionalProfileProperties?: Partial<KlaviyoProfile>;
}

export class KlaviyoCrmService {
  static async sendMessageReceived(params: MessageReceivedEventParams): Promise<void> {
    const { patientId, email, channel, additionalProfileProperties = {} } = params;

    const eventProperties: KlaviyoEventProperties = {
      message_channel: channel
    };

    await klaviyoService.sendEvent({
      eventName: KlaviyoEvents.MESSAGE_RECEIVED,
      patientId,
      email,
      eventProperties,
      profileProperties: {
        [KlaviyoProfileProperties.LAST_MESSAGE_RECEIVED]: new Date().toISOString(),
        ...additionalProfileProperties
      }
    });
  }
}

