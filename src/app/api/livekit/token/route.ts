import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

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

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'Server misconfigured: LIVEKIT_API_KEY or LIVEKIT_API_SECRET is missing' },
      { status: 500 }
    );
  }

  try {
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
