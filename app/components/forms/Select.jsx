import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContextProvider';

export const Select = ({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option",
  required
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View className="mb-4">
      {label && (
        <Text className={`mb-2 font-medium ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {label} {required && '*'}
        </Text>
      )}
      <Pressable
        onPress={() => setModalVisible(true)}
        className={`border rounded-xl p-4 flex-row items-center justify-between ${
          isDark
            ? 'border-gray-700 bg-[#1e1e1e]'
            : 'border-gray-300 bg-white'
        }`}
      >
        <Text className={
          selectedOption
            ? isDark ? 'text-gray-200' : 'text-gray-900'
            : isDark ? 'text-gray-400' : 'text-gray-500'
        }>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={isDark ? '#9CA3AF' : '#6B7280'}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-end">
            <View className={`rounded-t-2xl max-h-[70%] ${
              isDark ? 'bg-[#121212]' : 'bg-white'
            }`}>
              <View className={`p-4 flex-row justify-between items-center border-b ${
                isDark ? 'border-gray-800' : 'border-gray-200'
              }`}>
                <Text className={`text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {label}
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={isDark ? '#E5E7EB' : '#374151'}
                  />
                </Pressable>
              </View>

              <ScrollView className="p-2">
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setModalVisible(false);
                    }}
                    className={`p-4 rounded-xl mb-1 ${
                      value === option.value
                        ? isDark ? 'bg-blue-900/50' : 'bg-blue-50'
                        : isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'
                    }`}
                  >
                    <Text className={`${
                      value === option.value
                        ? isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'
                        : isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};