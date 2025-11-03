## Vite + React (JS) + OpenAI GPT-4 브라우저 토론 챗봇

### 로컬 개발

1) 의존성 설치

```bash
npm install
npm install react react-dom @vitejs/plugin-react --save
```

2) 환경 변수 설정 (.env)

프로젝트 루트에 `.env` 파일을 만들고 다음 키를 넣어주세요.

```bash
VITE_GPT_API_KEY=sk-xxxx
```

3) 개발 서버 실행

```bash
npm run dev
```

### 사용 방법

- 입력창에 메시지를 입력하고 전송하면 OpenAI GPT-4 모델 응답이 대화 로그에 표시됩니다.
- 브라우저에서 직접 OpenAI API를 호출하므로, 키 노출 위험이 있습니다. 운영 배포에서는 필히 사용량 제한, 도메인 제한, 프록시/서버 전환 등을 고려하세요.

### Netlify 배포

1) 리포지토리를 Netlify에 연결한 뒤, Site settings → Build & deploy → Environment에서 다음 변수를 추가합니다.

```
Key: VITE_GPT_API_KEY
Value: sk-xxxx
```

2) 빌드 설정

- Build command: `npm run build`
- Publish directory: `dist`

3) 배포 후 확인

- 배포가 완료되면 사이트 접속 후 챗봇 입력창에 메시지를 전송해 응답을 확인합니다.

### 주의 사항 (보안/운영)

- 클라이언트(브라우저)에서 직접 OpenAI API를 호출하면 키가 노출될 위험이 큽니다. 테스트/프로토타입 외 실제 운영 용도로는 권장하지 않습니다.
- 실제 운영 환경에서는 서버 프록시를 통해 키를 비공개로 관리하고, 인증·요금 한도·도메인 제한 등을 적용하시길 권장합니다.
- CORS 혹은 벤더 정책으로 인해 브라우저 호출이 차단될 수 있습니다. 이 경우에도 서버 프록시로 전환이 필요합니다.

### 파일 구조

- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/chatApi.js`
- `src/styles.css`
- `.env.example` (예시 파일, 실제 키 커밋 금지)
- `netlify.toml`
- `README.md`

### 환경 변수 예시 파일

`.env.example` 내용:

```
VITE_GPT_API_KEY=
```


