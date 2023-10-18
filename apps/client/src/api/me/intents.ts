import { ApiModel } from '@resourvereign/common/api/common.js';
import { Intent as IntentFromServer, IntentInput } from '@resourvereign/common/api/me/intents.js';
import { deleteRequest, getRequest, postRequest, putRequest } from '@slangy/client/rest/request.js';
import { Jsonify, Merge } from 'type-fest';

export type Intent = Merge<Jsonify<IntentFromServer>, ReturnType<typeof parseIntent>>;

export type IntentUpdate = ApiModel<IntentInput>;
export type IntentCreate = IntentInput;

export type IntentData = IntentUpdate | IntentCreate;

const basePath = '/api/me/intents';

const parseIntent = (intent: Jsonify<IntentFromServer>) => ({
  ...intent,
  date: new Date(intent.date),
});

export const listIntents = (month: Date) => {
  const searchParams = new URLSearchParams({ month: month.toISOString() });

  return getRequest<IntentFromServer[]>(`${basePath}?${searchParams.toString()}`).then((intents) =>
    intents.map(parseIntent),
  );
};

export const createIntent = async (intent: IntentCreate) =>
  await postRequest<IntentInput, IntentFromServer>(basePath, intent).then(parseIntent);

export const updateIntent = async (intent: IntentUpdate) => {
  const { id, ...rest } = intent;
  return await putRequest<IntentInput, IntentFromServer>(`${basePath}/${id}`, rest).then(
    parseIntent,
  );
};

export const removeIntent = async (id: Intent['id']) => {
  await deleteRequest(`${basePath}/${id}`);
};
