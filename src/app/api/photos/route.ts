import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || 'Eclectica';

  if (cloudName && apiKey && apiSecret) {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            expression: `folder:${folder} AND resource_type:image`,
            max_results: 30,
            sort_by: [{ created_at: 'asc' }],
            with_field: ['context']
          }),
          next: { revalidate: 10 } // Slightly shorter cache for admin dashboard list
        }
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.resources.map((res: any, idx: number) => ({
          url: res.secure_url,
          title: res.context?.title || `Memory #${idx + 1}`,
          caption: res.context?.caption || `A beautiful moment captured from ${folder} event.`,
          publicId: res.public_id
        }));

        return NextResponse.json({ success: true, images });
      }
    } catch (error) {
      console.error('Error fetching images in admin config:', error);
    }
  }

  return NextResponse.json({
    success: true,
    images: [],
    note: 'Cloudinary is not fully configured yet.'
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Missing publicId parameter' },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'Cloudinary credentials are not fully configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.round(new Date().getTime() / 1000).toString();
    
    // Sort parameters alphabetically: public_id, timestamp
    const signature = crypto
      .createHash('sha256')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.result === 'ok') {
        return NextResponse.json({ success: true, result });
      }
      return NextResponse.json(
        { success: false, error: result.result || 'Failed to destroy resource' },
        { status: 400 }
      );
    }

    const errText = await response.text();
    return NextResponse.json({ success: false, error: errText }, { status: response.status });
  } catch (error: any) {
    console.error('Error destroying image in admin api:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
