import { PluginType } from '@resourvereign/common/models/plugin.js';
import { addSeconds, endOfDay, startOfDay, subDays } from 'date-fns';
import { scheduleJob } from 'node-schedule';

import IntentModel, { IntentDocument } from '../models/intent.js';
import {
  IntegrationUserPluginDocument,
  NotificationsUserPluginDocument,
  SchedulingUserPluginDocument,
  UserPluginDocument,
} from '../models/userPlugin.js';

import { loggerForUser } from './logger.js';
import { MiddlewareChain } from './middlewareChain.js';
import {
  IntegrationPlugin,
  NotificationsPlugin,
  ScheduleMiddlewareContext,
  SchedulingPlugin,
  getPlugin,
} from './plugin.js';

const jobs = new Map<string, () => void>();

const isIntentSchedulable = (intent: IntentDocument) => {
  const todayStartOfDay = startOfDay(new Date());

  return !intent.satisfied && intent.date >= todayStartOfDay;
};

const getPluginInstance = async <UserPluginType extends UserPluginDocument>(
  userPlugin: UserPluginType,
) => {
  const plugin = getPlugin(userPlugin.type, userPlugin.name);

  if (plugin) {
    return (await plugin.initialize(
      { ...userPlugin.config },
      loggerForUser(userPlugin.user.toString(), userPlugin.name),
    )) as UserPluginType extends IntegrationUserPluginDocument
      ? ReturnType<IntegrationPlugin['initialize']>
      : UserPluginType extends NotificationsUserPluginDocument
        ? ReturnType<NotificationsPlugin['initialize']>
        : UserPluginType extends SchedulingUserPluginDocument
          ? ReturnType<SchedulingPlugin['initialize']>
          : unknown;
  }

  return null;
};

const getNextDate = async (intent: IntentDocument) => {
  await intent.integration.populate('addons');

  const now = new Date();

  const middlewareChain = new MiddlewareChain<ScheduleMiddlewareContext>();

  // Loop through scheduling plugins and apply middleware
  for (const notificationPlugin of intent.integration.addons.filter(
    (addon) => addon.type === PluginType.Scheduling,
  ) as SchedulingUserPluginDocument[]) {
    const notificationInstance = await getPluginInstance(notificationPlugin);
    if (notificationInstance) {
      middlewareChain.use(notificationInstance.scheduleMiddleware);
    }
  }

  const context: ScheduleMiddlewareContext = {
    intent,
    date: now,
  };

  await middlewareChain.execute(context);

  return context.date;
};

export const scheduleIntent = async (intent: IntentDocument) => {
  // Cancel previous schedule if exists
  if (jobs.has(intent.id)) {
    const jobDisposer = jobs.get(intent.id)!;
    jobDisposer();
  }

  if (intent.satisfied || !isIntentSchedulable(intent)) {
    return;
  }

  const nextDate = await getNextDate(intent);

  // TODO: limit past scheduling

  console.log('nextDate: ', nextDate);

  if (nextDate) {
    // Schedule job
    const job = scheduleJob(
      new Date(Math.max(nextDate.getTime(), addSeconds(new Date(), 1).getTime())),
      async () => {
        const updatedIntent = await IntentModel.findOne({ _id: intent.id })
          .populate('integration')
          .exec();

        // If intent is not found, is satisfied or is scheduled for the past cancel job
        if (!updatedIntent || !isIntentSchedulable(intent)) {
          disposer();
          return;
        }

        const integrationInstance = await getPluginInstance(updatedIntent.integration);

        if (integrationInstance) {
          const result = await integrationInstance.book(intent.date);

          if (result) {
            updatedIntent.satisfied = true;
            await updatedIntent.save();

            // Loop through notification plugins and send notification
            await updatedIntent.integration.populate('addons');
            for (const notificationPlugin of updatedIntent.integration.addons.filter(
              (addon) => addon.type === PluginType.Notifications,
            ) as NotificationsUserPluginDocument[]) {
              const notificationInstance = await getPluginInstance(notificationPlugin);

              // TODO: improve notification message
              await notificationInstance?.notify(
                `${intent.integration.label} successfully booked for ${intent.date}`,
              );
            }
            disposer();
          }
        }
      },
    );

    const disposer = () => {
      // cancel job
      if (job) {
        job.cancel();
      }

      // delete from map
      jobs.delete(intent.id);
    };

    if (job) {
      // Register disposer for intent
      jobs.set(intent.id, disposer);
    }
  }
};

export const cancelIntent = (intent: IntentDocument) => {
  const jobDisposer = jobs.get(intent.id);

  if (jobDisposer) {
    jobDisposer();
  }
};

export const initializeScheduler = async () => {
  // Filter intents that are not satisfied and are scheduled for the future
  const yesterdayEndOfDay = endOfDay(subDays(new Date(), 1));
  const intents = await IntentModel.find({ date: { $gte: yesterdayEndOfDay }, satisfied: false })
    .populate('integration')
    .exec();

  // Schedule intents
  intents.forEach((intent) => {
    scheduleIntent(intent);
  });
};
