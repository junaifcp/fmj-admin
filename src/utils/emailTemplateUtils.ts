/**
 * Extract Handlebars variables from HTML and subject
 * Returns array of unique variable names found in {{variable}} patterns
 */
export function extractVariablesFromTemplate(
  htmlBody: string,
  subject: string = ""
): string[] {
  const variables = new Set<string>();

  // Match {{variable}} and {{{variable}}} patterns
  const handlebarsPattern = /\{\{+(\w+)\}+/g;

  // Search in both HTML body and subject
  const htmlMatches = [...htmlBody.matchAll(handlebarsPattern)];
  const subjectMatches = [...subject.matchAll(handlebarsPattern)];
  const allMatches = [...htmlMatches, ...subjectMatches];

  for (const match of allMatches) {
    if (
      match[1] &&
      !match[1].startsWith("#") &&
      !match[1].startsWith("/") &&
      match[1] !== "if" &&
      match[1] !== "each" &&
      match[1] !== "else" &&
      match[1] !== "unless" &&
      match[1] !== "with"
    ) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables).sort();
}
