import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { BRAND } from '@/config/branding';
import { isAdmin } from '@/lib/auth-helpers';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'An image file is required' }, { status: 400 });
    }

    const extension = allowedTypes.get(file.type);
    if (!extension) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are supported' },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be smaller than 5 MB' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      console.error('[API /upload/challenge-image] Supabase storage configuration is missing');
      return NextResponse.json({ error: 'Image storage is unavailable' }, { status: 500 });
    }

    const fileName = `challenge-images/${randomUUID()}.${extension}`;
    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/${BRAND.storage.bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': file.type,
        },
        body: Buffer.from(await file.arrayBuffer()),
      }
    );

    if (!uploadResponse.ok) {
      console.error('[API /upload/challenge-image] Supabase upload failed', {
        status: uploadResponse.status,
      });
      return NextResponse.json({ error: 'Unable to upload challenge image' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      url: `${supabaseUrl}/storage/v1/object/public/${BRAND.storage.bucket}/${fileName}`,
    });
  } catch (error) {
    console.error('[API /upload/challenge-image] POST error:', error);
    return NextResponse.json({ error: 'Unable to process challenge image' }, { status: 500 });
  }
}
