import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { State } from '../modules/index'
import { getMyInfo } from '../modules/user.action'
import { enterRoom } from '../modules/rooms.action'

function RouterListener({ history }: RouteComponentProps) {
  const currentRoomName = useSelector(
    (state: State) => state.rooms.currentRoomName
  )
  const login = useSelector((state: State) => state.user.login)
  const signup = useSelector((state: State) => state.user.signup)
  const socket = useSelector((state: State) => state.socket.socket)
  const rooms = useSelector((state: State) => state.rooms.rooms)
  const dispatch = useDispatch()

  useEffect(() => {
    if (login && currentRoomName === '') {
      history.push('/')
    }
  }, [login, currentRoomName])

  useEffect(() => {
    const room = history.location.pathname.match(/\/rooms\/(.+)/) && RegExp.$1
    if (!login && (history.location.pathname === '/' || room)) {
      getMyInfo()(dispatch)
    }

    if (login && room && socket) {
      enterRoom(history.location.pathname.split('/')[2], rooms)(
        dispatch,
        socket
      )
    }

    if (room) {
      document.title = `MZM (${room})`
    } else {
      document.title = `MZM`
    }
  }, [login, history.location.pathname])

  useEffect(() => {
    if (signup) {
      history.push('/signup')
    }
  }, [signup])

  return <></>
}

export default withRouter(RouterListener)
