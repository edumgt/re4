2. Node(Express 등) + Vite 함께 사용

보통 API 서버는 Node(Express), 프론트엔드는 Vite로 따로 구성하고 프록시(proxy) 설정으로 연결합니다.

Express 서버 예시 (server.js)
import express from "express";
import path from "path";

const app = express();
const __dirname = path.resolve();

app.use(express.json());

// API 엔드포인트
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!" });
});

// 정적 파일 서빙 (빌드된 Vite 결과)
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});

Vite 설정 (vite.config.js)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000", // Express API로 프록시
    },
  },
});


👉 개발할 때는 npm run dev로 Vite 실행 → /api 호출은 자동으로 Node 서버로 프록시됩니다.
👉 배포할 때는 npm run build → dist 폴더를 Node 서버에서 서빙하면 됩니다.

3. 추천 폴더 구조
my-app/
 ├─ server/         # Node/Express 서버 코드
 │   └─ server.js
 ├─ src/            # React(or Vue) 소스
 │   └─ App.jsx
 ├─ index.html
 ├─ vite.config.js
 ├─ package.json


👉 질문:
원하시는 게 프론트엔드만 vite 실행인가요, 아니면 Node(Express)와 Vite를 같이 묶어서 풀스택 환경을 구성하려는 건가요?

나의 말:
Node(Express)와 Vite를 같이 묶어서 풀스택 환경으로 로그인
ChatGPT의 말:

좋습니다 👍
Node(Express) + Vite 풀스택 환경에서 로그인 기능을 만들려면 크게 3단계로 나눌 수 있어요:

1. 백엔드 (Express) – 로그인 API

Express 서버에서 로그인 요청을 처리합니다. 보통 세션/쿠키 방식 또는 JWT 토큰 방식을 씁니다.
아래는 JWT 기반 로그인 예시입니다.

📂 server/server.js

import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const SECRET_KEY = "my-secret"; // 실제 서비스에서는 .env 로 관리하세요

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// Mock 사용자 데이터
const users = [{ id: 1, username: "admin", password: "1234" }];

// 로그인 API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // JWT 토큰 발급
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.json({ token });
});

// 보호된 API 예시
app.get("/api/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: "Welcome!", user });
  });
});

app.listen(3000, () => console.log("✅ Express API running on http://localhost:3000"));

2. 프론트엔드 (Vite + React) – 로그인 UI

Vite 쪽에서 로그인 폼을 만들고 API를 호출합니다.

📂 src/App.jsx

import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState(null);

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      alert("로그인 성공!");
    } else {
      alert("로그인 실패");
    }
  };

  const handleGetProfile = async () => {
    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProfile(data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">로그인</h1>

      <input
        type="text"
        placeholder="아이디"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 mr-2"
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 mr-2"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2">
        로그인
      </button>

      {token && (
        <div className="mt-4">
          <button onClick={handleGetProfile} className="bg-green-500 text-white px-4 py-2">
            프로필 보기
          </button>
        </div>
      )}

      {profile && (
        <pre className="mt-4 p-2 bg-gray-100">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default App;

3. Vite 설정 (프록시)

프론트엔드에서 /api 요청을 Express 서버로 넘기도록 vite.config.js를 수정합니다.

📂 vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000", // Express 서버로 프록시
    },
  },
});

실행 방법
# 백엔드
cd server
node server.js

# 프론트엔드
cd ..
npm run dev


👉 이렇게 하면:

http://localhost:5173 → 로그인 UI (Vite)

/api/login → Express 로그인 API

JWT 저장 후 /api/profile 호출 → 사용자 정보 확인

형님, 여기서 로그인 방식을 **JWT (토큰 저장)**으로 할까요, 아니면 세션/쿠키 (브라우저 자동 저장) 방식으로 가시려나요?
(JWT는 프론트에서 토큰 관리, 세션/쿠키는 서버에서 세션 관리 → 둘 다 장단점 있어요)

나의 말:
스타일은 tailwind 사용
ChatGPT의 말:

좋습니다 🙆‍♂️
이미 vite + react 환경이면 TailwindCSS 바로 붙일 수 있습니다.
풀스택 로그인 화면을 Tailwind 스타일로 개선해 드릴게요.

1. Tailwind 설치

Vite + React 프로젝트 기준입니다.

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


