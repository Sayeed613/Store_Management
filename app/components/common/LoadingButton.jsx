import { ActivityIndicator, Pressable, Text } from 'react-native';

export const LoadingButton = ({
  loading,
  onPress,
  text,
  variant = 'primary',
  disabled,
  className = ''
}) => {
  const getButtonStyle = () => {
    if (disabled) return 'bg-gray-300';
    if (loading) return 'bg-gray-400';
    switch (variant) {
      case 'primary': return 'bg-blue-600 active:bg-blue-700';
      case 'success': return 'bg-green-600 active:bg-green-700';
      case 'secondary': return 'bg-white border border-gray-300';
      default: return 'bg-blue-600 active:bg-blue-700';
    }
  };

  return (
    <Pressable
      className={`p-4 rounded-xl shadow-sm w-full ${getButtonStyle()} ${className}`}
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        {
          opacity: (pressed || disabled || loading) ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }]
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#000' : '#fff'} />
      ) : (
        <Text className={`text-center text-base font-semibold ${variant === 'secondary' ? 'text-gray-700' : 'text-white'
          }`}>
          {text}
        </Text>
      )}
    </Pressable>
  );
};
