import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/orgcharts
 * Fetch custom orgcharts for a specific user
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ orgcharts: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_orgcharts')
      .select('id, orgchart_name, description, org_data')
      .eq('username', username);

    if (error) throw error;

    const orgcharts = (data || []).map(doc => ({
      orgchart_id: doc.id,
      orgchart_name: doc.orgchart_name,
      describe: doc.description,
      org_data: doc.org_data,
    }));

    return NextResponse.json({ orgcharts });
  } catch (err) {
    console.error("GET orgcharts error:", err);
    return NextResponse.json(
      { orgcharts: [], error: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orgcharts
 * Create a new custom orgchart
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { username, orgchart_name, describe, org_data } = data;

    if (!username || !orgchart_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: newOrgchart, error } = await supabaseAdmin
      .from('custom_orgcharts')
      .insert({
        username,
        orgchart_name,
        description: describe || "",
        org_data: org_data || { data: [] }
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orgchart_id: newOrgchart.id,
      message: "Orgchart created successfully"
    });
  } catch (err) {
    console.error("Error creating orgchart:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
