-- Tabla: public
CREATE TABLE public.organizaciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255)
);

-- Tabla: public
CREATE TABLE public.congregacion (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  circuito VARCHAR(255),
  direccion VARCHAR(255),
  horario VARCHAR(255)
);

-- Tabla: public
CREATE TABLE public.bosquejos (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero INT,
  titulo VARCHAR(255)
);

-- Tabla: public
CREATE TABLE public.users (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  rol VARCHAR(255),
  congregacion_id INT,
  organizacion_id INT, -- Columna para la relación con organizaciones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tabla: public
CREATE TABLE public.autenticacion (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT UNIQUE, -- Clave foránea al usuario, con restricción UNIQUE
  hashed_password VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Tabla: public
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

-- Tabla: public
CREATE TABLE public.oradores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publicador_id INT,
  saliente BOOLEAN,
  organizacion_id INT,
  FOREIGN KEY (publicador_id) REFERENCES public.publicadores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tabla: public
CREATE TABLE public.arreglo (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE,
  bosquejo_id INT,
  orador_id INT,
  organizacion_id INT,
  FOREIGN KEY (bosquejo_id) REFERENCES public.bosquejos(id),
  FOREIGN KEY (orador_id) REFERENCES public.oradores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tabla: public
CREATE TABLE public.coordinadores (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  publicador_id INT,
  telefono VARCHAR(20),
  organizacion_id INT,
  FOREIGN KEY (publicador_id) REFERENCES public.publicadores(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);

-- Tabla: public
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

-- Tabla: public
CREATE TABLE public.configuraciones (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  congregacion_id INT,
  idioma VARCHAR(50),
  zona_horaria VARCHAR(50),
  formato_fecha VARCHAR(50),
  tema VARCHAR(50),
  organizacion_id INT,
  FOREIGN KEY (congregacion_id) REFERENCES public.congregacion(id),
  FOREIGN KEY (organizacion_id) REFERENCES public.organizaciones(id)
);