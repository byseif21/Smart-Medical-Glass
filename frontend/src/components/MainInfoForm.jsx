import PropTypes from 'prop-types';
import { computeAge } from '../utils/dateUtils';
import { countries } from '../utils/countries';

const MainInfoForm = ({ formData, errors, isEditing, onChange }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <label className="label-medical">Full Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onChange}
          disabled={!isEditing}
          className={`input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed ${
            errors.name ? 'border-red-500' : ''
          }`}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="label-medical">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          disabled={!isEditing}
          className={`input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed ${
            errors.phone ? 'border-red-500' : ''
          }`}
        />
        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
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
            onChange={onChange}
            className={`input-medical ${errors.date_of_birth ? 'border-red-500' : ''}`}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>
          )}
        </div>
      )}

      <div>
        <label className="label-medical">Nationality</label>
        <select
          name="nationality"
          value={formData.nationality}
          onChange={onChange}
          disabled={!isEditing}
          className={`input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed ${
            errors.nationality ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select Nationality</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.nationality && <p className="text-sm text-red-500 mt-1">{errors.nationality}</p>}
      </div>

      <div>
        <label className="label-medical">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={onChange}
          disabled={!isEditing}
          className={`input-medical disabled:bg-medical-gray-50 disabled:cursor-not-allowed ${
            errors.gender ? 'border-red-500' : ''
          }`}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
      </div>
    </div>
  );
};

MainInfoForm.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    date_of_birth: PropTypes.string,
    nationality: PropTypes.string,
    gender: PropTypes.string,
  }).isRequired,
  errors: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default MainInfoForm;
