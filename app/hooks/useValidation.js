export const validateOutletForm = ({
  firstName,
  phoneNumber,
  storeName,
  pincode,
  location,
}) => {
  if (!firstName || firstName.trim().length < 3) {
    return { valid: false, error: 'First name must be at least 3 characters.' };
  }
  if (!phoneNumber || !/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
    return { valid: false, error: 'Enter a valid Indian phone number with +91 prefix.' };
  }
  if (!storeName || storeName.trim().length < 3) {
    return { valid: false, error: 'Store name must be at least 3 characters.' };
  }
  if (pincode && (!/^\d{1,6}$/.test(pincode))) {
    return { valid: false, error: 'Pincode must be numeric and max 6 digits.' };
  }
  if (!location) {
    return { valid: false, error: 'GPS location is required.' };
  }
  return { valid: true };
};
