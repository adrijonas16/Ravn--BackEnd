import type { Request, Response } from 'express';
import { createApp } from '../src/create-app';

type HttpHandler = (req: Request, res: Response) => void;

let cachedServer: HttpHandler | undefined;

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance() as HttpHandler;
  }

  return cachedServer(req, res);
}
