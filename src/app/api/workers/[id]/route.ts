import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data } = await supabaseAdmin
      .from('worker_profiles')
      .select('*, users(name, phone, city)')
      .eq('id', id)
      .single();

    if (!data) {
      return NextResponse.json({ success: false, error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch worker' }, { status: 500 });
  }
}
