import { NextResponse } from 'next/server';
import path from 'path';
import '@/core/config/firebase-admin';
import { authorizeAudioDispatch } from '@/core/api/routeAuth';
import { readAudioUploadBody } from '@/core/services/audio/read-audio-upload-body';
import { ingestCallAudioBuffer } from '@/core/services/audio/ingestCallAudioBuffer';

export const runtime = 'nodejs';

/** Ping / préflight : MacroDroid et les clients mobiles n’utilisent pas toujours le navigateur ; utile pour vérifier l’URL et le réseau. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/ai/audio-dispatch',
    methods: ['POST', 'OPTIONS'],
    post: {
      description:
        'Envoyez l’audio en corps brut (fichier binaire) ou en multipart/form-data. Préférez le corps brut + Content-Type application/octet-stream pour MacroDroid.',
      queryParams: { phone: 'optionnel — numéro associé à l’appel' },
    },
    checks: [
      'Même Wi‑Fi que le PC si http://IP:3000, ou URL HTTPS accessible depuis le téléphone',
      'Méthode POST (pas GET)',
      'Corps = contenu du fichier (pas le chemin du fichier en texte)',
    ],
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: Request) {
  const allowed = await authorizeAudioDispatch(request);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 403, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }

  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');

    if (!phone) {
      console.warn('API audio-dispatch: Aucun numéro de téléphone fourni (?phone=)');
    }

    const ct = request.headers.get('content-type') || '';
    const contentLength = request.headers.get('content-length');

    const parsed = await readAudioUploadBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error,
          ...(parsed.hint ? { hint: parsed.hint } : {}),
          debug: {
            contentType: ct || '(vide)',
            contentLengthHeader: contentLength ?? '(absent)',
          },
        },
        { status: parsed.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { buffer, fileName } = parsed;

    const ext = path.extname(fileName) || '.m4a';
    const phoneSegment = phone ? phone.replace(/[^a-zA-Z0-9]/g, '') : 'unknown';
    const { publicUrl } = await ingestCallAudioBuffer({
      buffer,
      ext,
      phone,
      source: 'audio-dispatch',
      fileBase: `call-${phoneSegment}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    });

    const receivedAt = new Date().toISOString();
    const processedAt = receivedAt;

    return NextResponse.json(
      {
        success: true,
        phone: phone || null,
        audioUrl: publicUrl,
        savedBytes: buffer.length,
        receivedAt,
        processedAt,
        status: 'En traitement',
        message:
          'Fichier enregistré. Transcription lancée en arrière-plan — la PWA se mettra à jour (carte + panneau MacroDroid).',
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur';
    console.error('Erreur API audio-dispatch:', error);
    return NextResponse.json(
      { success: false, error: message },
      {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}
