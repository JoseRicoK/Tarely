-- Tabla para almacenar las entradas del changelog
CREATE TABLE IF NOT EXISTS changelog (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para las secciones dentro de cada entrada del changelog
CREATE TABLE IF NOT EXISTS changelog_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  changelog_id UUID NOT NULL REFERENCES changelog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para los items (bullet points) dentro de cada sección
CREATE TABLE IF NOT EXISTS changelog_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES changelog_sections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_changelog_date ON changelog(date DESC);
CREATE INDEX IF NOT EXISTS idx_changelog_version ON changelog(version);
CREATE INDEX IF NOT EXISTS idx_changelog_sections_changelog_id ON changelog_sections(changelog_id);
CREATE INDEX IF NOT EXISTS idx_changelog_sections_sort ON changelog_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_changelog_items_section_id ON changelog_items(section_id);
CREATE INDEX IF NOT EXISTS idx_changelog_items_sort ON changelog_items(sort_order);

-- RLS
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_items ENABLE ROW LEVEL SECURITY;

-- Políticas: Cualquier usuario autenticado puede leer el changelog (es público)
CREATE POLICY "Anyone can read changelog"
  ON changelog FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read changelog sections"
  ON changelog_sections FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read changelog items"
  ON changelog_items FOR SELECT
  USING (true);

-- Políticas: Solo admin puede insertar/actualizar/eliminar
-- (se gestiona desde el backend con service role o comprobación de email)
CREATE POLICY "Admin can insert changelog"
  ON changelog FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can update changelog"
  ON changelog FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can delete changelog"
  ON changelog FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can insert changelog sections"
  ON changelog_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can update changelog sections"
  ON changelog_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can delete changelog sections"
  ON changelog_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can insert changelog items"
  ON changelog_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can update changelog items"
  ON changelog_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

CREATE POLICY "Admin can delete changelog items"
  ON changelog_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

-- Comentarios
COMMENT ON TABLE changelog IS 'Entradas principales del changelog (versión + fecha)';
COMMENT ON TABLE changelog_sections IS 'Secciones dentro de cada entrada (título + imagen opcional)';
COMMENT ON TABLE changelog_items IS 'Items/bullet points dentro de cada sección';
