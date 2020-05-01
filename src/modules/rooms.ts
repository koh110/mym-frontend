import { Dispatch } from 'redux'
import { sendSocket, SendSocketMessage, SendSocketCmd } from '../lib/util'
import { State } from './index'
import { sortRoom } from './socket'
import {
  RoomsActions,
  RoomsAction,
  ReceiveRoom,
  RoomsState,
  Room
} from './rooms.types'
import { closeMenu } from './ui'

const splited = location.pathname.split('/')
const initCurrentRoomName = splited[1] === 'rooms' ? splited[2] : ''

export const initState: RoomsState = {
  rooms: { byId: {}, allIds: [], order: [] },
  currentRoomId: '',
  currentRoomName: initCurrentRoomName,
  currentRoomIcon: null,
  scrollTargetIndex: 'bottom',
  openRoomSetting: false
}

export const reducer = (
  state: RoomsState = initState,
  action: RoomsAction
): RoomsState => {
  switch (action.type) {
    case RoomsActions.SetRooms: {
      const allIds = []
      for (const r of action.payload.rooms) {
        if (!allIds.includes(r.id)) {
          allIds.push(r.id)

          const room: Room = {
            id: r.id,
            name: r.name,
            iconUrl: r.iconUrl,
            unread: r.unread,
            messages: [],
            loading: false,
            receivedMessages: false,
            existHistory: false
          }
          state.rooms.byId[r.id] = room
        }
      }
      state.rooms.allIds = allIds
      return { ...state }
    }
    case RoomsActions.SetRoomIds: {
      state.rooms.allIds = [...action.payload.allIds]
      return { ...state }
    }
    case RoomsActions.SetRoomOrder: {
      state.rooms.order = [...action.payload.roomOrder]
      return { ...state }
    }
    case RoomsActions.CreateRoom: {
      return {
        ...state,
        currentRoomId: action.payload.id,
        currentRoomName: action.payload.name,
        currentRoomIcon: ''
      }
    }
    case RoomsActions.GetMessages: {
      const room = state.rooms.byId[action.payload.id]
      if (room) {
        state.rooms.byId[action.payload.id] = { ...room, loading: true }
      }
      return { ...state }
    }
    case RoomsActions.ChangeRoom: {
      return {
        ...state,
        currentRoomId: action.payload.id,
        currentRoomName: state.rooms.byId[action.payload.id].name,
        currentRoomIcon: state.rooms.byId[action.payload.id].iconUrl,
        scrollTargetIndex: 'bottom',
        openRoomSetting: false
      }
    }
    case RoomsActions.EnterRoomSuccess: {
      const room = state.rooms.byId[action.payload.id]
      if (room) {
        state.rooms.byId[action.payload.id] = {
          ...state.rooms.byId[action.payload.id],
          loading: action.payload.loading
        }
      }

      return {
        ...state,
        currentRoomId: action.payload.id,
        currentRoomName: action.payload.name,
        currentRoomIcon: action.payload.iconUrl
      }
    }
    case RoomsActions.ExitRoom: {
      return {
        ...state,
        currentRoomId: '',
        currentRoomName: '',
        currentRoomIcon: ''
      }
    }
    case RoomsActions.ReceiveMessage: {
      const isCurrent = action.payload.room === state.currentRoomId
      const room = state.rooms.byId[action.payload.room]

      room.loading = false
      room.messages = [...room.messages, action.payload.message]
      if (!isCurrent) {
        room.unread++
      }

      return {
        ...state,
        scrollTargetIndex: 'bottom'
      }
    }
    case RoomsActions.ReceiveMessages: {
      const roomId = action.payload.room
      // uniq
      const arr = [
        ...action.payload.messages,
        ...state.rooms.byId[roomId].messages
      ]
      const messages = [...new Set(arr)]

      const scrollTargetIndex =
        action.payload.room === state.currentRoomId &&
        !state.rooms.byId[roomId].receivedMessages
          ? action.payload.messages.length
          : state.scrollTargetIndex

      const room = {
        ...state.rooms.byId[roomId],
        messages,
        loading: false,
        receivedMessages: true,
        existHistory: action.payload.existHistory
      }
      state.rooms.byId[roomId] = room

      return {
        ...state,
        scrollTargetIndex
      }
    }
    case RoomsActions.AlreadyRead: {
      state.rooms.byId[action.payload.room] = {
        ...state.rooms.byId[action.payload.room],
        unread: 0
      }
      return { ...state }
    }
    case RoomsActions.ReloadMessages: {
      state.rooms.byId[action.payload.room].messages = [
        ...state.rooms.byId[action.payload.room].messages
      ]
      return { ...state }
    }
    case RoomsActions.ToggleSetting:
      return { ...state, openRoomSetting: !state.openRoomSetting }
    default:
      return state
  }
}

export const getMessages = (roomId: string, socket: WebSocket): RoomsAction => {
  sendSocket(socket, {
    cmd: SendSocketCmd.MESSAGES_ROOM,
    room: roomId
  })
  return { type: RoomsActions.GetMessages, payload: { id: roomId } }
}

export const createRoom = (name: string) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ name })
    })
    if (res.status === 200) {
      const room: { id: string; name: string } = await res.json()
      sendSocket(getState().socket.socket, { cmd: SendSocketCmd.ROOMS_GET })
      dispatch({
        type: RoomsActions.CreateRoom,
        payload: { id: room.id, name: room.name }
      })
    }
    return res
  }
}

