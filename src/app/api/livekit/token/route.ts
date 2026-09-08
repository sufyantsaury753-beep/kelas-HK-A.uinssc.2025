import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room');
  const identity = searchParams.get('identity');
  const name = searchParams.get('name');

  if (!room || !identity) {
    return NextResponse.json(
      { error: 'Missing "room" or "identity" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'APIG2gCN84X3Jy9';
  const apiSecret =
    process.env.LIVEKIT_API_SECRET || 'j8HxZrOVjkFicftM4vduATR9n7IETjMmkXjWkQ27NHC';
  const livekitHost =
    process.env.LIVEKIT_HOST ||
    process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace('wss://', 'https://') ||
    'https://kelas-hk-a-aiflm7bo.livekit.cloud';

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Server misconfigured: LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing' },
      { status: 500 }
    );
  }

  try {
    // Proactively kick any stale/ghost sessions with the same identity or name before issuing token
    try {
      const svc = new RoomServiceClient(livekitHost, apiKey, apiSecret);
      const participants = await svc.listParticipants(room);
      for (const p of participants) {
        if (
          p.identity === identity ||
          (name && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase())
        ) {
          await svc.removeParticipant(room, p.identity).catch(() => {});
        }
      }
    } catch {
      // Room might not exist yet, safe to ignore
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: name || identity,
      ttl: '24h',
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create token' },
      { status: 500 }
    );
  }
}
