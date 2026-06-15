import { useState, useCallback } from 'react'

export function useClaudeAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const processNotes = useCallback(async (teacherBuffer, subject, apiKey) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: `Eres un asistente especializado en tomar apuntes de clase de ${subject}.
Recibirás texto transcrito de voz a texto de lo que dice la profesora.
La transcripción puede tener errores menores (es voz a texto en tiempo real).

Tu tarea:
- Extrae y organiza los conceptos clave, definiciones, ejemplos y explicaciones importantes
- Si hay varios temas, usa headers (## Tema) para separar secciones
- Usa bullet points (- item) para listas y conceptos
- Si hay una definición, ponla en negrita: **término**: explicación
- Sé conciso pero no pierdas información importante
- Corrige errores obvios de transcripción de voz a texto
- Responde ÚNICAMENTE con los apuntes en español, formato markdown
- Si el texto es demasiado corto, incoherente o no contiene contenido educativo, responde exactamente con: FRAGMENTO_INSUFICIENTE`,
          messages: [
            {
              role: 'user',
              content: `Transcripción de la profesora:\n\n${teacherBuffer}`,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(`Error ${response.status}: ${errData?.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text || ''

      if (content.trim() === 'FRAGMENTO_INSUFICIENTE') {
        return null
      }

      return content
    } catch (err) {
      setError(err.message)
      return undefined
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { processNotes, isLoading, error, clearError: () => setError(null) }
}
