import PropTypes from 'prop-types';
import { Phone, MapPin, Edit2, Trash2 } from 'lucide-react';

const RelativeCard = ({ relative, onEdit, onDelete, isEditing }) => {
  return (
    <div className="medical-card hover:shadow-medical-hover transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0">
        <div className="flex-1 w-full">
          <h3 className="font-semibold text-medical-dark text-lg">{relative.name}</h3>
          <p className="text-medical-primary text-sm font-medium mt-1">{relative.relation}</p>
          <div className="mt-3 space-y-1">
            <p className="text-medical-gray-600 text-sm flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {relative.phone}
            </p>
            {relative.address && (
              <p className="text-medical-gray-600 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {relative.address}
              </p>
            )}
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2 sm:ml-4 flex-shrink-0 self-end sm:self-start">
            <button
              onClick={() => onEdit(relative)}
              className="p-2 text-medical-primary hover:bg-medical-light rounded-lg transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(relative.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

RelativeCard.propTypes = {
  relative: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string.isRequired,
    relation: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    address: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  isEditing: PropTypes.bool,
};

export default RelativeCard;
