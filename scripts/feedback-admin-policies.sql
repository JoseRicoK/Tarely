-- Políticas adicionales para que el admin pueda ver, actualizar y eliminar todo el feedback

-- Admin puede ver todo el feedback
CREATE POLICY "Admin can view all feedback"
  ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

-- Admin puede actualizar cualquier feedback
CREATE POLICY "Admin can update any feedback"
  ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );

-- Admin puede eliminar cualquier feedback
CREATE POLICY "Admin can delete any feedback"
  ON feedback
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'josemariark@gmail.com'
    )
  );
