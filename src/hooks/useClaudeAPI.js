import { useState, useCallback } from 'react'

const API_URL = 'https://api.anthropic.com/v1/messages'

function apiHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  }
}

async function callClaude(apiKey, body) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: apiHeaders(apiKey),
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(`Error ${response.status}: ${errData?.error?.message || response.statusText}`)
  }
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

export function useClaudeAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState(null)

  const processNotes = useCallback(async (teacherBuffer, subject, apiKey) => {
    setIsLoading(true)
    setError(null)
    try {
      const content = await callClaude(apiKey, {
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `Eres un asistente especializado en tomar apuntes de clase de ${subject}.
Recibirás texto transcrito de voz a texto de lo que dice la profesora.
La transcripción puede tener errores menores (es voz a texto en tiempo real).

Tu tarea:
- Extrae y organiza los conceptos clave, definiciones, ejemplos y explicaciones importantes
- Si hay varios temas, usa headers (## Tema) para separar secciones
- Usa bullet points (- item) para listas y conceptos
- Si hay una definición, ponla en negrita: **término**: explicación
- Usa *cursiva* para términos técnicos o en otro idioma
- Sé conciso pero no pierdas información importante
- Corrige errores obvios de transcripción de voz a texto
- Responde ÚNICAMENTE con los apuntes en español, formato markdown
- Si el texto es demasiado corto, incoherente o no contiene contenido educativo, responde exactamente con: FRAGMENTO_INSUFICIENTE`,
        messages: [{ role: 'user', content: `Transcripción de la profesora:\n\n${teacherBuffer}` }],
      })
      return content.trim() === 'FRAGMENTO_INSUFICIENTE' ? null : content
    } catch (err) {
      setError(err.message)
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateSummary = useCallback(async (notes, subject, apiKey) => {
    const realNotes = notes.filter(n => n.type !== 'summary')
    if (!realNotes.length) return null
    setIsSummarizing(true)
    setError(null)

    const combined = realNotes
      .map((n, i) => `### Fragmento ${i + 1} (${n.time})\n${n.content}`)
      .join('\n\n---\n\n')

    try {
      const content = await callClaude(apiKey, {
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `Eres un asistente de estudio experto. Recibirás todos los apuntes de una clase de ${subject}.
Crea un RESUMEN EJECUTIVO completo de toda la clase con estas secciones en orden:

## Conceptos Principales
Los temas y conceptos más importantes, en orden de relevancia.

## Definiciones Clave
Usa el formato **término**: definición para cada uno.

## Puntos para el Examen
Los 5-8 puntos que con mayor probabilidad entren en un examen o evaluación.

## Preguntas de Repaso
3-5 preguntas que el estudiante debería poder responder después de esta clase.

Responde en español, formato markdown. Sintetiza toda la clase — no repitas fragmento por fragmento.`,
        messages: [{ role: 'user', content: `Apuntes completos de ${subject}:\n\n${combined}` }],
      })
      return content || null
    } catch (err) {
      setError(err.message)
      return undefined
    } finally {
      setIsSummarizing(false)
    }
  }, [])

  return {
    processNotes,
    generateSummary,
    isLoading,
    isSummarizing,
    error,
    clearError: () => setError(null),
  }
}
