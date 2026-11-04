'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, buildSessionWsUrl } from '@/lib/api'
import type { WsMessage } from '@/lib/types'
import { useStore } from '@/store/useStore'

type DoctorId = 'dr_ananya' | 'dr_arjun'
type Language = 'kn' | 'en' | string

export function useDoctorBackendSession(onMessage: (message: WsMessage) => void) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const socketRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const languageRef = useRef<Language>('kn')
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const intentionalCloseRef = useRef(false)
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  const openSocket = useCallback((sessionId: string) => {
    if (intentionalCloseRef.current) return
    const socket = new WebSocket(buildSessionWsUrl(sessionId))
    socketRef.current = socket
    socket.onopen = () => {
      reconnectAttemptsRef.current = 0
      setStatus('connected')
      socket.send(JSON.stringify({ type: 'set_language', language: languageRef.current }))
    }
    socket.onmessage = (event) => {
      try {
        handlerRef.current(JSON.parse(event.data) as WsMessage)
      } catch {
        handlerRef.current({ type: 'error', message: 'Received an invalid response from the consultation backend.' })
      }
    }
    socket.onerror = () => setStatus('disconnected')
    socket.onclose = (event) => {
      setStatus('disconnected')
      // Keep retrying transient network/backend failures. The delay is capped
      // below, so a sleeping tab won't create a tight reconnect loop. Auth
      // failures and deliberate disconnects still stop immediately.
      if (intentionalCloseRef.current || event.code === 4401) return
      const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 15000)
      reconnectAttemptsRef.current += 1
      reconnectTimerRef.current = setTimeout(() => openSocket(sessionId), delay)
    }
  }, [])

  const connect = useCallback(async (doctorId: DoctorId, language: Language) => {
    if (sessionIdRef.current && socketRef.current?.readyState === WebSocket.OPEN) return
    intentionalCloseRef.current = false
    languageRef.current = language
    setStatus('connecting')
    try {
      const createGuestAuth = async () => {
        const guest = await api.createGuest()
        const temporaryUser = {
          id: '', email: '', username: 'Guest', full_name: 'Guest', is_guest: true,
        }
        useStore.getState().setAuth(guest.access_token, temporaryUser)
        const user = await api.getProfile()
        useStore.getState().setAuth(guest.access_token, user)
      }
      const token = api.getToken()
      const isPlaceholder = !token || /direct-token|patient-direct/.test(token)
      if (isPlaceholder) {
        await createGuestAuth()
      } else {
        try {
          const user = await api.getProfile()
          useStore.getState().setAuth(token, user)
        } catch {
          await createGuestAuth()
        }
      }

      const avatar = await api.getDoctorAvatar(doctorId)
      const session = await api.createSession(avatar.id)
      sessionIdRef.current = session.id
      await new Promise<void>((resolve, reject) => {
        let pollTimer: ReturnType<typeof setInterval> | null = null
        const timeout = setTimeout(() => {
          if (pollTimer) clearInterval(pollTimer)
          reject(new Error('Consultation WebSocket connection timed out.'))
        }, 15000)
        const ready = () => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) return
          clearTimeout(timeout)
          if (pollTimer) clearInterval(pollTimer)
          resolve()
        }
        const failed = () => {
          if (socketRef.current?.readyState === WebSocket.CLOSED) {
            clearTimeout(timeout)
            if (pollTimer) clearInterval(pollTimer)
            reject(new Error('Could not connect to the consultation backend.'))
          }
        }
        openSocket(session.id)
        pollTimer = setInterval(() => {
          ready()
          failed()
        }, 50)
      })
    } catch (error) {
      setStatus('disconnected')
      throw error
    }
  }, [openSocket])

  const setLanguage = useCallback((language: Language) => {
    languageRef.current = language
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'set_language', language }))
    }
  }, [])

  const sendText = useCallback((text: string) => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify({ type: 'text', text }))
    return true
  }, [])

  const interrupt = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'interrupt' }))
    }
  }, [])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    socketRef.current?.close(1000, 'Consultation ended')
    socketRef.current = null
    sessionIdRef.current = null
    setStatus('disconnected')
  }, [])

  useEffect(() => disconnect, [disconnect])

  const getSessionId = useCallback(() => sessionIdRef.current, [])

  return { status, getSessionId, connect, setLanguage, sendText, interrupt, disconnect }
}
