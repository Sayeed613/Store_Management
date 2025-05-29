import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContextProvider';

export default function Loader({ message }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className={`flex-1 justify-center items-center ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      {message && (
        <Text className={`mt-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {message}
        </Text>
      )}
    </View>
  );
}