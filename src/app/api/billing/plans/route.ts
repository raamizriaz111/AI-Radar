// =============================================================================
// API: GET /api/billing/plans — Returns all available plans for pricing page
// =============================================================================
import { NextResponse } from 'next/server';
import { getAllPlans } from '@/lib/billing/planConfig';

export async function GET() {
  try {
    const plans = getAllPlans();
    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load plans' },
      { status: 500 }
    );
  }
}
