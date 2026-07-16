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

export type PerfilMiembro = {
  id: string;
  miembro_id: string;
  usuario: string;
  foto_url: string | null;
  foto_storage_path: string | null;
  logo_empresa_url: string | null;
  logo_empresa_storage_path: string | null;
  color_principal: string | null;
  link_formato_uno_a_uno: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  pagina_web_url: string | null;
  acerca_de_mi: string | null;
  mascotas: string | null;
  familia: string | null;
  pasatiempos: string | null;
  otros_intereses: string | null;
  ciudad: string | null;
  trabajos_anteriores: string | null;
  habilidades: string | null;
  objetivos: string | null;
  redes: string | null;
  logros: string | null;
  intereses: string | null;
  created_at: string;
  updated_at: string;
};

export type PerfilListaTipo =
  | "clientes_buscados"
  | "contactos"
  | "mejores_clientes";

export type PerfilListaItem = {
  id: string;
  perfil_id: string;
  tipo: PerfilListaTipo;
  contenido: string;
  orden: number;
  created_at: string;
};

export type PerfilPublico = {
  miembro: Miembro;
  perfil: PerfilMiembro;
  listas: Record<PerfilListaTipo, PerfilListaItem[]>;
};
