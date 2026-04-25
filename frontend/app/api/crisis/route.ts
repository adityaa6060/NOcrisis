import { NextRequest, NextResponse } from 'next/server';

// This route acts as a webhook/trigger endpoint for external systems
// In production: connect to CCTV AI, IoT sensors, alarm systems
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.type || !body.severity || !body.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Pass through to client - actual DB write happens on the frontend
    return NextResponse.json({ 
      success: true, 
      message: 'Crisis trigger received',
      crisis: body 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'NOcrisis API v1.0',
    endpoints: {
      'POST /api/crisis': 'Trigger a crisis alert',
      'POST /api/ai-instructions': 'Generate AI response instructions',
    }
  });
}
