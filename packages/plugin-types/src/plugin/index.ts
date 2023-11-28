import { IntegrationPlugin } from './integration.js';
import { NotificationsPlugin } from './notifications.js';
import { SchedulingPlugin } from './scheduling.js';

export enum PluginType {
  Integration = 'integration',
  Scheduling = 'scheduling',
  Notifications = 'notifications',
}

export enum PluginSchemaPropertyType {
  string = 'string',
  uint32 = 'uint32',
}

export type PluginSchema = {
  properties: {
    [name: string]: {
      type: PluginSchemaPropertyType;
      nullable?: boolean;
      metadata?: {
        secret?: boolean;
        overrideable?: boolean;
      };
    };
  };
};

export type DefaultPluginConfig = {
  [key: string]: unknown;
};

export type BasePlugin<Schema = PluginSchema> = {
  schema: Schema;
};

export type Plugin = IntegrationPlugin | NotificationsPlugin | SchedulingPlugin;