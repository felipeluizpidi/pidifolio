/** "Project {n}" + { n: "02" } → "Project 02". Dictionary templates stay plain strings so they can cross the server/client boundary. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}
