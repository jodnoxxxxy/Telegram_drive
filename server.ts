import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file streaming (up to 50MB per chunk as allowed by Telegram Bot API)
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Telegram-Drive-Proxy', timestamp: Date.now() });
});

// Test Telegram Bot Connection
app.post('/api/telegram/test', async (req, res) => {
  try {
    const { botToken, chatId } = req.body;
    if (!botToken) {
      return res.status(400).json({ success: false, error: 'Telegram Bot Token is required' });
    }

    const cleanToken = String(botToken).trim();
    const meRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
    const meData = await meRes.json();

    if (!meData.ok) {
      return res.status(400).json({
        success: false,
        error: meData.description || 'Invalid Telegram Bot Token',
      });
    }

    let chatInfo: any = null;
    if (chatId) {
      const cleanChatId = String(chatId).trim();
      const chatRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getChat?chat_id=${encodeURIComponent(cleanChatId)}`);
      const chatData = await chatRes.json();
      if (chatData.ok) {
        chatInfo = chatData.result;
      } else {
        return res.status(200).json({
          success: true,
          bot: meData.result,
          chatWarning: `Bot token verified, but Chat ID "${chatId}" failed: ${chatData.description}. Make sure you've sent /start to your bot or added it as admin if it's a channel.`,
        });
      }
    }

    return res.json({
      success: true,
      bot: meData.result,
      chat: chatInfo,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Network error communicating with Telegram' });
  }
});

// Upload File / Chunk to Telegram
app.post('/api/telegram/upload', upload.single('file'), async (req, res) => {
  try {
    const { botToken, chatId, caption, isEncrypted, originalName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file received' });
    }

    if (!botToken || !chatId) {
      return res.status(400).json({ success: false, error: 'botToken and chatId are required' });
    }

    const cleanToken = String(botToken).trim();
    const cleanChatId = String(chatId).trim();

    // Prepare FormData for Telegram Bot API
    const formData = new FormData();
    formData.append('chat_id', cleanChatId);
    
    const fileName = originalName || file.originalname || 'file.bin';
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'application/octet-stream' });
    formData.append('document', blob, fileName);

    const safeCaption = caption || (isEncrypted === 'true' ? '🔒 [Safe Encrypted Telegram Drive]' : '📁 [Telegram Drive File]');
    formData.append('caption', safeCaption);

    const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(400).json({
        success: false,
        error: tgData.description || 'Failed to upload document to Telegram',
      });
    }

    const doc = tgData.result.document;
    return res.json({
      success: true,
      messageId: tgData.result.message_id,
      document: {
        fileId: doc.file_id,
        fileUniqueId: doc.file_unique_id,
        fileName: doc.file_name || fileName,
        fileSize: doc.file_size || file.size,
        mimeType: doc.mime_type || file.mimetype,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to upload file to Telegram' });
  }
});

// Get Download URL / Stream Telegram File
app.get('/api/telegram/download', async (req, res) => {
  try {
    const botToken = String(req.query.botToken || '').trim();
    const fileId = String(req.query.fileId || '').trim();
    const fileName = String(req.query.fileName || 'file.bin').trim();

    if (!botToken || !fileId) {
      return res.status(400).send('botToken and fileId are required');
    }

    const fileMetaRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileMetaData = await fileMetaRes.json();

    if (!fileMetaData.ok || !fileMetaData.result.file_path) {
      return res.status(404).send(fileMetaData.description || 'File not found on Telegram servers');
    }

    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileMetaData.result.file_path}`;
    const fileStreamRes = await fetch(downloadUrl);

    if (!fileStreamRes.ok) {
      return res.status(fileStreamRes.status).send('Failed to fetch file stream from Telegram');
    }

    const contentType = fileStreamRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = fileStreamRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    // Stream arrayBuffer to response
    const arrayBuffer = await fileStreamRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    return res.status(500).send(error.message || 'Stream error');
  }
});

// Delete Telegram Message / File
app.post('/api/telegram/delete', async (req, res) => {
  try {
    const { botToken, chatId, messageId } = req.body;
    if (!botToken || !chatId || !messageId) {
      return res.status(400).json({ success: false, error: 'botToken, chatId, and messageId are required' });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${String(botToken).trim()}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: String(chatId).trim(),
        message_id: Number(messageId),
      }),
    });

    const tgData = await tgRes.json();
    return res.json({ success: tgData.ok, description: tgData.description });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Delete error' });
  }
});

// Sync Drive Catalog / Metadata Message to Telegram
app.post('/api/telegram/sync-catalog', async (req, res) => {
  try {
    const { botToken, chatId, catalogData } = req.body;
    if (!botToken || !chatId || !catalogData) {
      return res.status(400).json({ success: false, error: 'Missing parameters' });
    }

    const cleanToken = String(botToken).trim();
    const cleanChatId = String(chatId).trim();
    const jsonString = JSON.stringify(catalogData, null, 2);

    const formData = new FormData();
    formData.append('chat_id', cleanChatId);
    const blob = new Blob([jsonString], { type: 'application/json' });
    formData.append('document', blob, `telegram-drive-catalog-${Date.now()}.json`);
    formData.append('caption', `📦 [Telegram-Drive Catalog Backup] ${new Date().toISOString()}`);

    const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const tgData = await tgRes.json();
    return res.json({ success: tgData.ok, result: tgData.result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Dev and Prod Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Telegram-Drive server running at http://localhost:${port}`);
  });
}

startServer();
