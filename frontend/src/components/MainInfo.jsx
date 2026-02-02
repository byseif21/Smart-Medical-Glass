import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';
import MainInfoForm from './MainInfoForm';
import { useProfileForm } from '../hooks/useProfileForm';

const MainInfo = ({ profile, onUpdate, readOnly = false, targetUserId = null }) => {
  const {
    formData,
    errors,
    loading,
    isEditing,
    setIsEditing,
    handleChange,
    handleSave,
    handleCancel,
  } = useProfileForm(profile, targetUserId, onUpdate);

  const canEdit = !readOnly;

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

      <MainInfoForm
        formData={formData}
        errors={errors}
        isEditing={isEditing}
        onChange={handleChange}
      />
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
