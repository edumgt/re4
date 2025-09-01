import express from "express";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const SECRET_KEY = "my-secret"; // 실제 서비스에서는 .env 로 관리하세요

// ✅ 오직 6000만 허용
app.use(cors({
  origin: "http://localhost:6000",
  credentials: true
}));

app.use(bodyParser.json());

// Mock 사용자 데이터
const users = [
  { id: 1, username: "admin", password: "1234" },
  { id: 2, username: "superadmin", password: "12345678" }
];

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

  console.log("✅ 발급된 JWT:", token);
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

app.listen(3000, () => console.log("✅ Express API running on http://localhost:3000"));
