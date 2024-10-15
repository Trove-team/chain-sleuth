import { Elysia } from 'elysia';
import { NextApiRequest, NextApiResponse } from 'next';
import app from '../../api/index';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const elysia = new Elysia().use(app);
  
  // Convert NextApiRequest to a format Elysia can handle
  const request = new Request(req.url!, {
    method: req.method,
    headers: new Headers(req.headers as HeadersInit),
    body: req.body ? JSON.stringify(req.body) : undefined
  });

  const response = await elysia.handle(request);

  // Convert Elysia response to NextApiResponse
  res.status(response.status);
  for (const [key, value] of Object.entries(response.headers)) {
    res.setHeader(key, value);
  }
  res.send(await response.text());
};

export default handler;
