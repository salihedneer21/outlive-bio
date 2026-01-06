export const KlaviyoEvents = {
  MESSAGE_RECEIVED: 'Message Received'
} as const;

export type KlaviyoEventName = (typeof KlaviyoEvents)[keyof typeof KlaviyoEvents];

export const KlaviyoProfileProperties = {
  LAST_MESSAGE_RECEIVED: 'last_message_received'
} as const;

export type KlaviyoProfilePropertyKey =
  (typeof KlaviyoProfileProperties)[keyof typeof KlaviyoProfileProperties];

export interface KlaviyoProfile {
  [KlaviyoProfileProperties.LAST_MESSAGE_RECEIVED]?: string;
  // Allow extension with additional profile properties as needed
  [key: string]: unknown;
}

export interface KlaviyoEventProperties {
  [key: string]: string | number | boolean | Date;
}

export interface SendEventParams {
  eventName: KlaviyoEventName;
  patientId: string;
  email?: string;
  eventProperties?: KlaviyoEventProperties;
  profileProperties?: Partial<KlaviyoProfile>;
}

export interface KlaviyoErrorResponse {
  errors?: Array<{
    id?: string;
    status?: number;
    code?: string;
    title?: string;
    detail?: string;
    source?: { pointer?: string };
  }>;
}

