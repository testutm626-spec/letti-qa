import path from "path";
import express from "express";
import apiRouter from "./routes/api";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

app.use("/api", apiRouter);

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("서버 오류:", err);
  res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`웹 대시보드가 시작되었습니다: http://localhost:${PORT}`);
});
