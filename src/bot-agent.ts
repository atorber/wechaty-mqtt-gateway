/* eslint-disable sort-keys */
import { FileBox } from 'file-box'
import type { MqttClient } from 'mqtt'
import { v4 } from 'uuid'
import type {
  Wechaty, types, MiniProgram, UrlLink, Room,
} from 'wechaty'

function propertyMessage (name: string, info: { id: string; gender: string | types.ContactGender.Male | types.ContactGender.Female; name: string; alias: string; avatar: string }[] | Room[]) {
  let message:any = {
    reqId: v4(),
    method: 'thing.property.post',
    version: '1.0',
    timestamp: new Date().getTime(),
    properties: {
    },
  }
  message.properties[name] = info
  message = JSON.stringify(message)
  return message
}

function eventMessage (name: string, info: string) {
  let message:any = {
    reqId: v4(),
    method: 'thing.event.post',
    version: '1.0',
    timestamp: new Date().getTime(),
    events: {
    },
  }
  message.events[name] = info
  message = JSON.stringify(message)
  return message
}

export class ChatDevice {

  bot!:Wechaty
  client: MqttClient
  constructor (bot:Wechaty, client:MqttClient) {
    this.bot = bot
    this.client = client
  }

  async onMessage (_topic: any, message: any) {
    // const content = JSON.parse(message.toString())
    message = JSON.parse(message)
    const name = message.name
    const params = message.params

    if (name === 'start') { /* empty */ }
    if (name === 'stop') { /* empty */ }
    if (name === 'logout') { /* empty */ }
    if (name === 'logonoff') { /* empty */ }
    if (name === 'userSelf') { /* empty */ }
    if (name === 'say') { /* empty */ }
    if (name === 'send') {
      await this.send(params)
    }
    if (name === 'sendAt') {
      await this.sendAt(params)
    }

    if (name === 'aliasGet') { /* empty */ }
    if (name === 'aliasSet') { /* empty */ }
    if (name === 'roomCreate') {
      await this.createRoom(params)
    }
    if (name === 'roomAdd') { /* empty */ }
    if (name === 'roomDel') { /* empty */ }
    if (name === 'roomAnnounceGet') { /* empty */ }
    if (name === 'roomAnnounceSet') { /* empty */ }
    if (name === 'roomQuit') { /* empty */ }
    if (name === 'roomTopicGet') { /* empty */ }
    if (name === 'roomTopicSet') { /* empty */ }
    if (name === 'roomQrcodeGet') {
      await this.getQrcod(params)

    }
    if (name === 'memberAllGet') { /* empty */ }
    if (name === 'contactAdd') { /* empty */ }
    if (name === 'contactAliasSet') { /* empty */ }
    if (name === 'contactFindAll') {
      await this.getAllContact()
    }
    if (name === 'contactFind') { /* empty */ }
    if (name === 'roomFindAll') {
      await this.getAllRoom()
    }
    if (name === 'roomFind') { /* empty */ }
    if (name === 'config') { /* empty */ }

  }

  async getAllContact () {
    const contactList = await this.bot.Contact.findAll()
    const friends:any = []
    for (const i in contactList) {
      const contact = contactList[i]
      let avatar = ''
      try {
        avatar = JSON.parse(JSON.stringify(await contact?.avatar())).url
      } catch (err) {

      }
      const contactInfo = {
        id: contact?.id,
        gender: contact?.gender() || '',
        name: contact?.name() || '',
        alias: await contact?.alias() || '',
        avatar,
      }
      friends.push(contactInfo)
    }
    const msg = propertyMessage('contactList', friends)
    return msg

  }

  async getAllRoom () {
    const roomList = await this.bot.Room.findAll()
    for (const i in roomList) {
      const room:Room|undefined = roomList[i]
      const roomInfo:any = {}
      roomInfo.id = room?.id

      const avatar = await room?.avatar()
      roomInfo.avatar = JSON.parse(JSON.stringify(avatar)).url

      roomInfo.ownerId = room?.owner()?.id
      try {
        roomInfo.topic = await room?.topic()
      } catch (err) {
        roomInfo.topic = room?.id
      }
      //   let memberAlias = ''
      //   try {
      //     memberAlias = await room.alias(talker)
      //   } catch (err) {

      //   }
      roomList[i] = roomInfo
    }
    const msg = propertyMessage('roomList', roomList)
    return msg
  }

