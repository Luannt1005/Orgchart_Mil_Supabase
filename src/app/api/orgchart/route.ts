import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCachedData } from "@/lib/cache";

// Cache TTL: 15 minutes for orgchart data (increased for better performance)
const ORGCHART_CACHE_TTL = 15 * 60 * 1000;

// Only select columns needed for orgchart rendering
const ORGCHART_COLUMNS = 'id, pid, stpid, name, title, image, tags, dept, bu, type, location, joining_date';

/**
 * GET /api/orgchart
 * Fetch orgchart nodes, optionally filtered by department
 * 
 * OPTIMIZATIONS:
 * 1. Select only needed columns (excludes raw_data, description)
 * 2. Extended cache TTL to 15 minutes
 * 3. Database-side filtering for department
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get("dept");

    // Build cache key based on department filter
    const cacheKey = dept && dept !== "all" ? `orgchart_dept_${dept}` : 'orgchart_all';

    const data = await getCachedData(
      cacheKey,
      async () => {
        console.log(`📡 [Cache MISS] Fetching orgchart from Supabase (dept: ${dept || 'all'})...`);

        let query = supabaseAdmin
          .from('orgchart_nodes')
          .select(ORGCHART_COLUMNS);

        // Apply database-side filtering for better performance
        if (dept && dept !== "all") {
          query = query.eq('dept', dept);
        }

        const { data: nodes, error } = await query;

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        // Filter out nodes without dept (if fetching all)
        let validNodes = nodes || [];
        if (!dept || dept === "all") {
          validNodes = validNodes.filter(
            (n: any) => typeof n.dept === "string" && n.dept.trim() !== ""
          );
        }

        console.log(`✅ Loaded ${validNodes.length} orgchart nodes`);
        return validNodes;
      },
      ORGCHART_CACHE_TTL
    );

    const response = NextResponse.json(
      {
        data,
        success: true,
        timestamp: new Date().toISOString(),
        cached: true
      },
      { status: 200 }
    );

    // Extended cache headers
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return response;
  } catch (err: any) {
    console.error("Error loading orgchart:", err);
    return NextResponse.json(
      {
        data: [],
        success: false,
        error: err.message || "Failed to load data",
      },
      { status: 500 }
    );
  }
}
