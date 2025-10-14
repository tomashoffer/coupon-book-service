require('dotenv').config();
import cookieParser from 'cookie-parser';
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  if (!allowedOrigins) {
    // Fail-safe: If the variable is not set, throw an error during startup.
    throw new Error('CORS_ALLOWED_ORIGINS variable de ambiente no definida.');
  }

  // Create an array of allowed origins. This supports multiple domains.
  const whitelist = allowedOrigins.split(',').map(item => item.trim());

  //Enable CORS with a dynamic origin check.
  app.enableCors({
    origin: (origin, callback) => {
      // This will print the origin of every incoming request to your NestJS console.
      // Use this to debug the Google OAuth callback.
      // TODO: Remove or comment out in production.
      console.log(`CORS check: El origen de la peticion es [${origin}]`);

      // Allow requests if they have no origin (e.g., server-to-server, mobile apps, redirects)
      // OR if their origin is in our trusted whitelist.
      const isAllowed = !origin || whitelist.includes(origin);
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // Set up Swagger documentation.
  const config = new DocumentBuilder()
    .setTitle('Coupon Book Service API')
    .setDescription('API for managing coupon books, codes, assignments and redemptions')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start the application.
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
