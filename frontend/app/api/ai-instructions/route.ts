import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, severity, location, description } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `You are a hotel emergency response AI. A ${severity}/5 severity ${type.toUpperCase()} crisis has occurred at "${location}" in a luxury hotel.
${description ? `Details: ${description}` : ''}

Generate URGENT, ACTIONABLE emergency instructions.

Respond ONLY with a valid JSON object in this exact format:
{
  "staff": ["action 1", "action 2", "action 3", "action 4", "action 5"],
  "guests": ["action 1", "action 2", "action 3"]
}

Rules:
- Each action must be under 15 words
- Be specific, urgent, and practical
- Staff actions: hands-on response, coordination, and safety checks
- Guest actions: simple, calm, clear safety instructions
- Return ONLY the JSON, no other text or markdown`;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const clean = text.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(clean);

          return NextResponse.json({
            staff: parsed.staff || [],
            guests: parsed.guests || [],
          });
        }
      } catch (e) {
        console.error('Gemini API error, falling back to templates:', e);
      }
    }

    // Fallback mock instructions
    return NextResponse.json(getMockInstructions(type, severity));
  } catch (error) {
    console.error('AI instructions error:', error);
    return NextResponse.json({ error: 'Failed to generate instructions' }, { status: 500 });
  }
}

function getMockInstructions(type: string, severity: number) {
  const templates: Record<string, { staff: string[]; guests: string[] }> = {
    fire: {
      staff: [
        'Call 101 (Fire Department) immediately',
        'Activate hotel-wide fire alarm and PA system',
        'Guide all guests to nearest emergency exits using stairwells only',
        'Sweep all floors — knock loudly on every room door',
        'Report to assembly point with headcount, assist disabled guests first',
      ],
      guests: [
        'Leave your room immediately — take only your key card',
        'Use STAIRS only — do NOT use elevators',
        'Proceed to the assembly point at the main entrance',
      ],
    },
    medical: {
      staff: [
        'Call 112 for ambulance — provide exact location and details',
        'First-aider proceed to incident location immediately',
        'Clear path from location to main entrance for paramedics',
        'Keep bystanders away — maintain patient\'s privacy',
        'Stay with patient until ambulance arrives — monitor vitals',
      ],
      guests: [
        'Stay calm and clear the area around the incident',
        'Do not attempt to move the affected person',
        'Follow all staff instructions and stay in your room',
      ],
    },
    security: {
      staff: [
        'Call 100 (Police) immediately — do not confront the threat',
        'Lock down all hotel entrances and exits',
        'Guide guests away from the threat area quietly',
        'Monitor CCTV footage and relay info to police',
        'Maintain radio communication — report all movements',
      ],
      guests: [
        'Stay in your room and lock the door immediately',
        'Do not open the door for anyone except hotel security',
        'Call front desk (Ext. 0) if you hear or see anything suspicious',
      ],
    },
  };

  return templates[type] || templates.fire;
}
