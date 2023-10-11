import { Intent } from '@resourvereign/common/models/intent.js';
import normalizeJson from '@slangy/mongo/middleware/mongoose/normalizeJson.js';
import owner from '@slangy/mongo/middleware/mongoose/owner.js';
import timestamps from '@slangy/mongo/middleware/mongoose/timestamps.js';
import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type IntentDocument = HydratedDocument<Intent>;

const intentSchema = new Schema<Intent>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    resource: {
      type: Types.ObjectId,
      required: true,
      ref: 'Plugin',
      index: true,
    },
    satisfied: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { collection: 'intents', minimize: false },
)
  .plugin(owner)
  .plugin(timestamps)
  .plugin(normalizeJson, { remove: ['password', '__v', 'user'] });

export default model('Intent', intentSchema);