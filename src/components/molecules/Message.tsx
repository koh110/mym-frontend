import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import styled from 'styled-components'
import CreateIcon from '@material-ui/icons/Create'
import ThumbUpIcon from '@material-ui/icons/ThumbUp'
import { sanitize } from '../../lib/sanitize'
import { State, store } from '../../modules/index'
import { startToEdit } from '../../modules/ui'
import { incrementIine } from '../../modules/socket'
import MessageBody from '../atoms/MessageBody'

const MessageWrap = styled.div`
  padding: 10px 15px 10px;
  border-radius: 1px;
  color: #dcddde;
  border-bottom: 1px solid var(--color-border);
  display: grid;
  grid-template-columns: 40px;
  grid-template-areas:
    'icon message-header'
    'icon message-body'
    'icon message-footer';

  .header,
  .user-icon {
    margin: 4px 0 0 0;
  }

  .header {
    grid-area: message-header;
    display: flex;
    .iine {
      display: flex;
      margin-left: 16px;
      .num {
        margin-left: 4px;
      }
    }
    .actions {
      visibility: hidden;
      flex: 1;
      display: flex;
      justify-content: flex-end;
    }
    .icon {
      cursor: pointer;
      svg {
        font-size: 1rem;
      }
    }
    time {
      margin-left: 16px;
      letter-spacing: 0;
    }
  }

  .body {
    grid-area: message-body;
  }

  .user-icon {
    grid-area: icon;
    width: 25px;
    height: 25px;
    border-radius: 2px;
  }

  .footer {
    grid-area: message-footer;
    .updated {
      margin-top: 4px;
      font-size: 8px;
      color: hsla(0, 100%, 100%, 0.5);
    }
  }

  &:hover {
    .actions {
      visibility: visible;
    }
  }
  &.kururi {
    animation: kururi 0.75s 0s 1;
  }
  @keyframes kururi {
    0% {
      transform: scale(0.8) rotateY(90deg);
    }
    40% {
      transform: scale(0.8) rotateY(0deg);
    }
    100% {
      transform: scale(1);
    }
  }
`

type Props = {
  message: string
  iine: number
  html: string
  userId: string
  userAccount: string
  iconUrl: string
  updated: boolean
  createdAt: string
  beforeIine: number
  myAccount: string
  iineHandler: (event: React.MouseEvent) => void
  startEditHandler: (event: React.MouseEvent) => void
}

function PresentationalMessage({
  message,
  iine,
  html,
  userId,
  userAccount,
  iconUrl,
  updated,
  createdAt,
  beforeIine,
  myAccount,
  iineHandler,
  startEditHandler
}: Props) {
  const [iineAction, setIineAction] = useState(false)
  const day = dayjs(new Date(createdAt))
  const date = day.format(
    day.year() === new Date().getFullYear()
      ? 'MM/DD HH:mm:ss'
      : 'YYYY/MM/DD HH:mm:ss'
  )
  const account = userAccount ? userAccount : userId

  useEffect(() => {
    let timer = null
    if (beforeIine !== undefined && beforeIine !== iine && !iineAction) {
      setIineAction(true)
      timer = setTimeout(() => {
        setIineAction(false)
      }, 1000)
    }

    return () => {
      timer && clearTimeout(timer)
    }
  }, [beforeIine, iine])

  return (
    <MessageWrap className={iineAction ? 'kururi' : ''}>
      <img className="user-icon" src={iconUrl} />
      <div className="header">
        <div className="account">{account}</div>
        <div className="iine icon" onClick={iineHandler}>
          <ThumbUpIcon />
          {iine !== 0 && <div className="num">{iine}</div>}
        </div>
        <div className="actions">
          <div className="icon">
            {myAccount === account && <CreateIcon onClick={startEditHandler} />}
          </div>
        </div>
        <time>{date}</time>
      </div>
      <MessageBody className="body" message={message} html={sanitize(html)} />
      <div className="footer">
        {updated && <div className="updated">(編集済み)</div>}
      </div>
    </MessageWrap>
  )
}

function ContainerMessage({ id }: { id: string }) {
  const myAccount = useSelector((state: State) => state.user.me.account)
  const messageObj = useSelector(
    (state: State) => state.messages.messages.byId[id]
  )

  const dispatch = useDispatch()

  const iineHandler = () => {
    incrementIine(id)(dispatch, store.getState)
  }
  const startEditHandler = () => {
    dispatch(startToEdit(messageObj.id, messageObj.message))
  }
  const prevIineRef = useRef<number>()
  useEffect(() => {
    prevIineRef.current = messageObj ? messageObj.iine : undefined
  })

  if (!messageObj) {
    return <></>
  }

  return (
    <PresentationalMessage
      message={messageObj.message}
      iine={messageObj.iine}
      html={messageObj.html}
      userId={messageObj.userId}
      userAccount={messageObj.userAccount}
      iconUrl={messageObj.iconUrl}
      updated={messageObj.updated}
      createdAt={messageObj.createdAt}
      beforeIine={prevIineRef.current}
      myAccount={myAccount}
      iineHandler={iineHandler}
      startEditHandler={startEditHandler}
    />
  )
}

export default function Message({ id }: { id: string }) {
  return <ContainerMessage id={id} />
}
