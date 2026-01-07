import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/add-Department
 * Add a new department node to orgchart
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.pid) {
      console.warn("Missing required fields in add-Department:", {
        name: !!body.name,
        pid: !!body.pid,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name and pid are required",
        },
        { status: 400 }
      );
    }

    console.log("Adding department to Supabase:", {
      name: body.name,
      pid: body.pid,
    });

    // Create department object
    const departmentId = body.id || `dept:${body.name}:${body.pid}`;
    const departmentData = {
      id: departmentId,
      pid: body.pid,
      stpid: null,
      name: body.name,
      title: "Department",
      image: null,
      tags: JSON.stringify(["group"]),
      orig_pid: body.pid,
      dept: body.name,
      bu: null,
      type: "group",
      location: null,
      description: body.description || `Department under manager ${body.pid}`,
      joining_date: null
    };

    // Upsert to handle existing departments
    const { error } = await supabaseAdmin
      .from('orgchart_nodes')
      .upsert(departmentData, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }

    console.log("Department added successfully:", departmentId);

    return NextResponse.json(
      {
        success: true,
        data: departmentData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/add-Department failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to add department";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
