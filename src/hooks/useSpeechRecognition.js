import { useState, useRef, useEffect, useCallback } from 'react'

export function useSpeechRecognition(language = 'es-PA') {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  )

  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)
  const isTeacherActiveRef = useRef(false)
  const teacherBufferRef = useRef('')
  const onBufferUpdateRef = useRef(null)
  const lastSpeechTimeRef = useRef(null)

  const buildRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = language

    rec.onresult = (event) => {
      let interim = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(interim)
      if (isTeacherActiveRef.current && finalText) {
        teacherBufferRef.current += finalText + ' '
        lastSpeechTimeRef.current = Date.now()
        onBufferUpdateRef.current?.(teacherBufferRef.current)
      }
    }

    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start() } catch {}
      }
    }

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech error:', e.error)
      }
    }

    return rec
  }, [language])

  const start = useCallback(() => {
    if (!isSupported) return
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    const rec = buildRecognition()
    recognitionRef.current = rec
    isListeningRef.current = true
    setIsListening(true)
    try { rec.start() } catch {}
  }, [isSupported, buildRecognition])

  const stop = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    try { recognitionRef.current?.stop() } catch {}
  }, [])

  const reset = useCallback(() => {
    stop()
    setTimeout(() => start(), 300)
  }, [stop, start])

  const clearBuffer = useCallback(() => {
    teacherBufferRef.current = ''
    lastSpeechTimeRef.current = null
    onBufferUpdateRef.current?.('')
  }, [])

  const setTeacherActive = useCallback((active) => {
    isTeacherActiveRef.current = active
    if (!active) lastSpeechTimeRef.current = null
  }, [])

  const setOnBufferUpdate = useCallback((fn) => {
    onBufferUpdateRef.current = fn
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (isListeningRef.current) {
          try { recognitionRef.current?.stop() } catch {}
        }
      } else {
        if (isListeningRef.current) {
          setTimeout(() => {
            try { recognitionRef.current?.start() } catch {}
          }, 300)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    return () => {
      isListeningRef.current = false
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  return {
    isSupported,
    transcript,
    isListening,
    start,
    stop,
    reset,
    clearBuffer,
    setTeacherActive,
    setOnBufferUpdate,
    getBuffer: () => teacherBufferRef.current,
    getLastSpeechTime: () => lastSpeechTimeRef.current,
  }
}
