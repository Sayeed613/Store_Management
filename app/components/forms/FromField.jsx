import { Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContextProvider';

export const FormField = ({
  label,
  value,
  onChangeText,
  error,
  ...props
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const inputStyle = `border p-4 rounded-xl mb-1 ${
    isDark
      ? 'border-gray-700 bg-[#1e1e1e] text-gray-200'
      : 'border-gray-300 bg-white text-gray-900'
  }`;

  return (
    <View className="mb-3">
      {label && (
        <Text className={`mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        className={inputStyle}
        placeholderTextColor={isDark ? '#888' : '#999'}
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
};