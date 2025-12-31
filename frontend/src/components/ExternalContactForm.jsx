import { useState } from 'react';
import PropTypes from 'prop-types';
import RelationshipSelector from './RelationshipSelector';

const ExternalContactForm = ({
  onSubmit,
  onCancel,
  initialData = null,
  isEditMode = false,
  isSubmitting: externalIsSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    relationship: initialData?.relationship || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when initialData changes
  useState(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        relationship: initialData.relationship || '',
      });
    }
  }, [initialData]);

  const validatePhone = (phone) => {
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Name is required';
    } else if (trimmedName.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    // Phone validation
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(trimmedPhone)) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    // Address validation (optional but if provided, check length)
    if (formData.address && formData.address.trim().length > 200) {
      newErrors.address = 'Address must be less than 200 characters';
    }

    // Relationship validation
    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleRelationshipChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      relationship: value,
    }));

    if (errors.relationship) {
      setErrors((prev) => ({
        ...prev,
        relationship: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting || externalIsSubmitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({}); // Clear previous errors

    try {
      await onSubmit(formData);
      // Reset form on success only if not in edit mode
      if (!isEditMode) {
        setFormData({
          name: '',
          phone: '',
          address: '',
          relationship: '',
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Check if it's a network error
      if (error.message && error.message.includes('network')) {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ submit: error.message || 'Failed to save contact. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = isSubmitting || externalIsSubmitting;

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
