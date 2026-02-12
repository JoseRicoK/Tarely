"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Note } from "@/lib/types";
import { NoteCard } from "./NoteCard";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export function NotesList({ notes, selectedNoteId, onSelectNote }: NotesListProps) {
  if (notes.length === 0) return null;

  return (
    <div className="grid gap-2">
      <AnimatePresence mode="popLayout">
        {notes.map((note) => (
          <motion.div
            key={note.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <NoteCard
              note={note}
              isSelected={selectedNoteId === note.id}
              onClick={() => onSelectNote(note.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