📂 tailwind.config.js

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};


📂 src/index.css

@tailwind base;
@tailwind components;
@tailwind utilities;


👉 main.jsx에서 import './index.css'; 확인하세요.

2. 로그인 화면 (Tailwind 적용)

📂 src/App.jsx

import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState(null);

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      alert("로그인 성공!");
    } else {
      alert("로그인 실패");
    }
  };

  const handleGetProfile = async () => {
    const res = await fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProfile(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          로그인
        </h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            type="text"
            placeholder="아이디 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          로그인
        </button>

        {token && (
          <div className="mt-6 text-center">
            <button
              onClick={handleGetProfile}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              프로필 보기
            </button>
          </div>
        )}

        {profile && (
          <pre className="mt-4 p-3 bg-gray-50 border rounded-lg text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;

3. 실행 모습

배경: bg-gray-100

로그인 박스: 흰색(bg-white) + 그림자(shadow-xl) + 라운드(rounded-xl)

인풋: 파란색 포커스 링(focus:ring-blue-500)

버튼: 파란색(bg-blue-600) → hover 시 진해짐



# ####################################################

1. Express 설치

server 폴더 기준에서 실행하세요:

cd C:\kdy-dev\re4\server
npm init -y
npm install express cors body-parser jsonwebtoken

2. ESM vs CommonJS 확인

Node v22에서 import express from "express"; 를 쓰려면 package.json에 아래가 있어야 합니다:

📂 package.json

{
  "name": "server",
  "version": "1.0.0",
  "type": "module",   // ⬅️ 이거 꼭 추가
  "main": "server.js",
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "jsonwebtoken": "^9.0.2"
  }
}


type: "module" → ES Module(import ... from) 사용 가능

만약 CommonJS(require) 방식으로 쓰고 싶으면 이 줄을 지우고, server.js 코드를 아래처럼 바꿔야 합니다.

// CommonJS 방식
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

3. 서버 실행
node server.js


정상 실행되면:

✅ Express API running on http://localhost:3000


# ###########################################################

Failed to load resource: the server responded with a status of 401 (Unauthorized)
ChatGPT의 말:

401 Unauthorized 👍 이제 Tailwind 문제는 넘어가고, 로그인 API 호출에서 인증 실패가 난 상태네요.

✅ 401 Unauthorized 발생 원인

백엔드 /api/login 응답이 401

username / password 값이 서버의 mock 데이터랑 안 맞음

예: 서버에 admin / 1234만 있는데, 프론트에서 다른 값 입력한 경우

토큰 필요 API 호출에서 Authorization 헤더 누락

/api/profile 같은 보호된 라우트는 Bearer 토큰을 요구하는데, fetch 호출 시 헤더에 빠진 경우

CORS / Proxy 문제

Vite → Express 프록시 잘 안 먹히면, 브라우저에서 직접 Express로 요청 가면서 CORS 차단 후 401이 뜰 수 있음

🛠️ 확인 포인트
1. 백엔드 (Express) server.js

예시 서버 코드 (mock 로그인):

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const SECRET_KEY = "my-secret";

app.use(cors());
app.use(bodyParser.json());

const users = [{ id: 1, username: "admin", password: "1234" }];

// 로그인
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// 보호된 API
app.get("/api/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: "Welcome!", user });
  });
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));


👉 여기서 로그인 성공하려면 반드시:

아이디: admin

비밀번호: 1234

을 입력해야 합니다.

2. 프론트엔드 (React fetch)

📂 App.jsx 에서 로그인 후 토큰은 이렇게 저장:

const handleLogin = async () => {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (res.ok) {
    const data = await res.json();
    setToken(data.token);   // ⬅️ 토큰 저장
  } else {
    alert("로그인 실패");
  }
};


📂 /api/profile 호출 시:

const handleGetProfile = async () => {
  const res = await fetch("/api/profile", {
    headers: { Authorization: `Bearer ${token}` }, // ⬅️ 토큰 꼭 필요
  });
  if (!res.ok) {
    alert("프로필 가져오기 실패");
    return;
  }
  const data = await res.json();
  setProfile(data);
};

3. Vite 프록시 확인 (vite.config.js)
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});


👉 없으면 브라우저에서 /api/... 가 아니라 http://localhost:5173/api/... 로 직접 치고 들어가서 401 납니다.

