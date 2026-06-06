// Tipos compartidos en toda la app. Reflejan las tablas de supabase/schema.sql

export type Miembro = {
  id: string;
  nombre: string;
  empresa: string | null;
  giro: string;
  categoria: string;
  activo: boolean;
  orden: number;
  created_at: string;
};

export type Segmento = {
  id: string;
  titulo: string;
  expositor: string | null;
  tema: string | null;
  fecha: string; // ISO date (YYYY-MM-DD)
  resumen: string | null;
  transcript: string | null;
  ideas_clave: string | null;
  slides_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  publicado: boolean;
  created_at: string;
};

export type Aplicacion = {
  id: string;
  segmento_id: string;
  categoria: string;
  contenido: string;
  created_at: string;
};

export type AlbumEstampa = {
  id: string;
  miembro_id: string;
  objetivo_miembro_id: string;
  foto_url: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};
