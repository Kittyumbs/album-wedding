const express = require('express');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Lấy token từ biến môi trường của Render
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'Kittyumbs/album-wedding';
const GITHUB_FILE_PATH = 'DS.json';
const GITHUB_BRANCH = 'main';

// Hàm lấy dữ liệu từ file DS.json trên GitHub
async function getDSFromGitHub() {
  try {
    const res = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    const content = Buffer.from(res.data.content, 'base64').toString('utf8');
    return { arr: JSON.parse(content), sha: res.data.sha };
  } catch (e) {
    // Nếu file chưa tồn tại thì trả về mảng rỗng
    return { arr: [], sha: undefined };
  }
}

// Hàm cập nhật file DS.json trên GitHub
async function pushDSToGitHub(arr, sha) {
  await axios.put(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      message: 'Update DS.json from wedding website',
      content: Buffer.from(JSON.stringify(arr, null, 2)).toString('base64'),
      branch: GITHUB_BRANCH,
      sha: sha,
    },
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );
}

// API endpoint để nhận dữ liệu từ form
app.post('/submit', async (req, res) => {
  const data = req.body;
  try {
    // Lấy dữ liệu hiện tại từ DS.json
    const { arr, sha } = await getDSFromGitHub();
    // Thêm dữ liệu mới
    arr.push(data);
    // Cập nhật lại DS.json
    await pushDSToGitHub(arr, sha);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API endpoint kiểm tra server
app.get('/', (req, res) => {
  res.send('Wedding API is running!');
});

// API endpoint lấy dữ liệu
app.get('/get-data', async (req, res) => {
  try {
    const { arr } = await getDSFromGitHub();
    res.json(arr);
  } catch (err) {
    res.json([]);
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`)); 