🚀 해결 순서

서버 콘솔에서 ✅ Express API running on http://localhost:3000 확인

브라우저 DevTools → Network 탭 → POST /api/login 요청 확인

Request Payload → {username, password} 값 확인

Response → {"token":"...JWT..."} 오는지 확인

로그인 후 Authorization: Bearer ... 붙어서 /api/profile 호출되는지 확인

형님, 혹시 지금 입력하신 아이디/비밀번호가 서버 쪽 mock 값이랑 맞나요? (제가 예시로 드린 admin / 1234 쓰셨는지)
아니면 실제 DB나 다른 값 쓰시나요?

나의 말:
POST http://localhost:5173/api/login 401 (Unauthorized)
ChatGPT의 말:

좋습니다 👍
POST http://localhost:5173/api/login 401 이라는 건 지금 브라우저가 Vite(5173번 포트) 프론트 서버로 직접 요청을 보내고 있다는 뜻이에요.

원래 우리가 원하는 건 👇

http://localhost:5173 (Vite) → proxy → http://localhost:3000 (Express API)


인데, 지금은 프록시가 안 걸려서 Vite 개발서버가 /api/login을 처리하려다 401을 리턴한 상황입니다.

✅ 해결 방법
1. vite.config.js 프록시 추가

📂 vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Express 서버
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

2. Express 서버 확인

📂 server.js

app.post("/api/login", ... )
app.get("/api/profile", ... )


서버는 반드시 http://localhost:3000 에서 실행 중이어야 합니다.

3. 프론트엔드 fetch 수정할 필요 없음

지금처럼 그냥 /api/login 쓰면 됩니다:

await fetch("/api/login", {...})


Vite가 알아서 http://localhost:3000/api/login 으로 프록시해 줍니다.

4. 실행 순서
# 터미널 1
cd server
node server.js   # Express API 실행 (포트 3000)

# 터미널 2
cd ..
npm run dev      # Vite 실행 (포트 5173)


브라우저 → http://localhost:5173 접속 후 로그인 시도

🚨 여전히 401 뜨면?

아이디/비번을 서버 mock 데이터(admin / 1234)와 맞춰 보세요.

const users = [{ id: 1, username: "admin", password: "1234" }];


Network 탭에서 Request Payload 확인해서 {"username":"입력값","password":"입력값"}이 제대로 보내지는지 체크하세요.

👉 형님, vite.config.js 에 proxy 설정은 이미 넣으셨나요?
아니면 아직 /api 요청이 바로 Vite로 가는 구조일까요?

나의 말:
Request URL
http://localhost:5173/api/login
Request Method
POST
Status Code
ChatGPT의 말:

좋습니다 👍
Request URL 이 여전히 http://localhost:5173/api/login 으로 찍히고 있다는 건, 지금 Vite → Express 로 프록시가 전혀 안 먹고 있다는 뜻이에요.

✅ 원인

vite.config.js 에 server.proxy 설정이 없거나 잘못돼 있음

vite.config.js 파일을 수정했는데 서버를 재시작 안 해서 적용 안 됨

vite.config.js 파일 확장자가 .js인데 "type": "module" 때문에 import/export 문제 발생 → 실제 설정이 무시됨

✅ 제대로 된 vite.config.js (Tailwind 3 + React + ESM 환경)

📂 vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ESM 문법으로 export
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Express 서버
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

✅ 반드시 확인할 것

vite.config.js 저장 후 → Vite dev 서버를 완전히 종료하고 다시 실행

npm run dev


Express 서버(server.js)도 실행 중이어야 함

node server.js


콘솔에 ✅ Server running on http://localhost:3000 확인

브라우저 DevTools → Network 탭에서 다시 로그인 시도 →
Request URL 이 http://localhost:3000/api/login 으로 바뀌면 정상

🚀 정리

지금은 5173 에 직접 POST → 그래서 401

proxy 설정이 제대로 잡히면 자동으로 3000 으로 보내집니다

👉 형님, vite.config.js 파일을 한번 보여주실 수 있을까요? (제가 정확히 proxy 부분이 적용돼 있는지 확인해드리겠습니다)

나의 말:
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ESM 문법으로 export
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000", // Express 서버
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
ChatGPT의 말:

