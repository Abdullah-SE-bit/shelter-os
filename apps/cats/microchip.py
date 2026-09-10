"""ISO 11784/11785 (FDX-B) microchip number generation.

Real pet microchips are 15 decimal digits: a 3-digit country/manufacturer code
followed by a 12-digit unique national identification number. This module is the
single source of truth for generating standards-compliant, database-unique
15-digit microchip numbers.

It is intended to be swapped for — or supplemented by — a physical microchip
writer/scanner device in the future without changing the cat-creation flow (see
``MicrochipGenerateView`` in ``apps.cats.views``).
"""
import random

# ISO 11784/11785 "shared manufacturer" code range is 900-998. 999 is reserved
# for test/temporary transponders, so it is intentionally excluded here.
_MANUFACTURER_CODE_MIN = 900
_MANUFACTURER_CODE_MAX = 998
_MAX_ATTEMPTS = 25


def generate_microchip_id():
    """Return a unique 15-digit ISO 11784/11785 microchip number.

    Format: ``<3-digit manufacturer code><12-digit national id>`` (15 digits).
    Guaranteed not to collide with an existing ``Cat.microchip_id``.

    Raises:
        RuntimeError: if a unique number could not be produced after several
            attempts (astronomically unlikely in practice).
    """
    from .models import Cat

    for _ in range(_MAX_ATTEMPTS):
        manufacturer = random.randint(_MANUFACTURER_CODE_MIN, _MANUFACTURER_CODE_MAX)
        national_id = random.randint(0, 999_999_999_999)  # up to 12 digits
        candidate = f"{manufacturer:03d}{national_id:012d}"
        if not Cat.objects.filter(microchip_id=candidate).exists():
            return candidate

    raise RuntimeError("Unable to generate a unique microchip ID; please retry.")
