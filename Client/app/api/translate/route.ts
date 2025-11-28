import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const text = searchParams.get('text');
  const langPair = searchParams.get('langpair');

  if (!text || !langPair) {
    return NextResponse.json(
      { error: 'Missing text or langpair parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${langPair}`
    );

    if (!response.ok) {
      throw new Error(`MyMemory API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}
