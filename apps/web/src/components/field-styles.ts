/** Input look from the design (docs/design/README.md): 48 px, 12 px radius, brand focus ring. */
export function inputClass(invalid: boolean, withTrailingButton = false): string {
  return [
    'h-12 w-full rounded-xl border px-3.5 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow]',
    'focus:border-brand focus:shadow-[0_0_0_3px_rgba(29,92,76,.14)]',
    withTrailingButton ? 'pe-[72px]' : '',
    invalid ? 'border-danger-line bg-danger-field' : 'border-line bg-surface',
  ].join(' ');
}
