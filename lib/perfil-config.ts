import type { PerfilListaTipo } from "@/lib/types";

export const CAMPOS_PERFIL_LIMITES = {
  link_formato_uno_a_uno: 500,
  facebook_url: 500,
  instagram_url: 500,
  linkedin_url: 500,
  pagina_web_url: 500,
  telefono_contacto: 40,
  acerca_de_mi: 500,
  mascotas: 180,
  familia: 180,
  pasatiempos: 180,
  otros_intereses: 180,
  ciudad: 120,
  trabajos_anteriores: 220,
  habilidades: 400,
  objetivos: 400,
  redes: 400,
  logros: 400,
  intereses: 400,
} as const;

export type CampoPerfilEditable = keyof typeof CAMPOS_PERFIL_LIMITES;

export const CAMPOS_PERFIL_URL: CampoPerfilEditable[] = [
  "link_formato_uno_a_uno",
  "facebook_url",
  "instagram_url",
  "linkedin_url",
  "pagina_web_url",
];

export const TIPOS_LISTA_PERFIL: PerfilListaTipo[] = [
  "clientes_buscados",
  "contactos",
  "mejores_clientes",
];

export const USUARIOS_RESERVADOS = new Set([
  "admin",
  "album",
  "api",
  "historial",
  "inicio",
  "invitados",
  "perfil",
  "segmentos",
  "opengraph-image",
  "twitter-image",
]);
