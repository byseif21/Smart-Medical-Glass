import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { updateMedicalInfo } from '../services/api';
import { getCurrentUser } from '../services/auth';
import LoadingSpinner from './LoadingSpinner';

const getFormDataFromMedicalProfile = (profile) => ({
  health_history: profile?.medical_info?.health_history || '',
  chronic_conditions: profile?.medical_info?.chronic_conditions || '',
  allergies: profile?.medical_info?.allergies || '',
  current_medications: profile?.medical_info?.current_medications || '',
  previous_surgeries: profile?.medical_info?.previous_surgeries || '',
  emergency_notes: profile?.medical_info?.emergency_notes || '',
});

const MedicalInfo = ({ profile, onUpdate, readOnly = false, targetUserId = null }) => {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = !readOnly;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getFormDataFromMedicalProfile(profile));

  useEffect(() => {
    setFormData(getFormDataFromMedicalProfile(profile));
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const userId = targetUserId || getCurrentUser()?.id;
    const result = await updateMedicalInfo(userId, formData);

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
    setFormData(getFormDataFromMedicalProfile(profile));
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
        <h2 className="text-2xl font-semibold">Medical Information</h2>
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

      <div className="space-y-6">
        <div>
          <label className="label-medical">Health History</label>
          <textarea
            name="health_history"
            value={formData.health_history}
            onChange={handleChange}
            disabled={!isEditing}
            rows={3}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="Brief medical history..."
          />
        </div>

        <div>
          <label className="label-medical">Chronic Conditions</label>
          <textarea
            name="chronic_conditions"
            value={formData.chronic_conditions}
            onChange={handleChange}
            disabled={!isEditing}
            rows={2}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="List any chronic conditions..."
          />
        </div>

        <div>
          <label className="label-medical">Allergies</label>
          <textarea
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            disabled={!isEditing}
            rows={2}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="List any allergies..."
          />
        </div>

        <div>
          <label className="label-medical">Current Medications</label>
          <textarea
            name="current_medications"
            value={formData.current_medications}
            onChange={handleChange}
            disabled={!isEditing}
            rows={3}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="List current medications..."
          />
        </div>

        <div>
          <label className="label-medical">Previous Surgeries</label>
          <textarea
            name="previous_surgeries"
            value={formData.previous_surgeries}
            onChange={handleChange}
            disabled={!isEditing}
            rows={2}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="List previous surgeries..."
          />
        </div>

        <div>
          <label className="label-medical">Emergency Notes</label>
          <textarea
            name="emergency_notes"
            value={formData.emergency_notes}
            onChange={handleChange}
            disabled={!isEditing}
            rows={2}
            className="input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed resize-none"
            placeholder="Important emergency information..."
          />
        </div>
      </div>
    </div>
  );
};

MedicalInfo.propTypes = {
  profile: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  targetUserId: PropTypes.string,
};

export default MedicalInfo;
