/* eslint-disable sort-keys */
/* eslint-disable no-console */
import mqtt, { MqttClient, IClientOptions } from 'mqtt'

class MqttProxy {

  private static instance: MqttProxy | undefined
  private mqttClient: MqttClient
  private messageQueue: Array<{ topic: string; message: string }> = []
  private isConnected: boolean = false

  private constructor (config: IClientOptions) {
    this.mqttClient = mqtt.connect(config)

    this.mqttClient.on('connect', () => {
      console.log('MQTT connected')
      this.isConnected = true
      // 发送所有排队的消息
      this.messageQueue.forEach(({ topic, message }) => {
        this.mqttClient.publish(topic, message)
      })
      // 清空消息队列
      this.messageQueue = []
    })

    this.mqttClient.on('error', (error) => {
      console.error('MQTT error:', error)
      this.isConnected = false
    })

    this.mqttClient.on('close', () => {
      console.log('MQTT connection closed')
      this.isConnected = false
    })
  }

  public static getInstance (config?: IClientOptions): MqttProxy {
    if (!MqttProxy.instance && config) {
      MqttProxy.instance = new MqttProxy(config)
    } else if (!MqttProxy.instance) {
      throw new Error('MQTTProxy has not been initialized with a config.')
    }

    return MqttProxy.instance
  }

  public publish (topic: string, message: string) {
    if (this.isConnected) {
      this.mqttClient.publish(topic, message, (error) => {
        if (error) {
          console.error(`Failed to publish message: ${error}`)
        }
      })
    } else {
      console.log('MQTT client not connected. Queueing message.')
      this.messageQueue.push({ topic, message })
    }
  }

}

// 初始化并传入 MQTT 连接配置
function initMqttProxy () {
  const config: IClientOptions = {
    host: 'mqtt.example.com',
    port: 1883,
    clientId: 'my-mqtt-client',
    // 其他 MQTT 连接配置
  }

  const mqttProxy = MqttProxy.getInstance(config)
  mqttProxy.publish('my/topic', 'Hello, MQTT!')
}

initMqttProxy() // 初始化并配置

// 在其他地方全局中使用单例实例
const mqttProxy = MqttProxy.getInstance() // 不需要传递配置
mqttProxy.publish('my/topic', 'Hello again, MQTT!')
