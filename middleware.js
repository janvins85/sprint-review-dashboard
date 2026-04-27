import { NextResponse } from 'next/server';

export function middleware(req) {
  const auth = req.headers.get('authorization');

  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;

  if (!auth) {
    return new Response('Auth required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    });
  }

  const encoded = auth.split(' ')[1];
  const [inputUser, inputPass] = atob(encoded).split(':');

  if (inputUser === user && inputPass === pass) {
    return NextResponse.next();
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: '/:path*',
};
