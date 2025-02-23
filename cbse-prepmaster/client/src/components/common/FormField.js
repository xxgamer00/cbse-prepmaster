import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';

const FormField = ({
  field, // Formik field
  form: { touched, errors }, // Formik form
  type = 'text',
  label,
  options = [],
  ...props
}) => {
  const errorMessage = touched[field.name] && errors[field.name];
  const isSelect = type === 'select';

  if (isSelect) {
    return (
      <FormControl
        fullWidth
        error={!!errorMessage}
        variant="outlined"
        margin="normal"
      >
        <InputLabel>{label}</InputLabel>
        <Select
          {...field}
          {...props}
          label={label}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
      </FormControl>
    );
  }

  return (
    <TextField
      {...field}
      {...props}
      type={type}
      label={label}
      fullWidth
      variant="outlined"
      margin="normal"
      error={!!errorMessage}
      helperText={errorMessage}
    />
  );
};

export default FormField;
