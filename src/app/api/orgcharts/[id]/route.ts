import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/orgcharts/[id]
 * Fetch a single custom orgchart by ID
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate ID
        if (!id || typeof id !== 'string') {
            return NextResponse.json(
                { error: "Invalid orgchart ID" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('custom_orgcharts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return NextResponse.json({
                    error: "Orgchart not found",
                    orgchart_id: id,
                    org_data: { data: [] }
                }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({
            orgchart_id: data.id,
            orgchart_name: data.orgchart_name,
            describe: data.description,
            org_data: data.org_data,
            username: data.username,
            created_at: data.created_at,
            updated_at: data.updated_at
        });
    } catch (err) {
        const error = err as Error;
        console.error("GET Orgchart Error:", error.message, error.stack);
        return NextResponse.json({
            error: error.message || "Unknown error occurred",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

/**
 * PUT /api/orgcharts/[id]
 * Update an existing custom orgchart
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const data = await request.json();
        const { org_data, orgchart_name, describe } = data;

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (org_data !== undefined) updateData.org_data = org_data;
        if (orgchart_name) updateData.orgchart_name = orgchart_name;
        if (describe !== undefined) updateData.description = describe;

        const { error } = await supabaseAdmin
            .from('custom_orgcharts')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Updated successfully"
        });
    } catch (err) {
        console.error("PUT Orgchart Error:", err);
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/orgcharts/[id]
 * Delete a custom orgchart
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('custom_orgcharts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Deleted successfully"
        });
    } catch (err) {
        console.error("DELETE Orgchart Error:", err);
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
