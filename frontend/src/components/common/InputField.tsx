import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { Control, Controller, FieldError } from 'react-hook-form';

interface InputFieldProps extends TextInputProps {
  name: string;
  control: Control<any>;
  label?: string;
  error?: FieldError;
}

const InputField: React.FC<InputFieldProps> = ({ 
  name, 
  control, 
  label, 
  error, 
  ...props 
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-slate-400 font-semibold mb-2 ml-1">{label}</Text>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholderTextColor="#94A3B8"
            className={`bg-slate-800 border-2 rounded-xl px-4 py-3 text-white 
              ${error ? 'border-red-500' : 'border-slate-700 focus:border-indigo-500'}`}
            {...props}
          />
        )}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1 ml-1">{error.message}</Text>
      )}
    </View>
  );
};

export default InputField;
