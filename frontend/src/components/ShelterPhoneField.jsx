import { useState } from 'react';
import PhoneInput, { isValidPkMobile } from './PhoneInput';

/**
 * ShelterPhoneField — a shelter contact number that can be either a Pakistani
 * mobile (+92 3XX XXXXXXX) or a landline. For a landline the STD area code is
 * locked to the selected city (e.g. 051 for Islamabad/Rawalpindi).
 *
 * The composed value is stored as:
 *   mobile   -> "+923XXXXXXXXX"
 *   landline -> "0<areacode><subscriber>"  (digits only, e.g. "0511234567")
 */

// City -> landline STD area code (includes the leading 0).
export const CITY_LANDLINE_CODES = {
  Karachi: '021', Lahore: '042', Islamabad: '051', Rawalpindi: '051',
  Faisalabad: '041', Multan: '061', Peshawar: '091', Quetta: '081',
  Hyderabad: '022', Gujranwala: '055', Sialkot: '052', Bahawalpur: '062',
  Sargodha: '048', Sukkur: '071', Larkana: '074', Sheikhupura: '056',
  Abbottabad: '0992', Mardan: '0937', Mingora: '0946', Gujrat: '053',
  Sahiwal: '040', 'Wah Cantonment': '051', 'Dera Ghazi Khan': '064',
  Nawabshah: '0244', 'Mirpur Khas': '0233',
};

/** A valid PK landline: leading 0, 10–11 digits total, and not a mobile (03…). */
export function isValidPkLandline(value) {
  const d = String(value || '').replace(/\D/g, '');
  return /^0\d{9,10}$/.test(d) && !d.startsWith('03');
}

/** Accept a PK mobile OR a PK landline. */
export function isValidPkPhone(value) {
  return isValidPkMobile(value) || isValidPkLandline(value);
}

export default function ShelterPhoneField({ cityName, value, onChange, error }) {
  const knownCode = CITY_LANDLINE_CODES[cityName] || '';
  const [manualCode, setManualCode] = useState('');
  const [emptyMode, setEmptyMode] = useState('mobile'); // used only when value is empty

  const digits = String(value || '').replace(/\D/g, '');
  const looksLandline = digits && digits.startsWith('0') && !digits.startsWith('03');
  const mode = digits ? (looksLandline ? 'landline' : 'mobile') : emptyMode;

  const areaCode = knownCode || (manualCode ? (manualCode.startsWith('0') ? manualCode : `0${manualCode}`) : '');

  // Subscriber = landline digits with the area code (or leading 0) removed.
  let subscriber = '';
  if (mode === 'landline' && digits.startsWith('0')) {
    subscriber = areaCode && digits.startsWith(areaCode)
      ? digits.slice(areaCode.length)
      : digits.replace(/^0/, '');
  }

  const errBorder = error ? { borderColor: 'var(--cat-red)' } : undefined;

  const emitLandline = (code, sub) => {
    const c = code ? (code.startsWith('0') ? code : `0${code}`) : '';
    const s = String(sub).replace(/\D/g, '').slice(0, 8);
    onChange(c ? `${c}${s}` : (s ? `0${s}` : ''));
  };

  const switchMode = (m) => {
    setEmptyMode(m);
    setManualCode('');
    onChange(''); // clear so mobile/landline formats never mix
  };

  const toggleBtn = (m, label) => (
    <button
      key={m}
      type="button"
      onClick={() => switchMode(m)}
      style={{
        padding: '0.4rem 0.9rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
        border: `1.5px solid ${mode === m ? 'var(--cat-terra)' : 'var(--border-default)'}`,
        background: mode === m ? 'var(--cat-terra)' : 'var(--surface-card)',
        color: mode === m ? 'white' : 'var(--text-secondary)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {toggleBtn('mobile', '📱 Mobile')}
        {toggleBtn('landline', '☎️ Landline')}
      </div>

      {mode === 'mobile' ? (
        <PhoneInput value={value} onChange={onChange} error={error} id="shelter-phone" />
      ) : (
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'stretch' }}>
          {knownCode ? (
            <span
              title={cityName ? `Landline area code for ${cityName}` : 'Landline area code'}
              style={{
                display: 'flex', alignItems: 'center', padding: '0 0.7rem', borderRadius: '8px',
                border: '1px solid var(--border-default)', background: 'var(--cat-linen)',
                fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
              }}
            >
              ☎️ {knownCode}
            </span>
          ) : (
            <input
              className="input-base"
              style={{ width: '92px', flex: '0 0 auto', ...errBorder }}
              type="tel"
              inputMode="numeric"
              maxLength={5}
              value={manualCode}
              onChange={(e) => {
                const c = e.target.value.replace(/\D/g, '').slice(0, 5);
                setManualCode(c);
                emitLandline(c, subscriber);
              }}
              placeholder="Area (051)"
            />
          )}
          <input
            className="input-base"
            style={{ flex: 1, minWidth: 0, ...errBorder }}
            type="tel"
            inputMode="numeric"
            maxLength={8}
            value={subscriber}
            onChange={(e) => emitLandline(areaCode, e.target.value)}
            placeholder="1234567"
          />
        </div>
      )}
    </div>
  );
}