네 👍 vite.config.js 는 제대로 작성돼 있습니다.
그런데 여전히 요청이 http://localhost:5173/api/login 으로 찍힌다면, 프록시 설정이 적용 안 되고 있다는 얘기예요.

✅ 체크리스트
1. Vite dev 서버 재시작했는가?

vite.config.js 수정 후에는 반드시 완전히 종료하고 다시 실행해야 합니다.

Ctrl + C  # 기존 dev 서버 종료
npm run dev

2. Express 서버가 실행 중인가?
cd server
node server.js


→ 콘솔에 ✅ Server running on http://localhost:3000 출력돼야 합니다.

3. 브라우저 요청 확인

DevTools → Network 탭에서 다시 POST /api/login 확인

정상 동작 시 Request URL 은 http://localhost:3000/api/login 이어야 합니다.
(5173이 아니라 3000으로 바뀌어야 해요)

🚨 그래도 5173으로만 간다면?

그건 프록시가 안 잡히고 있다는 뜻 → 주로 fetch URL을 절대경로로 적었을 때 이런 문제가 발생합니다.

(잘못된 예) — 프록시 무시됨
await fetch("http://localhost:5173/api/login", { ... })

(올바른 예) — 프록시 적용됨
await fetch("/api/login", { ... })


👉 App.jsx 코드에서 fetch URL이 /api/login 상대경로인지 확인해 보세요.
절대 URL(http://localhost:5173/...)이면 무조건 5173으로 찍힙니다.

✅ 정리

vite.config.js proxy 는 잘 작성돼 있음

반드시 npm run dev 재시작 필요

fetch("/api/login") 처럼 상대 경로로 호출해야 프록시가 적용됨

형님, 혹시 App.jsx 의 fetch 부분이 지금 상대경로(/api/login) 인가요, 아니면 절대경로(http://localhost:5173/api/login) 로 돼 있나요?

나의 말:
import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState(null);

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      alert("로그인 성공!");
    } else {
      alert("로그인 실패");
    }
  };

  const handleGetProfile = async () => {
    const res = await fetch("/api/profile", {
      headers: { Authorization: Bearer ${token} },
    });
    const data = await res.json();
    setProfile(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          로그인
        </h1>

        {/* 아이디 입력 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            아이디
          </label>
          <input
            type="text"
            placeholder="아이디 입력"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 비밀번호 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            비밀번호
          </label>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          로그인
        </button>

        {/* 프로필 버튼 */}
        {token && (
          <div className="mt-6 text-center">
            <button
              onClick={handleGetProfile}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              프로필 보기
            </button>
          </div>
        )}

        {/* 프로필 결과 */}
        {profile && (
          <pre className="mt-4 p-3 bg-gray-50 border rounded-lg text-sm">
            {JSON.stringify(profile, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
ChatGPT의 말:

코드 잘 보았습니다 👍
fetch("/api/login") / fetch("/api/profile") → 상대 경로를 쓰고 있어서 프록시 설정 자체는 문제 없습니다.

그런데 여전히 Request URL: http://localhost:5173/api/login 으로 간다면 두 가지 원인 중 하나예요:

✅ 원인 1: Vite dev 서버가 프록시 적용 안 됨

vite.config.js 에 proxy 잘 넣었더라도 dev 서버 재시작 안 하면 반영되지 않습니다.

반드시:

Ctrl + C  # 기존 dev 서버 종료
npm run dev


재시작 후 콘솔 로그에 localhost:5173 dev 서버가 뜨고, /api 요청이 자동으로 3000번 포트로 프록시돼야 정상.

✅ 원인 2: Express 서버가 안 뜸 / 엔드포인트 불일치

Express 서버 (server.js) 에 반드시 이 라우트가 있어야 합니다:

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "1234") {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});


👉 만약 여기서 아이디/비밀번호가 다르면 무조건 401이 떨어집니다.
즉, 지금 입력한 값이 서버 mock 데이터랑 달라서 401일 수도 있어요. (예: admin / 1234 로 테스트 필요)

✅ 확인 방법

vite.config.js 저장 → npm run dev 재시작

node server.js 실행 → 콘솔에 Server running on http://localhost:3000

브라우저에서 로그인 시도

DevTools Network → POST /api/login → Request URL 확인

정상일 때는 http://localhost:3000/api/login

여전히 5173이면 프록시 문제

3000인데도 401이면 아이디/비번 불일치 문제