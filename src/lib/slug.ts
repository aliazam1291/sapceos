/** Shared by the server-rendered report sections and the client-side nav. */
export const sectionSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
