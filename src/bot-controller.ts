/**
 * Author: Huan LI https://github.com/atorber
 * Date: Apr 2023
 */
import { Wechaty, WechatyPlugin, log } from 'wechaty'
import * as mqtt from 'mqtt'

export type BotControllerConfig = {
  endpoint: string;
  username: string;
  password: string;
  port?: number;
  clientid?: string;
  requesttopic: string;
  responsetopic?: string;
  secretkey?: string;
};

// Define a structured type for MQTT payload
type MqttPayload = {
  type: 'friend' | 'room'|undefined;
  to: string;
  content: string;
};

export function BotController (options: BotControllerConfig): WechatyPlugin {
  log.verbose('WechatyPluginContrib', 'BotController("%s")', JSON.stringify(options))

  // Setup MQTT client with provided options
  const client = mqtt.connect(options.endpoint, {
    clientId: options.clientid,
    password: options.password,
    port: options.port,
    username: options.username,
  })

  async function handleMqttMessage (message: Buffer, bot: Wechaty) {
    try {
      const payload: MqttPayload = JSON.parse(message.toString())
      if (payload.type === 'friend') {
        const friend = await bot.Contact.find({ name: payload.to })
        if (friend) {
          await friend.say(payload.content)
        }
      } else if (payload.type === 'room') {
        const room = await bot.Room.find({ topic: payload.to })
        if (room) {
          await room.say(payload.content)
        }
      }
    } catch (err) {
      throw new Error('Failed to handle MQTT message: ' + err)
    }
  }

  return function BotControllerPlugin (wechaty: Wechaty) {
    log.verbose('WechatyPluginContrib', 'BotController installing on %s ...', wechaty)

    // Listen for incoming MQTT messages
    client.on('message', (topic, message) => {
      log.verbose('topic, message:', topic, message)
      handleMqttMessage(message, wechaty).catch(error => {
        console.error('Error processing MQTT message:', error)
      })
    })

    // Subscribe to the desired MQTT topic
    client.subscribe(options.requesttopic, (error: Error | null) => {
      if (error) {
        console.error('Error subscribing to MQTT topic:', error)
      }
    })

    // Clean up MQTT client when the bot stops
    wechaty.on('stop', () => {
      client.end()
    })
  }
}
