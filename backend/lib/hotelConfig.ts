import type { CrisisType } from '@backend/types';

// ═══════════════════════════════════════════════════════════════════════════════
// HOTEL CONFIGURATION — Single source of truth for the entire system
// Change these values to deploy NOcrisis to ANY hotel.
// ═══════════════════════════════════════════════════════════════════════════════

export const hotelConfig = {
  name: 'Grand Horizon Hotel',
  city: 'Mumbai',
  totalRooms: 120,
  totalFloors: 5,

  locations: [
    'Lobby & Reception',
    'Floor 1 — Rooms 101–120',
    'Floor 2 — Rooms 201–220',
    'Floor 3 — Rooms 301–320',
    'Floor 4 — Rooms 401–420',
    'Floor 5 — Rooms 501–520',
    'Restaurant & Bar',
    'Kitchen',
    'Pool Area',
    'Gym & Spa',
    'Parking Basement',
    'Conference Hall A',
    'Conference Hall B',
    'Rooftop Lounge',
  ],

  // Context-aware: which locations are likely for each crisis type
  locationPreferences: {
    fire: ['Kitchen', 'Floor 2 — Rooms 201–220', 'Floor 3 — Rooms 301–320', 'Restaurant & Bar', 'Parking Basement'],
    medical: ['Floor 1 — Rooms 101–120', 'Floor 4 — Rooms 401–420', 'Pool Area', 'Gym & Spa', 'Floor 5 — Rooms 501–520'],
    security: ['Lobby & Reception', 'Parking Basement', 'Rooftop Lounge', 'Floor 1 — Rooms 101–120'],
  } as Record<CrisisType, string[]>,

  staffRoles: [
    { id: 'security', label: 'Security Officer', dept: 'Security', icon: '🛡️' },
    { id: 'frontdesk', label: 'Front Desk Manager', dept: 'Reception', icon: '🛎️' },
    { id: 'maintenance', label: 'Maintenance Lead', dept: 'Engineering', icon: '🔧' },
    { id: 'housekeeping', label: 'Housekeeping Supervisor', dept: 'Housekeeping', icon: '🧹' },
    { id: 'fnb', label: 'F&B Manager', dept: 'Restaurant', icon: '🍽️' },
    { id: 'manager', label: 'Duty Manager', dept: 'Management', icon: '👔' },
  ],

  emergencyContacts: {
    frontDesk: 'Ext. 0',
    security: 'Ext. 100',
    emergency: '112',
    fire: '101',
    police: '100',
    ambulance: '108',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SMART SIMULATION — Context-aware crisis generation
// ═══════════════════════════════════════════════════════════════════════════════

export function generateSmartCrisis(): { type: CrisisType; location: string; severity: number; description: string } {
  const types: CrisisType[] = ['fire', 'medical', 'security'];
  const type = types[Math.floor(Math.random() * types.length)];

  // Pick from preferred locations for this crisis type
  const preferred = hotelConfig.locationPreferences[type];
  const location = preferred[Math.floor(Math.random() * preferred.length)];

  // Severity weighted towards 3-5 for demo impact
  const severity = Math.floor(Math.random() * 3) + 3;

  const descriptions: Record<CrisisType, string[]> = {
    fire: [
      `Smoke detected by IoT sensor at ${location}. Thermal imaging confirms active flame.`,
      `Fire alarm triggered at ${location}. CCTV shows visible smoke in corridor.`,
      `Heat anomaly detected at ${location}. Automatic sprinklers activated.`,
    ],
    medical: [
      `Guest distress signal received from ${location}. Vitals monitoring flagged emergency.`,
      `Staff reported unresponsive individual at ${location}. Immediate response required.`,
      `Medical alert triggered at ${location}. AED deployment recommended.`,
    ],
    security: [
      `Unauthorized access detected at ${location}. CCTV flagged suspicious activity.`,
      `Perimeter breach detected at ${location}. Security protocol initiated.`,
      `Threat level elevated at ${location}. Access control lockdown recommended.`,
    ],
  };

  const descList = descriptions[type];
  const description = descList[Math.floor(Math.random() * descList.length)];

  return { type, location, severity, description };
}
