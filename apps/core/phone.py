"""Shared Pakistani mobile-number validation.

Single source of truth for phone validation across the platform (shelters,
accounts, lost & found, …). A valid number is a Pakistani mobile in the
canonical form ``+923XXXXXXXXX`` — a recognised 3-digit network code (the
"3XX" after +92) followed by 7 digits.
"""
import re

from rest_framework import serializers

# Valid Pakistani mobile network codes (the 3-digit "3XX" that follows +92).
PK_MOBILE_PREFIXES = {
    # Jazz (Mobilink / Warid)
    '300', '301', '302', '303', '304', '305', '306', '307', '308', '309',
    '320', '321', '322', '323', '324', '325', '326', '327', '328', '329',
    # Zong
    '310', '311', '312', '313', '314', '315', '316', '317', '318', '319',
    # Ufone
    '330', '331', '332', '333', '334', '335', '336', '337',
    # Telenor
    '340', '341', '342', '343', '344', '345', '346', '347', '348', '349',
    # SCOM
    '355',
}


def normalize_pk_mobile(value):
    """Return the canonical ``+923XXXXXXXXX`` form of a Pakistani mobile number.

    Accepts common input forms (+923001234567, 923001234567, 03001234567,
    3001234567). Raises ``ValueError`` if the number is not a valid Pakistani
    mobile number with a recognised network code.
    """
    digits = re.sub(r'\D', '', value or '')
    if digits.startswith('92'):
        national = digits[2:]
    elif digits.startswith('0'):
        national = digits[1:]
    else:
        national = digits
    if len(national) != 10 or not national.startswith('3'):
        raise ValueError("Enter a valid Pakistani mobile number in the form +92 3XX XXXXXXX.")
    if national[:3] not in PK_MOBILE_PREFIXES:
        raise ValueError("Unrecognised mobile network code. Please choose a valid one.")
    return f"+92{national}"


def validate_pk_mobile(value, *, required=True):
    """DRF field-validator helper.

    Returns the normalized number, or the original (empty) value when the field
    is optional and blank. Raises ``serializers.ValidationError`` otherwise.
    """
    if value in (None, ''):
        if required:
            raise serializers.ValidationError("A contact phone number is required.")
        return value
    try:
        return normalize_pk_mobile(value)
    except ValueError as exc:
        raise serializers.ValidationError(str(exc))


def normalize_pk_landline(value):
    """Return a canonical Pakistani landline (digits only), e.g. '0511234567'.

    Format: leading 0 + area (STD) code + subscriber number, 10 or 11 digits
    total. Mobiles (which start with 03) are rejected here.
    """
    digits = re.sub(r'\D', '', value or '')
    if digits and not digits.startswith('0'):
        digits = '0' + digits
    if digits.startswith('03'):
        raise ValueError("That looks like a mobile number, not a landline.")
    if not re.fullmatch(r'0\d{9,10}', digits):
        raise ValueError("Enter a valid Pakistani landline (area code + number).")
    return digits


def normalize_pk_phone(value):
    """Accept either a PK mobile or a PK landline; return its canonical form."""
    try:
        return normalize_pk_mobile(value)
    except ValueError:
        return normalize_pk_landline(value)


def validate_pk_phone(value, *, required=True):
    """DRF validator accepting a PK mobile (+923XXXXXXXXX) or a PK landline."""
    if value in (None, ''):
        if required:
            raise serializers.ValidationError("A contact phone number is required.")
        return value
    try:
        return normalize_pk_phone(value)
    except ValueError:
        raise serializers.ValidationError(
            "Enter a valid Pakistani mobile (+92 3XX XXXXXXX) or landline (area code + number).")
