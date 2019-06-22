type Message = {
  id: string
  userId: string
  icon?: string
  userAccount: string
  message: string
  createdAt: string
}

type MyInfo = {
  id: string
  account: string
}

export type ReceiveMessage =
  | {
      cmd: 'message:receive'
      message: Message
      room: string
    }
  | {
      cmd: 'rooms'
      rooms: { id: string; name: string }[]
    }
  | {
      cmd: 'messages:room'
      messages: Message[]
      room: string
      existHistory: boolean
    }
  | {
      cmd: 'rooms:enter:success'
      id: string
      name: string
    }

export type SendMessage =
  | {
      cmd: 'message:send'
      message: string
      room: string
    }
  | {
      cmd: 'messages:room'
      room: string
      id?: string
    }
  | {
      cmd: 'rooms:get'
    }
  | {
      cmd: 'rooms:enter'
      name: string
    }

export type Action =
  | {
      type: 'websocket:init'
      payload: WebSocket
    }
  | {
      type: 'message:send'
      payload: string
    }
  | {
      type: 'message:receive'
      payload: Message
    }
  | {
      type: 'rooms:receive'
      payload: { id: string; name: string }[]
    }
  | {
      type: 'rooms:set:current'
      payload: {
        id: string
        name?: string
      }
    }
  | {
      type: 'messages:room'
      payload: { room: string; existHistory: boolean; messages: Message[] }
    }
  | {
      type: 'me:set'
      payload: MyInfo
    }
  | {
      type: 'me:set:icon'
      payload: string
    }
  | {
      type: 'rooms:get'
    }
  | {
      type: 'messages:get:room:history'
      payload: string
    }
  | {
      type: 'logout'
    }
  | {
      type: 'rooms:exit'
    }
  | {
      type: 'rooms:create'
      payload: { id: string; name: string }
    }
  | {
      type: 'remove:user'
    }

export type State = {
  login: boolean
  socket: WebSocket
  scrollBottomMessage: boolean
  messages: Message[]
  existHistory: boolean
  rooms: {
    id: string
    name: string
    current: boolean
  }[]
  currentRoom: string
  currentRoomName: string
  me: MyInfo
  icon: string
}
