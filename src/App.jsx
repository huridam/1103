import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sendChat } from './chatApi.js'

const PLACEHOLDERS = [
  '청소년 스마트폰 사용 시간 제한',
  '학교 급식 완전 무상화',
  '재활용 보증금 확대',
]

export default function App() {
  const [topic, setTopic] = useState('')
  const [stance, setStance] = useState('찬성')
  const [concise, setConcise] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '토론을 시작해봅시다. 입력 분량에 맞춰 "반박 - 근거 - 조언(선택)" 순서로 응답하며, 근거가 부족하면 끝에 1문장으로 근거를 물어봅니다. 주제를 입력하고 메시지를 전송해 보세요.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const logRef = useRef(null)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  const scrollToBottom = useCallback(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  const onSend = useCallback(async () => {
    if (!canSend) return
    const userText = input.trim()
    const nextHistory = messages.map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, { role: 'user', content: userText }])
    setInput('')
    setLoading(true)
    try {
      const reply = await sendChat({
        topic,
        stance,
        concise,
        history: nextHistory,
        userMessage: userText,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || '응답이 비어있습니다.' }])
    } catch (e) {
      const msg = e?.message || '오류가 발생했습니다.'
      setToast(msg)
      setMessages((prev) => [...prev, { role: 'assistant', content: `오류: ${msg}` }])
    } finally {
      setLoading(false)
    }
  }, [canSend, input, messages, topic, stance, concise])

  const placeholderTopic = useMemo(() => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)], [])

  const toCsv = useCallback((rows) => {
    const esc = (v) => {
      const s = String(v ?? '')
      const quoted = '"' + s.replaceAll('"', '""') + '"'
      return quoted
    }
    return rows.map(r => r.map(esc).join(',')).join('\r\n')
  }, [])

  const downloadCsv = useCallback(() => {
    const now = new Date()
    const fileName = `chat-${now.toISOString().replace(/[:]/g, '-')}.csv`
    const header = ['timestamp', 'topic', 'stance', 'concise', 'role', 'content']
    const rows = [header]
    messages.forEach((m) => {
      rows.push([
        new Date().toLocaleString(),
        topic || '',
        stance,
        concise ? 'ON' : 'OFF',
        m.role,
        m.content,
      ])
    })
    const csv = toCsv(rows)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [messages, topic, stance, concise, toCsv])

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}

      <header className="header">
        <h2 style={{ margin: 0 }}>Netlify 배포용 토론 챗봇</h2>
        <div className="hint">브라우저에서 OpenAI API를 직접 호출합니다. 테스트 용도 외 위험합니다.</div>
      </header>

      <section className="chat-card">
        <div className="chat-log" ref={logRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
        </div>

        <div className="controls">
          <div>
            <div className="row">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`주제 입력 (예: ${placeholderTopic})`}
              />
              <select value={stance} onChange={(e) => setStance(e.target.value)}>
                <option value="찬성">찬성</option>
                <option value="반대">반대</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={concise} onChange={(e) => setConcise(e.target.checked)} />
                간결 모드(3문장)
              </label>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSend()
                }
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn secondary" type="button" onClick={downloadCsv}>
              CSV 다운로드
            </button>
            <button className="btn" onClick={onSend} disabled={!canSend}>
              {loading ? '전송 중…' : '전송'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}



