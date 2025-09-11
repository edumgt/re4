import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
const SECRET_KEY = "my-secret"; // 실제 서비스에서는 .env 로 관리하세요


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json());

// ------------------- Swagger 설정 -------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth API",
      version: "1.0.0",
      description: "JWT 기반 인증 API 명세서",
    },
    servers: [
      { url: "http://localhost:3000" } // Swagger 테스트용 서버 주소
    ],
  },
  apis: ["./server.js"], // API 주석을 읽을 파일
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// ---------------------------------------------------

// Mock 사용자 데이터
const users = [
  { id: 1, username: "admin", password: "1234" },
  { id: 2, username: "superadmin", password: "12345678" }
];

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: 사용자 로그인
 *     description: username, password로 로그인하고 JWT 토큰을 반환합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: 로그인 실패 (잘못된 자격 증명)
 */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });

  res.json({ token });
});

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: 사용자 프로필 조회
 *     description: Authorization 헤더에 JWT 토큰을 담아 요청해야 합니다.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 프로필 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: 인증 토큰 없음
 *       403:
 *         description: 잘못된 토큰
 */
app.get("/api/profile", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    res.json({ message: "Welcome!", user });
  });
});

// ------------------- Swagger 보안 스키마 추가 -------------------
swaggerSpec.components = {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
};
// ---------------------------------------------------

app.listen(3000, () => 
  console.log("✅ Express API running on http://localhost:3000 (Swagger: http://localhost:3000/api-docs)"));
