/**
 * PhoneInput — Pakistani mobile number field.
 *
 * Renders a fixed 🇵🇰 +92 prefix, a network-code <select> (grouped by network),
 * and a 7-digit input. The composed value is always "+92<code><7 digits>" (or
 * "" when empty). Use the exported helpers for validation.
 *
 * Props:
 *   value:     current phone string (e.g. "+923001234567" or "")
 *   onChange:  (value: string) => void   // receives the composed string
 *   error:     truthy to show an error border
 *   id:        optional id for the digits input
 *   disabled:  optional
 */

// Pakistani mobile network codes (the 3-digit "3XX" after +92), grouped by network.
export const PK_NETWORKS = [
  { name: 'Jazz',    prefixes: ['300','301','302','303','304','305','306','307','308','309','320','321','322','323','324','325','326','327','328','329'] },
  { name: 'Zong',    prefixes: ['310','311','312','313','314','315','316','317','318','319'] },
  { name: 'Ufone',   prefixes: ['330','331','332','333','334','335','336','337'] },
  { name: 'Telenor', prefixes: ['340','341','342','343','344','345','346','347','348','349'] },
  { name: 'SCOM',    prefixes: ['355'] },
];

const VALID_PREFIXES = new Set(PK_NETWORKS.flatMap((n) => n.prefixes));

/** Split a stored phone value into { prefix, local } (handles +92 / 0 / bare forms). */
export function parsePkMobile(value) {
  let d = String(value ?? '').replace(/\D/g, '');
  if (d.startsWith('92')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return { prefix: d.slice(0, 3), local: d.slice(3, 10) };
}

/** Build the canonical +92 value from parts; "" when both are empty. */
export function composePkMobile(prefix, local) {
  const p = String(prefix || '').replace(/\D/g, '').slice(0, 3);
  const l = String(local || '').replace(/\D/g, '').slice(0, 7);
  return p || l ? `+92${p}${l}` : '';
}

/** True when the value is a complete, valid Pakistani mobile number. */
export function isValidPkMobile(value) {
  const { prefix, local } = parsePkMobile(value);
  return VALID_PREFIXES.has(prefix) && /^\d{7}$/.test(local);
}

/** True when the field is effectively empty (nothing entered). */
export function isEmptyPkMobile(value) {
  const { prefix, local } = parsePkMobile(value);
  return !prefix && !local;
}

export default function PhoneInput({ value, onChange, error, id, disabled }) {
  const { prefix, local } = parsePkMobile(value);
  const errBorder = error ? { borderColor: 'var(--pet-red)' } : undefined;

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 0.7rem',
          borderRadius: '8px',
          border: '1px solid var(--border-default)',
          background: 'var(--pet-linen)',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        🇵🇰 +92
      </span>
      <select
        className="input-base"
        style={{ width: 'auto', flex: '0 0 auto', ...errBorder }}
        value={prefix}
        disabled={disabled}
        onChange={(e) => onChange(composePkMobile(e.target.value, local))}
      >
        <option value="">Code</option>
        {PK_NETWORKS.map((net) => (
          <optgroup key={net.name} label={net.name}>
            {net.prefixes.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <input
        className="input-base"
        style={{ flex: 1, minWidth: 0, ...errBorder }}
        type="tel"
        inputMode="numeric"
        maxLength={7}
        id={id}
        disabled={disabled}
        value={local}
        onChange={(e) => onChange(composePkMobile(prefix, e.target.value))}
        placeholder="1234567"
      />
    </div>
  );
}
