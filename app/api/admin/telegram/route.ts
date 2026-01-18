import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  isAdminSessionValid,
  TELEGRAM_SETTINGS_KEY
} from '@/lib/admin-auth';

type TelegramSettings = {
  enabled: boolean;
  botToken: string;
  chatId: string;
  updatedAt: string;
};

const parseSettings = (value: unknown): TelegramSettings | null => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as TelegramSettings;
    } catch {
      return null;
    }
  }
  if (typeof value === 'object') {
    return value as TelegramSettings;
  }
  return null;
};

const isAuthorized = async () => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isAdminSessionValid(sessionToken);
};

export async function GET() {
  if (!(await isAuthorized())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const settingsRaw = await redis.get(TELEGRAM_SETTINGS_KEY);
  const settings = parseSettings(settingsRaw) || {
    enabled: false,
    botToken: '',
    chatId: '',
    updatedAt: new Date().toISOString()
  };

  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  if (!(await isAuthorized())) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const enabled = Boolean(body?.enabled);
  const botToken = String(body?.botToken || '').trim();
  const chatId = String(body?.chatId || '').trim();

  const settings: TelegramSettings = {
    enabled,
    botToken,
    chatId,
    updatedAt: new Date().toISOString()
  };

  await redis.set(TELEGRAM_SETTINGS_KEY, settings);

  return NextResponse.json(settings);
}
