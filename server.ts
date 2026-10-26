import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// Enable CORS for external PWA scanners (like PWABuilder) and credentialed requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Explicit routes for PWA manifest & Android Digital Asset Links with exact MIME types
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});

app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.join(__dirname, 'public', '.well-known', 'assetlinks.json'));
});

// Serve all public directory files (icons, screenshots, manifests) with CORS and cache headers
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (filePath.endsWith('.json') || filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      }
      if (filePath.endsWith('sw.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Service-Worker-Allowed', '/');
      }
    },
  })
);

// Support base64 image uploads up to 15MB
app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API endpoint: PWA Widget Data provider
app.get('/api/widget-tasks', (_req, res) => {
  res.json({
    title: 'MinimaList Tasks Widget',
    status: 'online',
    description: 'Upcoming tasks with 1-hour reminders, cancellation, and quick add.',
    actions: [
      { id: 'add', label: 'Add Task', url: '/widget?action=add' },
      { id: 'view', label: 'View Tasks', url: '/widget' },
    ],
  });
});

// API endpoint: Extract To-Do tasks from uploaded image
app.post('/api/extract-tasks', async (req, res) => {
  try {
    const { base64Data, mimeType } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: 'Analyze this image thoroughly (handwritten notes, whiteboard, typed document, checklist, sticky notes, or screenshot). Extract all concrete to-do tasks and action items. For each item, provide a clear action-oriented title, an appropriate tag (e.g., Work, Personal, Health, Focus, Errands, Study, Finance), a priority rating (none, low, medium, or high), and any sub-notes or time constraints found in the image.',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: 'The task title or description',
              },
              tag: {
                type: Type.STRING,
                description: 'Category tag such as Work, Personal, Health, Focus, Errands',
              },
              priority: {
                type: Type.STRING,
                description: 'Priority level: none, low, medium, or high',
              },
              notes: {
                type: Type.STRING,
                description: 'Context, deadline notes, or details',
              },
            },
            required: ['text'],
          },
        },
      },
    });

    const textOutput = response.text || '[]';
    let tasks = [];
    try {
      tasks = JSON.parse(textOutput);
    } catch {
      tasks = [];
    }

    return res.json({ tasks });
  } catch (error: any) {
    console.error('Error extracting tasks with Gemini API:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to extract tasks from the provided image',
    });
  }
});

// Development vs Production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
