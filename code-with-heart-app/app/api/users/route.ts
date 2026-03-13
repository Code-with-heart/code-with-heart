import { NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/supabase/auth";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const { userId } = await getUserFromSession();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user")
    .select(
      "id, full_name, email, user_type, faculty:faculty_id (id, name, abbreviation, color)"
    )
    .order("full_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}
