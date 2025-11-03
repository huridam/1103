import React, { useCallback, useMemo, useRef, useState } from 'react'

const OPENAI_API_KEY = import.meta.env.VITE_GPT_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 무엇을 도와드릴까요?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const logEndRef = useRef(null)

  const canSend = useMemo(() => {
    return Boolean(OPENAI_API_KEY) && input.trim().length > 0 && !loading
  }, [input, loading])

  const scrollToBottom = useCallback(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const sendMessage = useCallback(async () => {
    if (!canSend) return
    const userMessage = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...messages,
            userMessage,
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      const assistantMessage = data?.choices?.[0]?.message?.content ?? '응답을 가져오지 못했습니다.'
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }])
      setTimeout(scrollToBottom, 0)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `오류가 발생했습니다: ${err.message}` },
      ])
    } finally {
      setLoading(false)
    }
  }, [canSend, input, messages, scrollToBottom])

  return (
    <div>
      {!OPENAI_API_KEY && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffe69c',
          color: '#664d03',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}>
          환경 변수 <code>VITE_GPT_API_KEY</code>가 설정되지 않았습니다. <br />
          개발에서는 <code>.env</code>에, Netlify 배포에서는 사이트 설정 &gt; 환경 변수에 등록하세요.
        </div>
      )}

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 12,
        minHeight: 260,
        maxHeight: 420,
        overflowY: 'auto',
        background: '#fafafa',
      }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{
            marginBottom: 10,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}>
            <strong>{m.role === 'user' ? '사용자' : 'GPT'}</strong>
            <div>{m.content}</div>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              sendMessage()
            }
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!canSend}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: canSend ? '#111827' : '#9ca3af',
            color: 'white',
            border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? '전송 중…' : '전송'}
        </button>
      </div>
    </div>
  )
}


