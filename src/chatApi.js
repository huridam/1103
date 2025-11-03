const OPENAI_API_KEY = import.meta.env.VITE_GPT_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * OpenAI Chat Completions API 호출
 * @param {Object} params
 * @param {string} params.topic - 토론 주제
 * @param {('찬성'|'반대')} params.stance - 입장
 * @param {boolean} params.concise - 간결 모드 여부
 * @param {Array<{role:'user'|'assistant', content:string}>} params.history - 이전 메시지들
 * @param {string} params.userMessage - 이번 사용자 입력
 * @returns {Promise<string>} - 모델 응답 텍스트
 */
export async function sendChat({ topic, stance, concise, history, userMessage }) {
  if (!OPENAI_API_KEY) {
    const err = new Error('API 키가 설정되지 않았습니다. .env 또는 Netlify 환경변수를 확인하세요.')
    err.code = 'NO_API_KEY'
    throw err
  }

  const system = [
    '역할: 당신은 토론자(반박자)입니다.',
    '규칙: 사용자가 입력한 주장에 대해 논리적으로 반박하고, 검증 가능한 근거를 제시하며, 필요하다면 현실적인 조언을 제공합니다.',
    '분량: 사용자가 입력한 분량과 비슷한 길이로 답하세요. 단, 간결 모드가 켜지면 전체를 3문장 이내로 요약합니다.',
    '근거 확인: 사용자의 주장이 근거/데이터가 부족하거나 타당하지 않으면, 어떤 근거를 바탕으로 한 주장인지 1문장으로 정중히 되물으세요(필요 시 마지막 줄에 질문을 추가).',
    '응답 형식: "반박 - 근거 - 조언(선택)" 순서로 작성하되, 근거가 부족한 경우 마지막에 "근거 질문" 1문장을 덧붙입니다.',
    '어조: 단정적 표현을 피하고, 가능한 한 사실/데이터 중심으로 건설적으로 표현합니다.',
    topic ? `토론 주제: ${topic}` : '',
  ].filter(Boolean).join('\n')

  const messages = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: userMessage },
  ]

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
      }),
    })

    if (res.status === 429) {
      const err = new Error('요청이 너무 많습니다(Rate limit). 잠시 후 다시 시도하세요.')
      err.code = 'RATE_LIMIT'
      throw err
    }

    if (!res.ok) {
      const text = await res.text()
      const err = new Error(`OpenAI API 오류: ${res.status} ${text}`)
      err.code = 'OPENAI_ERROR'
      throw err
    }

    const data = await res.json()
    return data?.choices?.[0]?.message?.content ?? ''
  } catch (e) {
    if (e.name === 'TypeError') {
      const err = new Error('네트워크 오류가 발생했습니다. 연결 상태를 확인하세요.')
      err.code = 'NETWORK'
      throw err
    }
    throw e
  }
}


