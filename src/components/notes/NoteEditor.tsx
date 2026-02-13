"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import DragHandle from "@tiptap/extension-drag-handle-react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { TableKit } from "@tiptap/extension-table";
import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import { Node, mergeAttributes } from "@tiptap/core";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  TableIcon,
  Highlighter,
  Palette,
  Type,
  Trash2,
  Plus,
  GripVertical,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  Unlink,
  FileText,
} from "lucide-react";


// ============== PDF NODE EXTENSION ==============

const PdfNode = Node.create({
  name: 'pdf',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      fileName: { default: 'document.pdf' },
      height: {
        default: 500,
        parseHTML: (el) => el.getAttribute('data-height') || 500,
        renderHTML: (attrs) => ({ 'data-height': attrs.height }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-pdf]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || '';
    const fileName = HTMLAttributes.fileName || 'document.pdf';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-pdf': '',
        class: 'pdf-embed',
      }),
      [
        'div',
        { class: 'pdf-embed-header' },
        ['span', { class: 'pdf-embed-icon' }, '📄'],
        ['span', { class: 'pdf-embed-name' }, fileName],
        ['a', { href: src, target: '_blank', rel: 'noopener noreferrer', class: 'pdf-embed-download', download: fileName }, 'Descargar'],
      ],
      [
        'div',
        { class: 'pdf-embed-resize-wrapper', style: `height: ${HTMLAttributes['data-height'] || 500}px` },
        [
          'iframe',
          {
            src: src,
            class: 'pdf-embed-frame',
            frameborder: '0',
            loading: 'lazy',
          },
        ],
      ],
    ];
  },
});


// ============== TYPES ==============

interface NoteEditorProps {
  content: Record<string, unknown>;
  onUpdate: (json: Record<string, unknown>, text: string) => void;
  editable?: boolean;
  className?: string;
}

export interface NoteEditorHandle {
  insertContent: (text: string) => void;
}

interface SlashCommand {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
  action: ((editor: ReturnType<typeof useEditor>) => void) | null;
}

// ============== SLASH COMMANDS ==============

const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: "Texto",
    description: "Párrafo normal",
    icon: Type,
    keywords: ["texto", "parrafo", "text", "paragraph", "p"],
    action: (editor) => editor?.chain().focus().setParagraph().run(),
  },
  {
    name: "Título 1",
    description: "Título grande",
    icon: Heading1,
    keywords: ["titulo", "h1", "heading", "title"],
    action: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    name: "Título 2",
    description: "Título mediano",
    icon: Heading2,
    keywords: ["titulo", "h2", "heading", "subtitle"],
    action: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    name: "Título 3",
    description: "Título pequeño",
    icon: Heading3,
    keywords: ["titulo", "h3", "heading"],
    action: (editor) =>
      editor?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    name: "Lista",
    description: "Lista con viñetas",
    icon: List,
    keywords: ["lista", "bullet", "viñeta", "ul"],
    action: (editor) => editor?.chain().focus().toggleBulletList().run(),
  },
  {
    name: "Lista numerada",
    description: "Lista con números",
    icon: ListOrdered,
    keywords: ["lista", "numerada", "ordered", "ol", "numeros"],
    action: (editor) => editor?.chain().focus().toggleOrderedList().run(),
  },
  {
    name: "Checklist",
    description: "Lista de verificación",
    icon: ListChecks,
    keywords: ["check", "todo", "tarea", "verificar", "task"],
    action: (editor) => editor?.chain().focus().toggleTaskList().run(),
  },
  {
    name: "Cita",
    description: "Bloque de cita",
    icon: Quote,
    keywords: ["cita", "quote", "blockquote"],
    action: (editor) => editor?.chain().focus().toggleBlockquote().run(),
  },
  {
    name: "Código",
    description: "Bloque de código",
    icon: Code2,
    keywords: ["codigo", "code", "pre", "snippet"],
    action: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
  },
  {
    name: "Separador",
    description: "Línea horizontal",
    icon: Minus,
    keywords: ["separador", "linea", "horizontal", "divider", "hr"],
    action: (editor) => editor?.chain().focus().setHorizontalRule().run(),
  },
  {
    name: "Tabla",
    description: "Insertar tabla 3×3",
    icon: TableIcon,
    keywords: ["tabla", "table", "grid"],
    action: (editor) =>
      editor
        ?.chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    name: "Imagen",
    description: "Insertar imagen",
    icon: ImageIcon,
    keywords: ["imagen", "image", "foto", "photo", "img"],
    action: null,
  },
  {
    name: "PDF",
    description: "Insertar documento PDF",
    icon: FileText,
    keywords: ["pdf", "documento", "document", "archivo", "file"],
    action: null,
  },
];

