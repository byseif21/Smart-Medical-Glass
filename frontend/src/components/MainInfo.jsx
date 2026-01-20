import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { updateMainInfo } from '../services/api';
import { countries } from '../utils/countries';
import LoadingSpinner from './LoadingSpinner';
import { computeAge } from '../utils/dateUtils';

const getFormDataFromProfile = (profile) => ({
  name: profile?.name || '',
  phone: profile?.phone || '',
  date_of_birth: profile?.date_of_birth || '',
  nationality: profile?.nationality || '',
  gender: profile?.gender || '',
  id_number: profile?.id_number || '',
});

const MainInfo = ({ profile, onUpdate, readOnly = false, targetUserId = null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = !readOnly;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getFormDataFromProfile(profile));

  useEffect(() => {
    setFormData(getFormDataFromProfile(profile));
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const userId = targetUserId || localStorage.getItem('user_id');
    const result = await updateMainInfo(userId, formData);

    if (result.success) {
      setIsEditing(false);
      onUpdate({ silent: true });
    } else {
      // TODO: replace alert with GeneralModal (unified app modal) for error feedback
      alert('Failed to update: ' + result.error);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setFormData(getFormDataFromProfile(profile));
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="medical-card">
        <LoadingSpinner text="Saving..." />
      </div>
    );
  }

  return (
    <div className="medical-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Main Information</h2>
        {canEdit &&
          (!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-medical-secondary text-sm px-4 py-2"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn-medical-secondary text-sm px-4 py-2">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-medical-primary text-sm px-4 py-2">
                Save
              </button>
            </div>
          ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="label-medical">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="label-medical">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="label-medical">Age</label>
          <input
            type="text"
            value={computeAge(formData.date_of_birth)}
            readOnly
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          />
        </div>

        {isEditing && (
          <div>
            <label className="label-medical">Birthday</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="input-medical"
            />
          </div>
        )}

        <div>
          <label className="label-medical">Nationality</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            disabled={!isEditing}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Nationality</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label-medical">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={!isEditing}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={isEditing ? 'md:col-span-2' : ''}>
          <label className="label-medical">Government ID</label>
          <input
            type="text"
            name="id_number"
            value={formData.id_number}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="National ID, Passport, or Driver's License"
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
};

MainInfo.propTypes = {
  profile: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  targetUserId: PropTypes.string,
};

export default MainInfo;
