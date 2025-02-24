import express from "express";
import { app } from "./app";
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
// import connectDB from './utils/db';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { v1Routes } from "./express-app";

async function bootstrap() {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || "http://localhost";

  app.use('/api/v1', ...v1Routes);
  // app.get('/api/v1/hello', (req, res) => {
  //   res.send('Hello from Express API v1');
  // });

  const adapter = new ExpressAdapter(app);
  const nestApp = await NestFactory.create(AppModule, adapter);
  nestApp.setGlobalPrefix("api/v2");
  
  nestApp.useLogger(nestApp.get(Logger));
  nestApp.useGlobalInterceptors(new LoggerErrorInterceptor());
  
  await nestApp.listen(port, () => {
    // connectDB();
    logExpressRoutes(app);
    console.log(`🚀 Server is running at ${host}:${port}`);
  });
}

function logExpressRoutes(app: express.Application) {
  console.log("📌 Registered Express Routes:");
  
  app.router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Extract only explicitly defined routes
      const route = middleware.route as any;
      const methods = Object.keys(route.methods)
        .map((method) => method.toUpperCase())
        .join(", ");
      
      if (route.path !== "/") {  // Prevent logging unintended root routes
        console.log(`   ${methods} -> ${route.path}`);
      }
    } else if (middleware.name === "router") {
      // Handle nested routers
      const router: any = middleware.handle;
      router.stack.forEach((subMiddleware) => {
        if (subMiddleware.route) {
          const subRoute = subMiddleware.route as any;
          const subMethods = Object.keys(subRoute.methods)
            .map((method) => method.toUpperCase())
            .join(", ");
          
          if (subRoute.path !== "/") { // Prevent unintended logging
            console.log(`   ${subMethods} -> ${subRoute.path}`);
          }
        }
      });
    }
  });
}

bootstrap();
