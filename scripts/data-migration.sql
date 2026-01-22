-- ===========================================
-- MIGRACIÓN DE DATOS - TAREAI
-- Usuario: b0fef19d-d170-4710-8f1e-c6e00d21e108
-- ===========================================

-- Insertar workspace
INSERT INTO workspaces (id, name, description, instructions, user_id, created_at, updated_at)
VALUES (
  'e8347c61-cd66-4121-8338-38d4c9078b16',
  'Ardanuy.info',
  'ERP de SYSTRA Ardanuy',
  E'ERP interno hecho con Laravel 11 para Ardanuy Ingeniería que centraliza operaciones críticas: comercial, ofertas, proyectos, producción/recursos, administración y RRHH, con reporting ejecutivo e IT/permisos.\n\nMódulos principales\n\n1) Área personal 👤\nRegistro de horas, vista de dedicación, calendario (vacaciones/teletrabajo) y "mi información" (datos, CV, idiomas, formación, visados).\n\n2) Comercial 💼\nGestión de contactos, empresas (cliente/proveedor) y oportunidades (pipeline). Tablas Livewire/PowerGrid con búsqueda + filtros y exportación Excel/CSV.\n\n3) Ofertas 📋\nCiclo completo de licitaciones por región (España, Internacional, Lituania, Andes/Colombia, Argelia, India).\nFunciones: alta y seguimiento OF-XXXX, estados, fechas clave, avales/pliegos, UTE, presupuestos multimoneda, referencias de proyectos, EOI/RFQ, histórico, búsqueda rápida. Exporta Excel/CSV/PDF.\n\n4) Proyectos 🚆\nGestión completa por vistas (actuales, terminados, por país, internos <P100, acuerdos marco, por sociedad del grupo).\nPor proyecto: ficha técnica, seguimiento económico (presupuesto, IVA/UTE, facturas emitidas/estimadas, costes, gastos), horas (por empleado/categoría/tarea), contratos/ampliaciones, documentación (certificados, informes, avales, fotos), hitos/tareas y referencias. Búsqueda por PXXXX o nombre. Muchísimas relaciones (modelo Proyecto con +35 tablas). Exporta certificados Word/PDF.\n\n5) Producción 🏭\nAsignación y control de recursos y carga: asistencia a reuniones, recursos disponibles, dedicación, demanda/horas, cambios de planificación y resúmenes por depto/proyecto/oficina/especialidad. Exporta Excel/CSV.\n\n6) Resultados 📊\nReporting económico: facturación mensual, contratación, resultados estimados y resumen consolidado por proyecto.\n\n7) Administración 💰\nGestión de facturación: listado/búsqueda de facturas, filtros, PDF de factura, cobros, items, contratantes y monedas/tipos de cambio. Exporta Excel/PDF.\n\n8) RRHH 👥\nBase de empleados (datos, contratos, categoría, CV, idiomas, formación, visados, competencias, experiencia, puesto, especialidades, ubicación) + colaboradores/visitantes. Flujos de vacaciones y teletrabajo con aprobación masiva e histórico. Exporta Excel/CSV.\n\n9) IT 💻\nGestión de roles/permisos (granular por sección), asignaciones usuario-rol, configuración de teletrabajo/vacaciones, plantillas de email y migración de usuarios.\n\n10) Certificaciones ✅ (ahora oculto)\nCalidad/ISO (9001/14001/45001) + inspección ISO 17020: procedimientos, formularios, no conformidades, gestión documental y notificaciones.\n\nArquitectura técnica (resumen)\n\nLaravel 11 (PHP 8.3)\n\nFront: Livewire 3, Alpine, Tailwind (y algo de Bootstrap legacy), PowerGrid, TomSelect\n\nBuild: Vite\n\nBD: PostgreSQL\n\nMulti: moneda, idioma (ES/EN), sociedad\n\nExtras: búsquedas rápidas en sidebar, exportaciones (Excel/CSV/PDF), toasts globales, modales Bootstrap, control de acceso con Gates/Policies.\n\nFlujo típico\n\nOportunidad → Oferta → Proyecto → Asignación de recursos → Registro de horas → Facturación → RRHH (vacaciones/teletrabajo) → Resultados/reporting → IT permisos/config.\n\n\nAl generar un Prompt para el IDE (NO para generar tareas) tienes que poner siempre al principio: Mirar el AGENTS.md, Puedes meterte en la base de datos para cualquier consulta o prueba',
  'b0fef19d-d170-4710-8f1e-c6e00d21e108',
  '2026-01-15T11:58:34.802Z',
  '2026-01-20T10:54:00.996Z'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  user_id = EXCLUDED.user_id,
  updated_at = EXCLUDED.updated_at;

-- Insertar al propietario como miembro del workspace
INSERT INTO workspace_members (workspace_id, user_id, role, status, invited_by)
VALUES (
  'e8347c61-cd66-4121-8338-38d4c9078b16',
  'b0fef19d-d170-4710-8f1e-c6e00d21e108',
  'owner',
  'accepted',
  'b0fef19d-d170-4710-8f1e-c6e00d21e108'
)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- Insertar tareas
INSERT INTO tasks (id, workspace_id, title, description, importance, completed, completed_at, in_review, reviewed_at, source, user_id, created_at, updated_at) VALUES
('77a57e0e-f8a7-4b22-a906-9af90816486b', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Añadir filtro por fecha y botón de imprimir PDF en la pantalla de Ofertas', 'En la pantalla de ofertas, incluir un campo de fecha en la parte superior y un botón "Imprimir" que genere un PDF con las ofertas desde la fecha seleccionada hasta la última fecha disponible.', 5, true, '2026-01-16T08:39:36.758Z', false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-15T14:03:38.884Z', '2026-01-16T08:39:36.758Z'),

('e82991bc-2059-4805-bf7c-be46a3e26f5a', 'e8347c61-cd66-4121-8338-38d4c9078b16', E'Corregir bug al crear una oferta: al seleccionar tipo \'OF\' no se aplica a la primera y obliga a seleccionar/deseleccionar', E'En el alta de ofertas, al escoger \'OF\' no se crea correctamente hasta que el usuario lo cambia y lo vuelve a seleccionar (parece que el valor no se registra o no dispara el evento inicial).', 6, true, '2026-01-16T10:30:00.101Z', false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-15T14:24:39.903Z', '2026-01-16T10:30:00.101Z'),

('c01a35a1-c139-4e38-8d76-62f9dd5e7628', 'e8347c61-cd66-4121-8338-38d4c9078b16', E'Revisar y corregir facturaciones/cobros: estado \'cobrado\' incorrecto y cobros independientes no se guardan', E'En Administración/Facturación: no se marca como \'cobrado\' cuando sí lo está y además no se están guardando los cobros independientes.', 7, false, NULL, true, '2026-01-16T10:30:12.710Z', 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-15T14:24:39.903Z', '2026-01-16T10:30:12.710Z'),

('db64cc13-09b6-44b3-8f6f-934402f332c9', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Crear migración de empleados de SYSTRA y Subterra', 'Incorporar al ERP los registros de empleados procedentes de ambas organizaciones.', 9, false, NULL, true, '2026-01-20T10:29:11.343Z', 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T08:35:35.737Z', '2026-01-20T10:29:11.343Z'),

('f1315223-d966-48c3-b97a-8c153478b5d8', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Crear migración de proyectos de SYSTRA y Subterra', 'Migrar los proyectos asociados desde los sistemas de origen al módulo de Proyectos del ERP.', 8, false, NULL, false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T08:35:35.737Z', '2026-01-16T08:41:07.457Z'),

('764b4d68-f36a-447a-918a-3e3d3690c35e', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Crear migración de facturas de SYSTRA y Subterra', 'Migrar facturas y su información relacionada al módulo de Administración/Facturación del ERP.', 6, false, NULL, false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T08:35:35.737Z', '2026-01-16T08:35:35.737Z'),

('0d803616-0454-46f1-8bab-ba01eadd64a8', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Añadir botón de búsqueda para acceder a un proyecto por número (además de Enter)', 'Ahora hay que escribir el número y pulsar Intro, pero no hay botón de buscar como en el info actual; se pide para hacerlo más evidente.', 4, true, '2026-01-16T09:53:22.201Z', false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:12:10.056Z', '2026-01-16T09:53:22.201Z'),

('b8ff8f65-cd7b-4ddc-9aba-0879d8de879b', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Corregir resaltado/navegación de pestañas de proyecto (Clasificación/Costes marcadas como General y sin cambiar al pulsar)', E'En la pestaña "Clasificación" se marca como activa "General" y al pulsar "General" no cambia de pestaña. Ha pasado también en "Costes", pero de forma intermitente.', 6, true, '2026-01-16T11:10:54.084Z', false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:12:10.056Z', '2026-01-16T11:10:54.084Z'),

('354fb973-5f26-47dd-9d98-ea3defe8c517', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Restaurar mensaje de confirmación al guardar costes directos', 'Los costes directos se guardan, pero no aparece el mensaje de confirmación tras guardar.', 5, false, NULL, true, '2026-01-16T12:45:53.367Z', 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:12:10.056Z', '2026-01-16T12:45:53.367Z'),

('88b99fda-dabc-4cae-8300-810b43eb135d', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Mostrar aviso consistente cuando no se puede guardar un informe por datos incompletos', E'En la pestaña "Informes", al crear un informe y faltar campos, al pulsar "guardar informe" a veces no avisa y parece que se hubiera guardado; el comportamiento es inconsistente (a veces avisa y a veces no).', 6, true, '2026-01-18T18:54:47.111Z', false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:12:10.056Z', '2026-01-18T18:54:47.111Z'),

('fc206a47-88d2-4c9e-85ab-f35a73f28e97', 'e8347c61-cd66-4121-8338-38d4c9078b16', E'Aclarar o ajustar el flujo de guardado en Informes (botón \'Guardar informe\' vs \'Guardar toda la página\')', E'Al introducir un nuevo informe aparecen dos botones: guardar informe y guardar toda la página. Se pregunta si hay que guardar primero el informe y luego toda la página, o si debería simplificarse/explicarse.', 4, false, NULL, false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:12:10.056Z', '2026-01-16T09:12:10.056Z'),

('784a89c2-5caf-4f06-8f8f-c8e6dac3abc6', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Restaurar el autocompletado de la fecha de cobro en facturas', 'La fecha de cobro de la factura se rellenaba automáticamente y ha dejado de hacerlo; revisar el comportamiento anterior y corregirlo para que vuelva a autocompletarse.', 6, false, NULL, true, '2026-01-18T19:02:56.469Z', 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-16T09:31:50.724Z', '2026-01-18T19:02:56.469Z'),

('74e20dc1-8cdd-433a-a465-04584841f8cc', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Doble guardado en los formularios, habilitar', '', 8, false, NULL, true, '2026-01-20T10:46:45.555Z', 'manual', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-18T18:54:29.632Z', '2026-01-20T10:46:45.555Z'),

('5f477794-56f7-4e6a-90fe-829c4d0d983d', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Mostrar correctamente el nombre de las facturas en la tabla (igual que en la edición)', 'En el listado/tabla de facturas, ajustar el campo/columna de nombre para que se visualice con el mismo formato/valor que se muestra en la pantalla de edición de factura.', 5, false, NULL, false, NULL, 'ai', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-18T18:56:06.911Z', '2026-01-18T18:56:06.911Z'),

('a54d8dd3-1a16-4b8d-b3b3-a6096ec5833f', 'e8347c61-cd66-4121-8338-38d4c9078b16', 'Revisar el date input, formato y funcionalidad', '', 10, false, NULL, false, NULL, 'manual', 'b0fef19d-d170-4710-8f1e-c6e00d21e108', '2026-01-18T19:09:09.176Z', '2026-01-18T19:09:09.176Z')

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  importance = EXCLUDED.importance,
  completed = EXCLUDED.completed,
  completed_at = EXCLUDED.completed_at,
  in_review = EXCLUDED.in_review,
  reviewed_at = EXCLUDED.reviewed_at,
  source = EXCLUDED.source,
  user_id = EXCLUDED.user_id,
  updated_at = EXCLUDED.updated_at;
