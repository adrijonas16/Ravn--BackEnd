import { useCallback, useEffect, useState } from 'react';
import { Edit3, MapPin, Plus, Save, Trash2, User, X } from 'lucide-react';
import { authApi } from '../api/auth';
import { AddressPayload, addressesApi } from '../api/addresses';
import { useAuth } from '../context/useAuth';
import { Address } from '../types';

const emptyAddressForm: AddressPayload = {
  label: 'Home',
  recipientName: '',
  recipientPhone: '',
  line1: '',
  line2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: 'US',
  isDefault: true,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--input-bg)',
  color: 'var(--text)',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '0.78rem',
  fontWeight: 600,
  marginBottom: '0.35rem',
};

const panelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '1.5rem',
};

const nestedPanelStyle: React.CSSProperties = {
  padding: '1rem',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  background: 'var(--surface-muted)',
};

const iconButtonStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--surface-muted)',
  color: 'var(--text)',
  borderRadius: '8px',
  padding: '0.5rem',
  cursor: 'pointer',
  display: 'flex',
};

function normalizeAddress(form: AddressPayload): AddressPayload {
  return {
    ...form,
    label: form.label?.trim() || undefined,
    recipientName: form.recipientName.trim(),
    recipientPhone: form.recipientPhone.trim(),
    line1: form.line1.trim(),
    line2: form.line2?.trim() || undefined,
    city: form.city.trim(),
    stateRegion: form.stateRegion?.trim() || undefined,
    postalCode: form.postalCode?.trim() || undefined,
    countryCode: form.countryCode.trim().toUpperCase(),
  };
}

