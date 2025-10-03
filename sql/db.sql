-- Tablas Maestras (Globales)
CREATE TABLE public.organizaciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  codigo VARCHAR(15) UNIQUE CHECK (codigo ~ '^[a-zA-Z0-9]{1,15}$')
);

CREATE TABLE public.congregacion ( -- Catálogo de Congregaciones
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  circuito VARCHAR(255),
  direccion VARCHAR(255),
  horario VARCHAR(255)
);

CREATE TABLE public.bosquejos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero INT,
  titulo VARCHAR(255)
);

-- Tablas de Usuarios y Personas
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  password TEXT NOT NULL,
  congregacion_id INT, 
  organizacion_id INT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_congregacion FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  CONSTRAINT fk_organizacion FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

CREATE TABLE public.publicadores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  edad INT,
  bautizado BOOLEAN,
  privilegio_servicio VARCHAR(255),
  responsabilidad VARCHAR(255),
  congregacion_id INT, 
  organizacion_id INT, 
  FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

CREATE TABLE public.oradores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publicador_id INT,
  saliente BOOLEAN,
  organizacion_id INT, 
  FOREIGN KEY (publicador_id) REFERENCES public.publicadores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tablas de Coordinación, Eventos y Configuración

CREATE TABLE public.coordinadores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publicador_id INT,
  telefono VARCHAR(20),
  organizacion_id INT, 
  FOREIGN KEY (publicador_id) REFERENCES public.publicadores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- TABLA 'eventos' (Visibilidad por Congregación y Organización)
CREATE TABLE public.eventos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_fin TIMESTAMP WITH TIME ZONE,
  congregacion_id INT, 
  organizacion_id INT, 
  FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- TABLA 'configuraciones' (Única por la dupla Organización-Congregación)
CREATE TABLE public.configuraciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  congregacion_id INT NOT NULL, 
  idioma VARCHAR(50),
  zona_horaria VARCHAR(50),
  formato_fecha VARCHAR(50),
  tema VARCHAR(50),
  organizacion_id INT, 
  UNIQUE (organizacion_id, congregacion_id),
  FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tablas de Programación

-- 1. Contenedor de Sesión/Día de Arreglos
CREATE TABLE public.programa (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL,
  organizacion_id INT, 
  tipo VARCHAR(50),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- 2. El Arreglo individual (vinculado a un programa)
CREATE TABLE public.arreglo (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  programa_id INT, -- NUEVA FK
  bosquejo_id INT,
  orador_id INT,
  tipo_movimiento VARCHAR(50), -- 'Saliente', 'Entrante'
  congregacion_destino_id INT,
  descripcion TEXT,
  organizacion_id INT, 
  FOREIGN KEY (programa_id) REFERENCES public.programa(id),
  FOREIGN KEY (bosquejo_id) REFERENCES public.bosquejos(id),
  FOREIGN KEY (orador_id) REFERENCES public.oradores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id),
  FOREIGN KEY (congregacion_destino_id) REFERENCES public.congregacion(id)
);