// ============== TURN INTO COMMANDS ==============

const TURN_INTO_COMMANDS: SlashCommand[] = SLASH_COMMANDS.filter((c) =>
  ["Texto", "Título 1", "Título 2", "Título 3", "Lista", "Lista numerada", "Checklist", "Cita", "Código"].includes(c.name)
);

// ============== COLORS ==============

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f59e0b",
];

// ============== TOOLTIP BUTTON ==============

function TBtn({
  onClick,
  isActive,
  disabled,
  icon: Icon,
  label,
  className: extra,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      className={cn(
        "inline-flex items-center justify-center h-7 w-7 rounded-md transition-all text-popover-foreground/70 hover:text-popover-foreground hover:bg-white/10",
        isActive && "bg-white/15 text-popover-foreground",
        disabled && "opacity-30 pointer-events-none",
        extra
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

// ============== SLASH MENU COMPONENT ==============

function SlashMenu({
  commands,
  selectedIndex,
  onSelect,
  position,
}: {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  position: { top: number; left: number };
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = menuRef.current?.children[selectedIndex] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (commands.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      data-slash-menu
      className="fixed z-[100] w-56 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl py-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
      style={{ top: position.top, left: position.left }}
    >
      {commands.map((cmd, i) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.name}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-1.5 text-left text-sm transition-colors",
              i === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "text-popover-foreground hover:bg-accent/50"
            )}
            onClick={() => onSelect(cmd)}
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted/60 shrink-0">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="font-medium truncate text-[13px]">{cmd.name}</span>
              <span className="text-[11px] text-muted-foreground truncate">{cmd.description}</span>
            </span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ============== TURN INTO DROPDOWN ==============

function TurnIntoDropdown({
  editor,
  onClose,
  position,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  onClose: () => void;
  position: { top: number; left: number };
}) {
  return createPortal(
    <div
      className="fixed z-[100] w-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-2xl py-1 animate-in fade-in-0 zoom-in-95"
      style={{ top: position.top, left: position.left }}
      data-slash-menu
    >
      <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Convertir en
      </div>
      {TURN_INTO_COMMANDS.map((cmd) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.name}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent/50 transition-colors"
            onClick={() => {
              if (cmd.action) cmd.action(editor);
              onClose();
            }}
          >
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px]">{cmd.name}</span>
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ============== TABLE CONTROLS (Notion-style) ==============

function TableControls({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [tableRect, setTableRect] = useState<DOMRect | null>(null);
  const [contextMenu, setContextMenu] = useState<{ top: number; left: number } | null>(null);
  const tableElRef = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    const editorDom = editor.view.dom;
    const scrollParent = editorDom.closest('.overflow-y-auto, .overflow-auto') || editorDom.parentElement;

    const updateRect = () => {
      if (tableElRef.current && tableElRef.current.isConnected) {
        setTableRect(tableElRef.current.getBoundingClientRect());
      } else {
        tableElRef.current = null;
        setTableRect(null);
      }
    };

    let rafId = 0;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-table-controls]')) return;
        const table = target.closest('table') as HTMLTableElement | null;
        if (table && editorDom.contains(table)) {
          if (tableElRef.current !== table) tableElRef.current = table;
          updateRect();
        } else if (tableElRef.current) {
          tableElRef.current = null;
          setTableRect(null);
        }
      });
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td, th');
      if (cell && editorDom.contains(cell)) {
        e.preventDefault();
        try {
          const pos = editor.view.posAtDOM(cell, 0);
          editor.commands.setTextSelection(pos);
        } catch { /* ignore */ }
        setContextMenu({ top: e.clientY, left: e.clientX });
      }
    };

    const handleScroll = () => updateRect();

    editorDom.addEventListener('mousemove', handleMouseMove, { passive: true });
    editorDom.addEventListener('contextmenu', handleContextMenu);
    if (scrollParent) scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      editorDom.removeEventListener('mousemove', handleMouseMove);
      editorDom.removeEventListener('contextmenu', handleContextMenu);
      if (scrollParent) scrollParent.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [editor]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-table-controls]')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const menuItems = useMemo(() => [
    { label: "Insertar columna izquierda", icon: ArrowLeft, action: () => editor.chain().focus().addColumnBefore().run() },
    { label: "Insertar columna derecha", icon: ArrowRight, action: () => editor.chain().focus().addColumnAfter().run() },
    { label: "Insertar fila arriba", icon: ArrowUp, action: () => editor.chain().focus().addRowBefore().run() },
    { label: "Insertar fila abajo", icon: ArrowDown, action: () => editor.chain().focus().addRowAfter().run() },
    { type: "separator" as const },
    { label: "Eliminar columna", icon: Minus, action: () => editor.chain().focus().deleteColumn().run(), destructive: true },
    { label: "Eliminar fila", icon: Minus, action: () => editor.chain().focus().deleteRow().run(), destructive: true },
    { label: "Eliminar tabla", icon: Trash2, action: () => editor.chain().focus().deleteTable().run(), destructive: true },
  ], [editor]);

  if (!tableRect) return null;

  return createPortal(
    <div data-table-controls>
      {/* + Add column (right edge) */}
      <button
        className="fixed z-20 flex items-center justify-center w-5 rounded-r-md bg-muted/60 hover:bg-accent border border-l-0 border-border/40 text-muted-foreground/40 hover:text-foreground transition-all"
        style={{ top: tableRect.top, left: tableRect.right, height: tableRect.height }}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addColumnAfter().run();
        }}
        title="Añadir columna"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* + Add row (bottom edge) */}
      <button
        className="fixed z-20 flex items-center justify-center h-5 rounded-b-md bg-muted/60 hover:bg-accent border border-t-0 border-border/40 text-muted-foreground/40 hover:text-foreground transition-all"
        style={{ top: tableRect.bottom, left: tableRect.left, width: tableRect.width }}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addRowAfter().run();
        }}
        title="Añadir fila"
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] w-56 rounded-xl border border-border bg-popover shadow-2xl py-1.5 animate-in fade-in-0 zoom-in-95"
          style={{ top: contextMenu.top, left: contextMenu.left }}
        >
          {menuItems.map((item, i) =>
            'type' in item && item.type === 'separator' ? (
              <div key={i} className="mx-2 my-1.5 border-t border-border/30" />
            ) : (
              <button
                key={item.label}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-1.5 text-left text-sm transition-colors",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-popover-foreground hover:bg-accent/50"
                )}
                onClick={() => {
                  item.action?.();
                  setContextMenu(null);
                }}
              >
                {item.icon && <item.icon className="h-3.5 w-3.5 shrink-0" />}
                <span className="text-[13px]">{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

// ============== MAIN EDITOR ==============

export const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(function NoteEditor({
  content,
  onUpdate,
  editable = true,
  className,
}, ref) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Slash command state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const [slashIndex, setSlashIndex] = useState(0);

  // Turn Into dropdown state
  const [turnIntoOpen, setTurnIntoOpen] = useState(false);
  const [turnIntoPos, setTurnIntoPos] = useState({ top: 0, left: 0 });

  const filteredCommands = useMemo(() => SLASH_COMMANDS.filter((cmd) => {
    if (!slashQuery) return true;
    const q = slashQuery.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.includes(q))
    );
  }), [slashQuery]);

  const filteredRef = useRef(filteredCommands);
  const slashOpenRef = useRef(slashOpen);
  const slashIndexRef = useRef(slashIndex);

  // Sync refs via effect to comply with React strict mode
  useEffect(() => { filteredRef.current = filteredCommands; }, [filteredCommands]);
  useEffect(() => { slashOpenRef.current = slashOpen; }, [slashOpen]);
  useEffect(() => { slashIndexRef.current = slashIndex; }, [slashIndex]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Placeholder.configure({
        placeholder: ({ node, editor: pEditor }) => {
          if (node.type.name === "heading") {
            const level = node.attrs.level;
            return level === 1 ? "Título 1" : level === 2 ? "Título 2" : "Título 3";
          }
          // Solo mostrar placeholder en el primer párrafo cuando el editor está vacío
          if (node.type.name === "paragraph" && pEditor.isEmpty) {
            return 'Escribe "/" para comandos...';
          }
          return '';
        },
        includeChildren: true,
      }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: { resizable: true },
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        resize: {
          enabled: true,
          directions: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
          minWidth: 100,
          minHeight: 50,
          alwaysPreserveAspectRatio: true,
        },
      }),
      PdfNode,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyleKit,
      Typography,
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none min-h-[500px] pl-20 pr-12 pt-6 pb-[40vh] max-w-none",
      },
      handleKeyDown: (_view, event) => {
        if (!slashOpenRef.current) return false;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashIndex((prev) =>
            Math.min(prev + 1, filteredRef.current.length - 1)
          );
          return true;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashIndex((prev) => Math.max(prev - 1, 0));
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const cmd = filteredRef.current[slashIndexRef.current];
          if (cmd) executeSlashCommand(cmd);
          return true;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashOpen(false);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      // Slash command detection — use current paragraph text only
      const { from, empty } = ed.state.selection;
      if (empty) {
        const { $from } = ed.state.selection;
        const textInNode = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
        const match = textInNode.match(
          /(?:^|\s)\/([a-zA-ZáéíóúñÁÉÍÓÚÑ0-9]*)$/
        );
        if (match) {
          const coords = ed.view.coordsAtPos(from);
          const menuHeight = 320; // max-h-72 ≈ 288px + padding
          const viewportH = window.innerHeight;
          const spaceBelow = viewportH - coords.bottom - 10;
          const top = spaceBelow < menuHeight
            ? coords.top - menuHeight - 6
            : coords.bottom + 6;
          setSlashQuery(match[1]);
          setSlashIndex(0);
          setSlashPos({ top, left: coords.left });
          setSlashOpen(true);
        } else {
          setSlashOpen(false);
        }
      } else {
        setSlashOpen(false);
      }

      // Save immediately — page.tsx handles debouncing
      const json = ed.getJSON() as Record<string, unknown>;
      const text = ed.getText();
      onUpdate(json, text);
    },
  });

  // Expose insertContent for external use (e.g., AI panel)
  useImperativeHandle(ref, () => ({
    insertContent: (text: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(text).run();
    },
  }), [editor]);

  // Image insertion (must be declared before executeSlashCommand)
  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor
          .chain()
          .focus()
          .setImage({ src: reader.result as string })
          .run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  // PDF insertion
  const addPdf = useCallback(() => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        editor.chain().insertContent({
          type: 'pdf',
          attrs: {
            src: reader.result as string,
            fileName: file.name,
          },
        }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  // Execute slash command
  const executeSlashCommand = useCallback(
    (cmd: SlashCommand) => {
      if (!editor) return;
      const { from } = editor.state.selection;
      const deleteLen = slashQuery.length + 1;
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - deleteLen, to: from })
        .run();

      if (cmd.name === "Imagen") {
        addImage();
      } else if (cmd.name === "PDF") {
        addPdf();
      } else if (cmd.action) {
        cmd.action(editor);
      }
      setSlashOpen(false);
    },
    [editor, slashQuery, addImage, addPdf]
  );

  // Close menus on click outside
  useEffect(() => {
    if (!slashOpen && !turnIntoOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-slash-menu]")) {
        setSlashOpen(false);
        setTurnIntoOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [slashOpen, turnIntoOpen]);

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className={cn("relative h-full", className)}>
      {/* ===== DRAG HANDLE (Notion-style: + and grip on left margin) ===== */}
      {editable && (
        <DragHandle editor={editor} nested={false}>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
              title="Añadir bloque"
              onMouseDown={(e) => {
                e.preventDefault();
                const { $from } = editor.state.selection;
                if ($from.parent.textContent === '') {
                  editor.chain().focus().insertContent('/').run();
                } else {
                  // Insert space + / at end of the current text
                  editor.chain().focus($from.end()).insertContent(' /').run();
                }
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
              title="Arrastrar bloque"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        </DragHandle>
      )}

      {/* ===== BUBBLE MENU (appears on text selection) ===== */}
      {editable && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ state }) => {
            const { empty } = state.selection;
            // Don't show in code blocks or tables
            if (editor.isActive("codeBlock")) return false;
            return !empty;
          }}
        >
          <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[#1e1e1e] border border-white/10 shadow-2xl">
            {/* Turn Into dropdown trigger */}
            <button
              type="button"
              className="flex items-center gap-1 h-7 px-2 rounded-md text-[13px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                const coords = editor.view.coordsAtPos(
                  editor.state.selection.from
                );
                setTurnIntoPos({
                  top: coords.bottom + 8,
                  left: coords.left,
                });
                setTurnIntoOpen(!turnIntoOpen);
              }}
            >
              <Type className="h-3.5 w-3.5" />
              <span className="text-[12px]">Convertir</span>
            </button>

            <div className="w-px h-4 bg-white/10" />

            {/* Inline formatting */}
            <TBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={Bold}
              label="Negrita"
            />
            <TBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={Italic}
              label="Cursiva"
            />
            <TBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              icon={UnderlineIcon}
              label="Subrayado"
            />
            <TBtn
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              icon={Strikethrough}
              label="Tachado"
            />
            <TBtn
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive("code")}
              icon={Code}
              label="Código"
            />
            <TBtn
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              icon={Highlighter}
              label="Resaltar"
            />

            <div className="w-px h-4 bg-white/10" />

            {/* Link */}
            {showLinkInput ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  type="text"
                  className="h-6 w-36 bg-white/10 border-none rounded px-2 text-[12px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addLink();
                    if (e.key === "Escape") setShowLinkInput(false);
                  }}
                  autoFocus
                />
                <button
                  className="h-6 px-2 rounded text-[11px] text-white bg-white/15 hover:bg-white/25"
                  onClick={addLink}
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <TBtn
                  onClick={() => setShowLinkInput(true)}
                  isActive={editor.isActive("link")}
                  icon={LinkIcon}
                  label="Enlace"
                />
                {editor.isActive("link") && (
                  <TBtn
                    onClick={() =>
                      editor.chain().focus().unsetLink().run()
                    }
                    icon={Unlink}
                    label="Quitar enlace"
                  />
                )}
              </>
            )}

            <div className="w-px h-4 bg-white/10" />

            {/* Color */}
            <div className="relative">
              <TBtn
                onClick={() => setShowColorPicker(!showColorPicker)}
                icon={Palette}
                label="Color"
              />
              {showColorPicker && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 rounded-lg bg-[#1e1e1e] border border-white/10 shadow-2xl z-50">
                  <div className="grid grid-cols-5 gap-1.5">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        title={`Color ${color}`}
                        className="h-5 w-5 rounded-full border border-white/10 hover:scale-125 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          editor.chain().focus().setColor(color).run();
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                  <button
                    className="w-full mt-1.5 text-[10px] text-white/50 hover:text-white/80 py-0.5 rounded hover:bg-white/5 transition"
                    onClick={() => {
                      editor.chain().focus().unsetColor().run();
                      setShowColorPicker(false);
                    }}
                  >
                    Quitar color
                  </button>
                </div>
              )}
            </div>
          </div>
        </BubbleMenu>
      )}

      {/* ===== EDITOR CONTENT ===== */}
      <EditorContent editor={editor} className="h-full" />

      {/* ===== TABLE CONTROLS (Notion-style: + on edges, right-click menu) ===== */}
      {editable && <TableControls editor={editor} />}

      {/* ===== SLASH COMMAND MENU ===== */}
      {slashOpen && filteredCommands.length > 0 && (
        <SlashMenu
          commands={filteredCommands}
          selectedIndex={slashIndex}
          onSelect={executeSlashCommand}
          position={slashPos}
        />
      )}

      {/* ===== TURN INTO DROPDOWN ===== */}
      {turnIntoOpen && (
        <TurnIntoDropdown
          editor={editor}
          onClose={() => setTurnIntoOpen(false)}
          position={turnIntoPos}
        />
      )}
    </div>
  );
});
