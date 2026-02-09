import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
const cookieParser = require('cookie-parser');

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'], // Configure logging: 'log', 'fatal', 'error', 'warn', 'debug', 'verbose'
    bodyParser: true, // Enable body parser
  });

  // Trust proxy if behind reverse proxy (nginx) - required for X-Forwarded-Proto header
  // This allows req.protocol to correctly reflect HTTPS when behind nginx
  // Get the underlying Express instance to configure trust proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);
  console.log('✅ [Bootstrap] Trust proxy enabled (for X-Forwarded-Proto support)');
  
  // Configure body size limits for file uploads (audio files can be large)
  // This must be set before any body parsing middleware
  const express = require('express');
  expressApp.use(express.json({ limit: '100mb' }));
  expressApp.use(express.urlencoded({ limit: '100mb', extended: true }));
  console.log('✅ [Bootstrap] Body size limits configured (100MB)');
  
  // Serve static files from uploads directory
  const path = require('path');
  expressApp.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  console.log('✅ [Bootstrap] Static file serving enabled for /uploads');

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';
  const originURL =  [
  'http://localhost:5150', 
  'https://localhost:5150', 
  'http://127.0.0.1:5150',
  'https://127.0.0.1:5150',
  "https://localhost:443",        // Nginx HTTPS proxy
  "https://127.0.0.1:443",        // Nginx HTTPS proxy (localhost IP)
  // 172.16.255.* subnet is handled dynamically in CORS origin function below
];
  
  // Function to check if origin matches allowed patterns (including 172.16.255.* subnet)
  const corsOriginFunction = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check exact matches in originURL array
    if (originURL.includes(origin)) {
      return callback(null, true);
    }

    // Check if origin matches localhost or 127.0.0.1 with any port
    // Pattern: http://localhost:PORT or https://localhost:PORT or http://127.0.0.1:PORT or https://127.0.0.1:PORT
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;
    if (localhostPattern.test(origin)) {
      return callback(null, true);
    }

    // Check if origin matches 172.16.255.* subnet pattern
    // Pattern: http://172.16.255.XXX:PORT or https://172.16.255.XXX:PORT
    const subnetPattern = /^https?:\/\/172\.16\.255\.\d+:\d+$/;
    if (subnetPattern.test(origin)) {
      return callback(null, true);
    }

    // Reject all other origins
    callback(new Error('Not allowed by CORS'));
  };
  
  // Enable cookie parser middleware FIRST - REQUIRED for httpOnly cookies
  // Must be registered before CORS to parse cookies correctly
  app.use(cookieParser());
  console.log('✅ [Bootstrap] Cookie parser middleware registered');
  
  // CORS configuration - Required for cookie-based authentication
  app.enableCors({
    origin: corsOriginFunction, // Dynamic origin checking (supports 172.16.255.* subnet)
    credentials: true, // Required for httpOnly cookies (access_token, refresh_token)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  console.log('✅ [Bootstrap] CORS enabled (with 172.16.255.* subnet support)');
  
  // Logging middleware - log request details including cookies
  // This must come AFTER cookieParser so cookies are parsed
  app.use((req: any, res: any, next: any) => {
    console.log('🔵 [Request]', req.method, req.path, '| Origin:', req.headers.origin);
    console.log('🔵 [Request] Cookies:', req.cookies ? Object.keys(req.cookies).join(', ') : 'No cookies');
    if (req.cookies && req.cookies.access_token) {
      console.log('✅ [Request] Access token cookie found');
    } else {
      console.log('❌ [Request] Access token cookie NOT found');
    }
    next();
  });
  console.log('✅ [Bootstrap] Request logging middleware registered');

  await app.listen(port, host, () => {
    console.log(`✅ [Bootstrap] Server is running on http://${host}:${port}`);
    console.log(`✅ [Bootstrap] Server ready to accept connections`);
  });

  // Hot Module Replacement (HMR) support
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
