import { NextRequest, NextResponse } from 'next/server';
import type { BusinessSummary } from '@/app/types';

// Mock business data - replace with database query
const mockBusinesses: (BusinessSummary & {
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  website?: string;
  openingHours?: string;
  latitude?: number;
  longitude?: number;
})[] = [
  {
    id: 'restaurants-1',
    name: 'The Urban Tandoor',
    category: 'Restaurant',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&auto=format&fit=crop',
    rating: 4.8,
    reviews: 368,
    city: 'Patna',
    state: 'Bihar',
    address: 'Fraser Road, Patna',
    phone: '+91 9876543210',
    email: 'contact@urbantandoor.com',
    description: 'Modern Indian kitchen with charcoal grills, chef tasting menus and skyline seating.',
    website: 'https://urbantandoor.com',
    openingHours: 'Mon-Sun: 11:00 AM - 11:00 PM',
    latitude: 25.5941,
    longitude: 85.1376,
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: businessId } = await params;

    // Find business in mock data
    const business = mockBusinesses.find(b => b.id === businessId);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business details' },
      { status: 500 }
    );
  }
}


