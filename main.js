const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;
// 1. 跨域配置（适配前端）
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-requested-with", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// 2. 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// 4. 上传接口（核心：记录文件状态，用于后续轮询查询）
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error_message: "请选择要上传的文件" });
    }
    // 初始化文件处理状态为 processing
    const filename = req.file.filename;
    //将传的对象序列化
    res.json({
      success: true,
      filename: filename,
      path: `/uploads/${filename}`,
    });
  } catch (error) {
    res.status(400).json({ error_message: error.message || "文件上传失败" });
  }
});

// 5. 轮询查询接口（供前端 checkFileStatus 调用）
app.post("/check-file-status", (req, res) => {
  res.json({
    errCode: 0,
    data: {
      status: "success",
      downloadUrl: `http://localhost:${port}/uploads/test.pdf`,
    },
  });
});

// 6. 提供上传文件访问 ？
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 7. 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error("请求错误:", err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error_message: `上传错误: ${err.message}`,
    });
  }
  res.status(500).json({
    error_message: err.message || "服务器内部错误",
  });
});

// 9. 启动服务
app.listen(port, () => {
  console.log(`后端服务已启动: http://localhost:${port}`);
  console.log(`文件上传接口: POST http://localhost:${port}/upload`);
  console.log(`状态查询接口: POST http://localhost:${port}/check-file-status`);
});
