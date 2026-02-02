import PropTypes from 'prop-types';
import RelationshipSelector from './RelationshipSelector';
import { useExternalContactForm } from '../hooks/useExternalContactForm';

const ExternalContactForm = ({
  onSubmit,
  onCancel,
  initialData = null,
  isEditMode = false,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const { formData, errors, handleChange, handleRelationshipChange, handleSubmit, submitting } =
    useExternalContactForm({
      initialData,
      onSubmit,
      isEditMode,
      externalIsSubmitting,
    });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="label-medical">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={submitting}
          className={`input-medical ${errors.name ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="Full name"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Phone Field */}
      <div>
        <label className="label-medical">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={submitting}
          className={`input-medical ${errors.phone ? 'border-red-500' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
          placeholder="+1 (555) 123-4567"
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* Address Field */}
      <div>
        <label className="label-medical">Address (Optional)</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          disabled={submitting}
          className="input-medical disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Street address, city, state"
        />
      </div>

      {/* Relationship Selector */}
      <RelationshipSelector
        value={formData.relationship}
        onChange={handleRelationshipChange}
        required={true}
        error={errors.relationship}
        disabled={submitting}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-medical-secondary px-6 py-2"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-medical-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {submitting
            ? isEditMode
              ? 'Updating...'
              : 'Adding...'
            : isEditMode
              ? 'Update Contact'
              : 'Add Contact'}
        </button>
      </div>
    </form>
  );
};

ExternalContactForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditMode: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

export default ExternalContactForm;