export const changeRoom = (roomId: string) => {
  return async (dispatch: Dispatch, getState: () => State) => {
    const room = getState().rooms.rooms.byId[roomId]
    if (room) {
      if (!room.receivedMessages && !room.loading) {
        dispatch(getMessages(room.id, getState().socket.socket))
      }
      dispatch({
        type: RoomsActions.ChangeRoom,
        payload: {
          id: room.id
        }
      })
      dispatch(closeMenu())
      return
    }
  }
}

export const enterRoom = (roomName: string) => {
  return async (dispatch: Dispatch, getState: () => State) => {
    const room = Object.values(getState().rooms.rooms.byId).find(
      (r) => r.name === roomName
    )
    if (room) {
      changeRoom(room.id)(dispatch, getState)
      return
    }
    sendSocket(getState().socket.socket, {
      cmd: SendSocketCmd.ROOMS_ENTER,
      name: encodeURIComponent(roomName)
    })
    dispatch(closeMenu())
  }
}

export const exitRoom = (roomId: string) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    const res = await fetch('/api/rooms/enter', {
      method: 'DELETE',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ room: roomId })
    })
    if (res.status === 200) {
      sendSocket(getState().socket.socket, { cmd: SendSocketCmd.ROOMS_GET })
      dispatch({ type: RoomsActions.ExitRoom })
    }
    return res
  }
}

export const getHistory = (id: string, roomId: string, socket: WebSocket) => {
  const message: SendSocketMessage = {
    cmd: SendSocketCmd.MESSAGES_ROOM,
    room: roomId,
    id: id
  }
  sendSocket(socket, message)
}

const sendSortRoom = (roomOrder: string[]) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    const { allIds } = getState().rooms.rooms
    if (
      allIds.length !== 0 &&
      JSON.stringify(allIds) !== JSON.stringify(roomOrder)
    ) {
      const back = [...allIds]
      for (const e of roomOrder) {
        if (back.includes(e)) {
          delete back[back.indexOf(e)]
        }
      }
      const newOrder = [...roomOrder, ...back.filter((e) => !!e)]
      dispatch({
        type: RoomsActions.SetRoomIds,
        payload: { allIds: newOrder }
      })
      sortRoom(newOrder)(dispatch, getState)
    }
  }
}

export const receiveRooms = (rooms: ReceiveRoom[], currentRoomId: string) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    if (currentRoomId) {
      dispatch(getMessages(currentRoomId, getState().socket.socket))
    }
    dispatch({
      type: RoomsActions.SetRooms,
      payload: {
        rooms: rooms
      }
    })
    sendSortRoom(getState().rooms.rooms.order)(dispatch, getState)
  }
}

export const setRoomOrder = (roomOrder: string[]) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    dispatch({
      type: RoomsActions.SetRoomOrder,
      payload: { roomOrder }
    })
    sendSortRoom(roomOrder)(dispatch, getState)
  }
}

export const receiveMessage = (messageId: string, room: string) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    // 現在みている部屋だったら既読フラグを返す
    if (room === getState().rooms.currentRoomId) {
      readMessages(room)(dispatch, getState)
    }
    return dispatch({
      type: RoomsActions.ReceiveMessage,
      payload: {
        message: messageId,
        room: room
      }
    })
  }
}

export const receiveMessages = ({
  messageIds,
  room,
  existHistory
}: {
  messageIds: string[]
  room: string
  existHistory: boolean
}) => {
  return async (dispatch: Dispatch<RoomsAction>) => {
    return dispatch({
      type: RoomsActions.ReceiveMessages,
      payload: {
        room: room,
        existHistory: existHistory,
        messages: messageIds
      }
    })
  }
}

export const enterSuccess = (id: string, name: string, iconUrl: string) => {
  return async (dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    const room = getState().rooms.rooms.byId[id]
    // すでに入っている部屋だったら部屋の再取得をしない
    if (!room) {
      sendSocket(getState().socket.socket, { cmd: SendSocketCmd.ROOMS_GET })
    }
    let loading = false
    if (room && !room.receivedMessages && !loading) {
      dispatch(getMessages(id, getState().socket.socket))
      loading = true
    }
    dispatch({
      type: RoomsActions.EnterRoomSuccess,
      payload: { id: id, name: name, iconUrl, loading }
    })
  }
}

export const getUsers = (roomId: string) => {
  return async (_dispatch: Dispatch<RoomsAction>) => {
    if (!roomId) {
      return
    }
    const res = await fetch(`/api/rooms/${roomId}/users`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
    return res
  }
}

export const readMessages = (roomId: string) => {
  return async (_dispatch: Dispatch<RoomsAction>, getState: () => State) => {
    sendSocket(getState().socket.socket, {
      cmd: SendSocketCmd.ROOMS_READ,
      room: roomId
    })
  }
}

export const alreadyRead = (roomId: string): RoomsAction => {
  return { type: RoomsActions.AlreadyRead, payload: { room: roomId } }
}

export const reloadMessage = (roomId: string): RoomsAction => {
  return {
    type: RoomsActions.ReloadMessages,
    payload: { room: roomId }
  }
}

export const toggleRoomSetting = (): RoomsAction => {
  return { type: RoomsActions.ToggleSetting }
}

export const closeRoomSetting = (): RoomsAction => {
  return { type: RoomsActions.CloseSetting }
}

export const uploadIcon = (name: string, blob: Blob) => {
  return async (dispatch: Dispatch<RoomsAction>) => {
    const formData = new FormData()
    formData.append('icon', blob)
    const res = await fetch(`/api/icon/rooms/${name}`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (res.ok) {
      const { id, version } = await res.json()
      dispatch({ type: RoomsActions.SetIcon, payload: { id, version } })
    }

    return res
  }
}