function AddressForm({
  idPrefix,
  value,
  saving,
  submitLabel,
  onChange,
  onCancel,
  onSubmit,
}: {
  idPrefix: string;
  value: AddressPayload;
  saving: boolean;
  submitLabel: string;
  onChange: (value: AddressPayload) => void;
  onCancel?: () => void;
  onSubmit: () => void;
}) {
  return (
    <div style={{ display: 'grid', gap: '0.85rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '0.7fr 1.3fr', gap: '0.85rem' }}>
        <input aria-label="Address label" style={inputStyle} value={value.label ?? ''} onChange={(event) => onChange({ ...value, label: event.target.value })} placeholder="Label" />
        <input aria-label="Recipient name" style={inputStyle} value={value.recipientName} onChange={(event) => onChange({ ...value, recipientName: event.target.value })} placeholder="Recipient name" />
      </div>
      <input aria-label="Recipient phone" style={inputStyle} value={value.recipientPhone} onChange={(event) => onChange({ ...value, recipientPhone: event.target.value })} placeholder="Phone" />
      <input aria-label="Address line 1" style={inputStyle} value={value.line1} onChange={(event) => onChange({ ...value, line1: event.target.value })} placeholder="Address line 1" />
      <input aria-label="Address line 2" style={inputStyle} value={value.line2 ?? ''} onChange={(event) => onChange({ ...value, line2: event.target.value })} placeholder="Address line 2" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr', gap: '0.85rem' }}>
        <input aria-label="City" style={inputStyle} value={value.city} onChange={(event) => onChange({ ...value, city: event.target.value })} placeholder="City" />
        <input aria-label="State or region" style={inputStyle} value={value.stateRegion ?? ''} onChange={(event) => onChange({ ...value, stateRegion: event.target.value })} placeholder="State" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '0.85rem' }}>
        <input aria-label="Postal code" style={inputStyle} value={value.postalCode ?? ''} onChange={(event) => onChange({ ...value, postalCode: event.target.value })} placeholder="Postal code" />
        <input aria-label="Country code" style={{ ...inputStyle, textTransform: 'uppercase' }} value={value.countryCode} maxLength={2} onChange={(event) => onChange({ ...value, countryCode: event.target.value.slice(0, 2).toUpperCase() })} placeholder="US" />
      </div>
      <label htmlFor={`${idPrefix}-default`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', fontSize: '0.85rem' }}>
        <input id={`${idPrefix}-default`} type="checkbox" checked={value.isDefault} onChange={(event) => onChange({ ...value, isDefault: event.target.checked })} />
        Default shipping address
      </label>
      <div style={{ display: 'flex', gap: '0.65rem' }}>
        <button type="button" onClick={onSubmit} disabled={saving} style={{
          flex: 1,
          padding: '0.8rem',
          borderRadius: '10px',
          border: 'none',
          background: saving ? '#2d665c' : 'linear-gradient(135deg, #00a676, #00a884)',
          color: 'white',
          fontWeight: 700,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.45rem',
        }}>
          <Save size={16} />
          {saving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" aria-label="Cancel address edit" onClick={onCancel} style={{
            padding: '0.8rem',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            background: 'var(--surface-muted)',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}>
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddress, setNewAddress] = useState<AddressPayload>(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressPayload>(emptyAddressForm);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profile } = await authApi.me();
      updateUser(profile.user);
      setProfileForm({
        email: profile.user.email,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        phone: profile.user.phone ?? '',
      });

      if (profile.user.role === 'client') {
        const { data: addressList } = await addressesApi.list();
        setAddresses(addressList);
        setShowNewAddress(addressList.length === 0);
      } else {
        setAddresses([]);
        setShowNewAddress(false);
      }
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Profile could not be loaded.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await authApi.updateMe({
        email: profileForm.email.trim(),
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        phone: profileForm.phone.trim(),
      });
      updateUser(data.user);
      setMessage('Profile updated.');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Profile could not be saved.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const createAddress = async () => {
    setSavingAddress(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await addressesApi.create(normalizeAddress(newAddress));
      setAddresses((current) => [
        data,
        ...(data.isDefault ? current.map((address) => ({ ...address, isDefault: false })) : current),
      ]);
      setNewAddress(emptyAddressForm);
      setShowNewAddress(false);
      setMessage('Address added.');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Address could not be saved.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setSavingAddress(false);
    }
  };

  const startEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setEditingAddress({
      label: address.label ?? '',
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city,
      stateRegion: address.stateRegion ?? '',
      postalCode: address.postalCode ?? '',
      countryCode: address.countryCode,
      isDefault: address.isDefault,
    });
  };

  const updateAddress = async () => {
    if (!editingAddressId) return;
    setSavingAddress(true);
    setError(null);
    setMessage(null);
    try {
      const { data } = await addressesApi.update(editingAddressId, normalizeAddress(editingAddress));
      setAddresses((current) =>
        current.map((address) => {
          if (address.id === data.id) return data;
          if (data.isDefault) return { ...address, isDefault: false };
          return address;
        }),
      );
      setEditingAddressId(null);
      setMessage('Address updated.');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Address could not be updated.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (addressId: number) => {
    setError(null);
    setMessage(null);
    try {
      await addressesApi.remove(addressId);
      setAddresses((current) => current.filter((address) => address.id !== addressId));
      if (editingAddressId === addressId) setEditingAddressId(null);
      setMessage('Address deleted.');
    } catch (apiError: any) {
      const apiMessage = apiError.response?.data?.message ?? 'Address could not be deleted.';
      setError(Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage);
    }
  };

  if (loading) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem', animation: 'fadeIn 0.5s ease-out', color: 'var(--text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #2457ff, #2457ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={22} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)' }}>Profile</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.role}</p>
        </div>
      </div>

      {(message || error) && (
        <p style={{
          margin: '0 0 1rem',
          padding: '0.8rem 1rem',
          borderRadius: '10px',
          background: error ? 'rgba(233, 69, 96, 0.12)' : 'rgba(0, 184, 148, 0.12)',
          border: error ? '1px solid rgba(233, 69, 96, 0.25)' : '1px solid rgba(0, 184, 148, 0.25)',
          color: error ? '#ff8fa3' : '#55efc4',
          fontSize: '0.9rem',
        }}>
          {error ?? message}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(320px, 1.1fr)', gap: '1.5rem' }} className="profile-grid">
        <section style={panelStyle}>
          <h2 style={{ margin: '0 0 1.25rem', color: 'var(--text)', fontSize: '1.05rem' }}>Account details</h2>
          <div style={{ display: 'grid', gap: '0.95rem' }}>
            <div><label htmlFor="profile-email" style={labelStyle}>Email</label><input id="profile-email" style={inputStyle} value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} /></div>
            <div><label htmlFor="profile-first-name" style={labelStyle}>First name</label><input id="profile-first-name" style={inputStyle} value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} /></div>
            <div><label htmlFor="profile-last-name" style={labelStyle}>Last name</label><input id="profile-last-name" style={inputStyle} value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} /></div>
            <div><label htmlFor="profile-phone" style={labelStyle}>Phone</label><input id="profile-phone" style={inputStyle} value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="+1234567890" /></div>
            <button type="button" onClick={saveProfile} disabled={savingProfile} style={{
              padding: '0.85rem',
              borderRadius: '10px',
              border: 'none',
              background: savingProfile ? '#384760' : 'linear-gradient(135deg, #2457ff, #111111)',
              color: 'white',
              fontWeight: 700,
              cursor: savingProfile ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
            }}>
              <Save size={16} />
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </section>

        {user?.role === 'client' && (
        <section style={panelStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#2457ff" />
              Addresses
            </h2>
            <button type="button" onClick={() => setShowNewAddress((current) => !current)} style={{ border: '1px solid var(--border)', background: 'var(--surface-muted)', color: 'var(--text)', borderRadius: '10px', padding: '0.6rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              {showNewAddress ? <X size={15} /> : <Plus size={15} />}
              {showNewAddress ? 'Cancel' : 'Add'}
            </button>
          </div>

          {showNewAddress && (
            <div style={{ ...nestedPanelStyle, marginBottom: '1rem' }}>
              <AddressForm idPrefix="new-address" value={newAddress} saving={savingAddress} submitLabel="Add address" onChange={setNewAddress} onSubmit={createAddress} />
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {addresses.map((address) => (
              <div key={address.id} style={nestedPanelStyle}>
                {editingAddressId === address.id ? (
                  <AddressForm idPrefix={`edit-address-${address.id}`} value={editingAddress} saving={savingAddress} submitLabel="Save address" onChange={setEditingAddress} onSubmit={updateAddress} onCancel={() => setEditingAddressId(null)} />
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.4rem' }}>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700 }}>{address.label ?? 'Address'} {address.isDefault ? <span style={{ color: '#2457ff', fontSize: '0.75rem' }}>Default</span> : null}</p>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{address.recipientName} · {address.recipientPhone}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <button type="button" aria-label="Edit address" onClick={() => startEditAddress(address)} style={iconButtonStyle}><Edit3 size={15} /></button>
                        <button type="button" aria-label="Delete address" onClick={() => deleteAddress(address.id)} style={{ border: '1px solid rgba(233, 69, 96, 0.25)', background: 'rgba(233, 69, 96, 0.1)', color: '#e94560', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text)', fontSize: '0.88rem', lineHeight: 1.45 }}>
                      {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}{address.stateRegion ? `, ${address.stateRegion}` : ''} {address.postalCode ?? ''}, {address.countryCode}
                    </p>
                  </>
                )}
              </div>
            ))}
            {addresses.length === 0 && !showNewAddress && (
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>No shipping addresses yet.</p>
            )}
          </div>
        </section>
        )}
      </div>

      <style>{`
        @media (max-width: 820px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
