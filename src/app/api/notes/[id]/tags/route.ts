import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/notes/[id]/tags
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id: noteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("note_tags")
    .select("tag_id, workspace_tags(id, name, color)")
    .eq("note_id", noteId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tags = ((data ?? []) as unknown as Array<{ tag_id: string; workspace_tags: { id: string; name: string; color: string } }>).map(row => ({
    id: row.tag_id,
    tagId: row.workspace_tags.id,
    name: row.workspace_tags.name,
    color: row.workspace_tags.color,
  }));

  return NextResponse.json(tags);
}

// POST /api/notes/[id]/tags  — body: { tagId }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: noteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tagId } = await req.json();
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  // Insert into note_tags
  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tagId } as never);

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Tag already assigned" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bidirectional sync: if note has a linked task, also add tag to that task
  const { data: noteData } = await supabase
    .from("notes")
    .select("task_id")
    .eq("id", noteId)
    .single();

  const nd = noteData as { task_id: string | null } | null;
  if (nd?.task_id) {
    try {
      await supabase
        .from("task_tags")
        .insert({ task_id: nd.task_id, tag_id: tagId } as never);
    } catch {
      // duplicate or error – not critical
    }
  }

  // Return the tag details
  const { data: tagData, error: tagError } = await supabase
    .from("workspace_tags")
    .select("id, name, color")
    .eq("id", tagId)
    .single();

  if (tagError) return NextResponse.json({ error: tagError.message }, { status: 500 });

  const td = tagData as { id: string; name: string; color: string };
  return NextResponse.json({
    id: tagId,
    tagId: td.id,
    name: td.name,
    color: td.color,
  }, { status: 201 });
}

// DELETE /api/notes/[id]/tags?tagId=xxx
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id: noteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tagId = req.nextUrl.searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bidirectional sync: if note has a linked task, also remove tag from that task
  const { data: noteData } = await supabase
    .from("notes")
    .select("task_id")
    .eq("id", noteId)
    .single();

  const nd = noteData as { task_id: string | null } | null;
  if (nd?.task_id) {
    await supabase
      .from("task_tags")
      .delete()
      .eq("task_id", nd.task_id)
      .eq("tag_id", tagId);
  }

  return NextResponse.json({ success: true });
}
