/**
 * Author: Huan LI https://github.com/atorber
 * Date: Apr 2023
 */

import { Wechaty, WechatyPlugin, log } from 'wechaty'
import { PUPPET_EVENT_DICT } from 'wechaty-puppet/types'
import * as mqtt from 'mqtt'

type EventType = keyof typeof PUPPET_EVENT_DICT;

export type EventList = EventType[];

export type MqttConfig = {
  endpoint: string;
  username: string;
  password: string;
  topic: string;
}

export type EventPublisherConfig = {
  eventList: EventList;
  mqttCongig: MqttConfig;
}

export function EventPublisher (options: EventPublisherConfig): WechatyPlugin {
  log.verbose('WechatyPluginContrib', 'EventPublisher("%s")', JSON.stringify(options))

  // Extract event list from options
  const config: EventList = options.eventList
  log.verbose('WechatyPluginContrib', 'EventList("%s")', JSON.stringify(config))

  // Create MQTT client
  const client = mqtt.connect(options.mqttCongig.endpoint, {
    password: options.mqttCongig.password,
    username: options.mqttCongig.username,
  })

  return function EventPublisherPlugin (wechaty: Wechaty) {
    log.verbose('WechatyPluginContrib', 'EventPublisher installing on %s ...', wechaty)

    // Loop over all puppet events
    for (const key of Object.keys(PUPPET_EVENT_DICT)) {
      const eventName = key as EventType
      // If a config list is provided and current event is not in the list, skip it
      if (config.length > 0 && !config.includes(eventName)) {
        continue
      }

      // Listen for each event
      wechaty.on(eventName as any, (...args: any[]) => {
        log.info('WechatyPluginContrib', 'EventPublisherPlugin() %s: %s', eventName, JSON.stringify(args))
        const payload = {
          data: args,
          eventName,
        }

        // Publish event details to MQTT
        try {
          client.publish(options.mqttCongig.topic, JSON.stringify(payload))
        } catch (err) {
          log.error('WechatyPluginContrib', err)
        }

        // Log errors
        if (eventName === 'error') {
          log.error('WechatyPluginContrib', args[0])
        }
      })
    }
  }
}
