/**
 * Caracteres que não podem sair literais num script dentro de `<script>`: os
 * três do HTML e os separadores de linha U+2028 e U+2029, montados pelo código
 * para não ficarem invisíveis no arquivo.
 */
const UNSAFE = new RegExp(`[<>/${String.fromCharCode(0x2028, 0x2029)}]`, 'g');

/**
 * Escreve um valor como literal de JavaScript para um script que vai dentro de
 * `<script>`, no HTML. `JSON.stringify` sozinho não basta: um valor com
 * `</script>` ou `<!--` fecharia a tag e o resto viraria HTML, e U+2028 e U+2029
 * quebram scripts em motores antigos. Os cinco caracteres saem como `\uXXXX`,
 * que o JavaScript lê igual.
 */
export function scriptValue(value: unknown): string {
  const json = JSON.stringify(value) as string | undefined;
  if (json === undefined) throw new TypeError('Valor sem forma em JSON não entra em script.');
  return json.replace(UNSAFE, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
