import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Tag, Plus } from 'lucide-react';
import { sheltersApi } from '@/api/sheltersApi';
import { authApi } from '@/api/authApi';
import { coreApi } from '@/api/coreApi';
import useApi from '@/hooks/useApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import MapLocationPicker from '@/components/MapLocationPicker';
import PhoneInput, { isValidPkMobile } from '@/components/PhoneInput';
import ShelterPhoneField, { isValidPkPhone } from '@/components/ShelterPhoneField';
import Modal from '@/components/Modal';
import PageHeader from '@/components/patterns/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{children}</p>;
}

export default function CreateShelterPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [ownerError, setOwnerError] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [form, setForm] = useState({
    name: '', street: '', city: '', country: 'Pakistan', phone: '', email: '', website: '',
    capacity_total: '', admin: '', description: '', latitude: '', longitude: '',
  });

  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useApi(() =>
    authApi.listUsers({ role: 'SHELTER_ADMIN' }),
  );
  const users = (usersData || []).filter((u) => !u.assigned_shelter_id);

  const { data: citiesData } = useApi(() => coreApi.getLookup('CITIES'));
  const cities = Array.isArray(citiesData) ? citiesData : (citiesData?.results || []);

  const selectedCity = cities.find((c) => c.display_label === form.city) || null;
  const cityCenter = selectedCity?.metadata && selectedCity.metadata.lat != null
    ? { lat: selectedCity.metadata.lat, lng: selectedCity.metadata.lng, radius_km: selectedCity.metadata.radius_km || 45 }
    : null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    if (!isValidPkMobile(ownerForm.phone)) {
      setOwnerError('Enter a valid Pakistani mobile number for the shelter admin.');
      return;
    }
    setOwnerSaving(true);
    setOwnerError('');
    try {
      const res = await authApi.createAdminUser({ ...ownerForm, role: 'SHELTER_ADMIN' });
      await refetchUsers();
      const newUserId = res.data?.data?.user_id || res.data?.user_id;
      setForm((prev) => ({ ...prev, admin: newUserId }));
      setOwnerOpen(false);
      setOwnerForm({ email: '', password: '', first_name: '', last_name: '', phone: '' });
    } catch (err) {
      setOwnerError(err.response?.data?.error?.message || 'Failed to create shelter admin.');
    } finally {
      setOwnerSaving(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Shelter name is required.';
    if (!form.city) errs.city = 'Please select a city.';
    const cap = parseInt(form.capacity_total);
    if (!cap || cap <= 0) errs.capacity_total = 'Capacity must be a positive number.';
    if (!isValidPkPhone(form.phone)) errs.phone = 'Enter a valid Pakistani mobile or landline number.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (form.website && !/^https?:\/\/.+/.test(form.website)) errs.website = 'Website must start with http:// or https://';
    if (form.latitude === '' || form.longitude === '' || form.latitude == null || form.longitude == null) {
      errs.location = 'Please pick the shelter location on the map.';
    } else if (cityCenter) {
      const d = distanceKm(cityCenter.lat, cityCenter.lng, parseFloat(form.latitude), parseFloat(form.longitude));
      if (d > cityCenter.radius_km) errs.location = `The selected location must be within ${form.city}.`;
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const data = {
        ...form,
        capacity_total: parseInt(form.capacity_total) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        admin: form.admin || null,
      };
      await sheltersApi.create(data);
      navigate('/shelters');
    } catch (error) {
      const detail = error.response?.data?.error?.details;
      if (detail && typeof detail === 'object') {
        const mapped = {};
        Object.entries(detail).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v.join(', ') : String(v); });
        setErrors(mapped);
        setGeneralError('Please fix the highlighted fields.');
      } else {
        setGeneralError(error.response?.data?.error?.message || 'Failed to create shelter. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[860px] px-4 py-6 sm:px-6">
      <PageHeader title="Create new shelter" description="Add a new shelter to the Shelter OS network" backTo="/shelters" backLabel="Shelters" />

      {usersLoading ? (
        <LoadingSpinner text="Loading…" />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {generalError && <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{generalError}</div>}

          <Card>
            <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shelter-name">Shelter name *</Label>
                  <Input id="shelter-name" required value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Happy Paws Shelter" className="mt-1.5" aria-invalid={!!errors.name} />
                  <FieldError>{errors.name}</FieldError>
                </div>
                <div>
                  <Label>Registration number</Label>
                  <div className="mt-1.5 flex h-9 items-center gap-2 rounded-md border border-dashed border-border bg-surface-muted px-3 text-sm text-muted-foreground">
                    <Tag className="size-3.5" />
                    Auto-generated on creation
                  </div>
                </div>
                <div>
                  <Label htmlFor="shelter-city">City *</Label>
                  <NativeSelect id="shelter-city" required value={form.city} onChange={(e) => handleChange('city', e.target.value)} className="mt-1.5" aria-invalid={!!errors.city}>
                    <option value="">Select a city…</option>
                    {cities.map((c) => <option key={c.id} value={c.display_label}>{c.display_label}</option>)}
                  </NativeSelect>
                  <FieldError>{errors.city}</FieldError>
                </div>
                <div>
                  <Label htmlFor="shelter-country">Country *</Label>
                  <Input id="shelter-country" required value={form.country} onChange={(e) => handleChange('country', e.target.value)} className="mt-1.5" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shelter-street">Street address</Label>
                  <Input id="shelter-street" value={form.street} onChange={(e) => handleChange('street', e.target.value)} placeholder="123 Main Street, Block A" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="shelter-capacity">Capacity (total cats) *</Label>
                  <Input id="shelter-capacity" required type="number" min="1" value={form.capacity_total} onChange={(e) => handleChange('capacity_total', e.target.value)} placeholder="50" className="mt-1.5" aria-invalid={!!errors.capacity_total} />
                  <FieldError>{errors.capacity_total}</FieldError>
                </div>
                <div>
                  <Label htmlFor="shelter-admin">Assign shelter admin</Label>
                  <NativeSelect id="shelter-admin" value={form.admin} onChange={(e) => handleChange('admin', e.target.value)} className="mt-1.5">
                    <option value="">Select admin (optional)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.email}{u.profile?.first_name && ` — ${u.profile.first_name} ${u.profile.last_name}`}
                      </option>
                    ))}
                  </NativeSelect>
                  <p className="mt-1 text-xs text-muted-foreground">Assign a user with the Shelter Admin role to manage this shelter.</p>
                  <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => setOwnerOpen(true)}>
                    <Plus className="size-3.5" />
                    Create new shelter owner
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Phone *</Label>
                  <div className="mt-1.5">
                    <ShelterPhoneField cityName={form.city} value={form.phone} onChange={(v) => handleChange('phone', v)} error={errors.phone} />
                  </div>
                  <FieldError>{errors.phone}</FieldError>
                  <p className="mt-1 text-xs text-muted-foreground">Choose Mobile (+92) or Landline — the landline area code is set from the selected city.</p>
                </div>
                <div>
                  <Label htmlFor="shelter-email">Email</Label>
                  <Input id="shelter-email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="info@happypaws.org" className="mt-1.5" aria-invalid={!!errors.email} />
                  <FieldError>{errors.email}</FieldError>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shelter-website">Website</Label>
                  <Input id="shelter-website" type="url" value={form.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://happypaws.org" className="mt-1.5" aria-invalid={!!errors.website} />
                  <FieldError>{errors.website}</FieldError>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location *</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {form.city ? `Pin the shelter's exact spot within ${form.city}.` : 'Select a city above first, then pin the shelter on the map.'}
              </p>
              <MapLocationPicker
                cityName={form.city}
                cityCenter={cityCenter}
                latitude={form.latitude}
                longitude={form.longitude}
                onChange={(loc) => { setForm((prev) => ({ ...prev, latitude: loc.latitude, longitude: loc.longitude })); setErrors((prev) => ({ ...prev, location: undefined })); }}
              />
              <FieldError>{errors.location}</FieldError>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} rows={4} placeholder="Tell us about the shelter, its mission, facilities, and services…" />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/shelters')}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <Building2 className="size-4" />
              {saving ? 'Creating…' : 'Create shelter'}
            </Button>
          </div>
        </form>
      )}

      <Modal
        open={ownerOpen}
        onClose={() => setOwnerOpen(false)}
        title="Create shelter owner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOwnerOpen(false)}>Cancel</Button>
            <Button form="owner-form" type="submit" disabled={ownerSaving}>{ownerSaving ? 'Creating…' : 'Create owner'}</Button>
          </>
        }
      >
        {ownerError && <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">{ownerError}</div>}
        <form id="owner-form" onSubmit={handleCreateOwner} className="flex flex-col gap-3.5">
          <div>
            <Label htmlFor="owner-email">Email *</Label>
            <Input id="owner-email" type="email" required value={ownerForm.email} onChange={(e) => setOwnerForm((p) => ({ ...p, email: e.target.value }))} placeholder="owner@example.com" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="owner-password">Password *</Label>
            <Input id="owner-password" type="password" required value={ownerForm.password} onChange={(e) => setOwnerForm((p) => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="owner-fname">First name *</Label>
              <Input id="owner-fname" required value={ownerForm.first_name} onChange={(e) => setOwnerForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="Jane" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="owner-lname">Last name *</Label>
              <Input id="owner-lname" required value={ownerForm.last_name} onChange={(e) => setOwnerForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Doe" className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Phone *</Label>
            <div className="mt-1.5">
              <PhoneInput value={ownerForm.phone} onChange={(v) => setOwnerForm((p) => ({ ...p, phone: v }))} error={!!ownerError && !isValidPkMobile(ownerForm.phone)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
