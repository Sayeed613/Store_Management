<<<<<<< HEAD
=======

>>>>>>> ec1002a84e66c2366a6beecd62842ffbdefa6d2f


 const StatusBadge = ({ status, isDark }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
          text: isDark ? 'text-green-400' : 'text-green-700',
          icon: 'check-circle'
        };
      case 'pending':
        return {
          bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
          text: isDark ? 'text-yellow-400' : 'text-yellow-700',
          icon: 'pending'
        };
      default:
        return {
          bg: isDark ? 'bg-gray-500/20' : 'bg-gray-100',
          text: isDark ? 'text-gray-400' : 'text-gray-700',
          icon: 'help'
        };
    }
  };

  const { bg, text, icon } = getStatusColor();

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-full ${bg}`}>
      <MaterialIcons name={icon} size={12} className={text} />
      <Text className={`text-xs ml-1 font-medium ${text}`}>
        {status || 'Unknown'}
      </Text>
    </View>
  );
};