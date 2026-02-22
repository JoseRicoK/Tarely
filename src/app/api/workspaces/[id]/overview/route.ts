import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getWorkspace, listTasksWithTags } from "@/lib/store";
import type { WorkspaceSection } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface WorkspaceSectionRow {
  id: string;
  workspace_id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkspaceOverviewResponse {
  workspace: NonNullable<Awaited<ReturnType<typeof getWorkspace>>>;
  tasks: Awaited<ReturnType<typeof listTasksWithTags>>;
  sections: WorkspaceSection[];
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    z.string().uuid().parse(id);

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [workspace, tasks, sectionsResult] = await Promise.all([
      getWorkspace(id),
      listTasksWithTags(id),
      supabase
        .from("workspace_sections")
        .select("*")
        .eq("workspace_id", id)
        .order("order", { ascending: true }),
    ]);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 }
      );
    }

    if (sectionsResult.error) {
      console.error("Error fetching sections in workspace overview:", sectionsResult.error);
      return NextResponse.json(
        { error: "Error al obtener secciones" },
        { status: 500 }
      );
    }

    const sections = ((sectionsResult.data ?? []) as WorkspaceSectionRow[]).map((section) => ({
      id: section.id,
      workspaceId: section.workspace_id,
      name: section.name,
      icon: section.icon,
      color: section.color,
      order: section.order,
      isSystem: section.is_system,
      createdAt: section.created_at,
      updatedAt: section.updated_at,
    }));

    const response: WorkspaceOverviewResponse = {
      workspace,
      tasks,
      sections,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "ID de workspace inválido" }, { status: 400 });
    }
    console.error("Error loading workspace overview:", error);
    return NextResponse.json(
      { error: "Error al cargar datos del workspace" },
      { status: 500 }
    );
  }
}
