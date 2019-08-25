import { combineReducers, createStore } from 'redux'
import { reducer as socketReducer } from './socket'
import { SocketState } from './socket.types'
import { reducer as roomsReducer } from './rooms'
import { RoomsState } from './rooms.types'
import { reducer as userReducer } from './user'
import { UserState } from './user.types'
import { reducer as uiReducer } from './ui'
import { UIState } from './ui.types'

export type State = {
  socket: SocketState
  rooms: RoomsState
  user: UserState
  ui: UIState
}

export const reducer = combineReducers({
  socket: socketReducer,
  rooms: roomsReducer,
  user: userReducer,
  ui: uiReducer
})

export const store = createStore(reducer)
