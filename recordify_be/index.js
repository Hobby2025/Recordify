import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';

const fastify = Fastify({
  logger: true
});

// CORS 플러그인 등록
fastify.register(fastifyCors, {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// JWT 플러그인 등록
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret-key'
});

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Google OAuth Callback Endpoint
fastify.post('/auth/google/callback', async (request, reply) => {
  const credential = request.body?.credential;

  if (!credential) {
    return reply.status(400).send({ error: 'No credential provided' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return reply.status(400).send({ error: 'Invalid Google token' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return reply.status(400).send({ error: 'Email not found in Google token' });
    }

    const user = await prisma.user.upsert({
      where: { email: email },
      update: { googleId: googleId, name: name, picture: picture },
      create: { email: email, googleId: googleId, name: name, picture: picture },
    });

    // JWT 생성
    const token = fastify.jwt.sign(
        { userId: user.id, email: user.email },
        { expiresIn: '1d' }
    );

    // 사용자 정보 대신 JWT 반환
    return reply.send({ token });

  } catch (error) {
    return reply.status(500).send({ error: 'Authentication failed' });
  }
});

// TODO: 보호된 API 엔드포인트 예시 (JWT 검증 필요)
// fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
//   // fastify.authenticate 미들웨어가 JWT를 검증하고 request.user에 페이로드를 넣어줌
//   return request.user;
// });
// fastify.decorate("authenticate", async function(request, reply) {
//   try {
//     await request.jwtVerify();
//   } catch (err) {
//     reply.send(err);
//   }
// });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' });
    fastify.log.info(`Backend server listening on port 4000`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 