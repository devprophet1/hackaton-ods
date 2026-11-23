-- Dirección opcional de la persona que reporta (solo si desactiva el anonimato y decide darla).
-- En el panel se muestra oculta hasta «Mostrar» (acceso registrado) y nunca se envía al análisis de IA.
alter table persons add column if not exists address text;