  async send (params: { messageType: string; messagePayload: string | MiniProgram | UrlLink | string[]; toContacts: any }) {

    let msg:any = ''
    if (params.messageType === 'Text') {
      /* {
        "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
        "method":"thing.command.invoke",
        "version":"1.0",
        "timestamp":1610430718000,
        "name":"send",
        "params":{
            "toContacts":[
                "tyutluyc",
                "5550027590@chatroom"
            ],
            "messageType":"Text",
            "messagePayload":"welcome to wechaty!"
        }
      } */
      msg = params.messagePayload

    } else if (params.messageType === 'Contact') {
      /* {
            "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
            "method":"thing.command.invoke",
            "version":"1.0",
            "timestamp":1610430718000,
            "name":"send",
            "params":{
                "toContacts":[
                    "tyutluyc",
                    "5550027590@chatroom"
                ],
                "messageType":"Contact",
                "messagePayload":"tyutluyc"
            }
        } */
      const contactCard = await this.bot.Contact.find({ id: (params.messagePayload as string) })
      if (!contactCard) {
        return {
          msg: '无此联系人',
        }
      } else {
        msg = contactCard
      }

    } else if (params.messageType === 'Attachment') {
      /* {
          "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
          "method":"thing.command.invoke",
          "version":"1.0",
          "timestamp":1610430718000,
          "name":"send",
          "params":{
              "toContacts":[
                  "tyutluyc",
                  "5550027590@chatroom"
              ],
              "messageType":"Attachment",
              "messagePayload":"/tmp/text.txt"
          }
      } */
      if ((params.messagePayload as string).indexOf('http') !== -1 || (params.messagePayload as string).indexOf('https') !== -1) {
        msg = FileBox.fromUrl(params.messagePayload as string)
      } else {
        msg = FileBox.fromFile(params.messagePayload as string)
      }

    } else if (params.messageType === 'Image') {
      /* {
          "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
          "method":"thing.command.invoke",
          "version":"1.0",
          "timestamp":1610430718000,
          "name":"send",
          "params":{
              "toContacts":[
                  "tyutluyc",
                  "5550027590@chatroom"
              ],
              "messageType":"Image",
              "messagePayload":"https://wechaty.github.io/wechaty/images/bot-qr-code.png"
          }
      } */
      // msg = FileBox.fromUrl(params.messagePayload)
      if ((params.messagePayload as string).indexOf('http') !== -1 || (params.messagePayload as string).indexOf('https') !== -1) {
        msg = FileBox.fromUrl(params.messagePayload as string)
      } else {
        msg = FileBox.fromFile(params.messagePayload as string)
      }

    } else if (params.messageType === 'Url') {
      /* {
          "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
          "method":"thing.command.invoke",
          "version":"1.0",
          "timestamp":1610430718000,
          "name":"send",
          "params":{
              "toContacts":[
                  "tyutluyc",
                  "5550027590@chatroom"
              ],
              "messageType":"Url",
              "messagePayload":{
                  "description":"WeChat Bot SDK for Individual Account, Powered by TypeScript, Docker, and Love",
                  "thumbnailUrl":"https://avatars0.githubusercontent.com/u/25162437?s=200&v=4",
                  "title":"Welcome to Wechaty",
                  "url":"https://github.com/wechaty/wechaty"
              }
          }
      } */
      msg = params.messagePayload as UrlLink

    } else if (params.messageType === 'MiniProgram') {
      /* {
          "reqId":"442c1da4-9d3a-4f9b-a6e9-bfe858e4ac43",
          "method":"thing.command.invoke",
          "version":"1.0",
          "timestamp":1610430718000,
          "name":"send",
          "params":{
              "toContacts":[
                  "tyutluyc",
                  "5550027590@chatroom"
              ],
              "messageType":"MiniProgram",
              "messagePayload":{
                  "appid":"wx36027ed8c62f675e",
                  "description":"群组大师群管理工具",
                  "title":"群组大师",
                  "pagePath":"pages/start/relatedlist/index.html",
                  "thumbKey":"",
                  "thumbUrl":"http://mmbiz.qpic.cn/mmbiz_jpg/mLJaHznUd7O4HCW51IPGVarcVwAAAuofgAibUYIct2DBPERYIlibbuwthASJHPBfT9jpSJX4wfhGEBnqDvFHHQww/0",
                  "username":"gh_6c52e2baeb2d@app"
              }
          }
      } */
      msg = params.messagePayload as MiniProgram

    } else {
      return {
        msg: '不支持的消息类型',
      }
    }

    const toContacts = params.toContacts

    for (let i = 0; i < toContacts.length; i++) {
      if (toContacts[i].split('@').length === 2 || toContacts[i].split(':').length === 2) {
        const room = await this.bot.Room.find({ id: toContacts[i] })
        if (room) {
          try {
            await room.say(msg)
          } catch (err) {
            console.error(err)
          }
        }
      } else {
        // console.debug(bot)
        const contact = await this.bot.Contact.find({ id: toContacts[i] })
        if (contact) {
          try {
            await contact.say(msg)
          } catch (err) {
            console.error(err)
          }
        }
      }
    }

  }

  async sendAt (params: { toContacts: any; room: any; messagePayload: TemplateStringsArray }) {
    const atUserIdList = params.toContacts
    const room:Room|undefined = await this.bot.Room.find({ id: params.room })
    const atUserList = []
    for (const userId of atUserIdList) {
      const curContact = await this.bot.Contact.find({ id:userId })
      atUserList.push(curContact)
    }
    await room?.say(params.messagePayload, ...atUserList)
  }

  async createRoom (params: { contactList: { [x: string]: any }; topic: string | undefined }) {
    const contactList:any = []
    for (const i in params.contactList) {
      const c = await this.bot.Contact.find({ name: params.contactList[i] })
      contactList.push(c)
    }

    const room = await this.bot.Room.create(contactList, params.topic)
    // console.log('Bot', 'createDingRoom() new ding room created: %s', room)
    // await room.topic(params.topic)
    await room.say('你的专属群创建完成')
  }

  async getQrcod (params:any) {
    const roomId = params.roomId
    const room:Room|undefined = await this.bot.Room.find({ id: roomId })
    const qr = await room?.qrCode()
    const msg = eventMessage('qrcode', qr || '')
    return msg
  }

}
