import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/core/api/routeAuth';

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) return auth.response;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // En mode local, cela peut renvoyer ::1 ou 127.0.0.1
  const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
  
  return NextResponse.json({ success: true, ip });
}
