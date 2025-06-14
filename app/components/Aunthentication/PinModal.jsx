import { useEffect, useRef } from 'react';
import { Keyboard, TextInput, TouchableWithoutFeedback, View } from 'react-native';

const PinInput = ({ value, index, onChangeText, inputsRef, isDark }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    inputsRef.current[index] = inputRef;
  }, []);



  const handleChange = (text) => {
    if (text.length > 1) return;
    onChangeText(index, text);

    if (text && index < 3) {
      inputsRef.current[index + 1]?.current?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }) => {
    if (nativeEvent.key === 'Backspace' && !value && index > 0) {
      inputsRef.current[index - 1]?.current?.focus();
      onChangeText(index - 1, '');
    }
  };

  return (
    <View className="items-center">
      <TextInput
        ref={inputRef}
        className={`w-14 h-14 text-center text-2xl rounded-xl border-2 mx-2
          ${isDark ?
            'bg-gray-800 border-gray-700 text-white' :
            'bg-white border-gray-200 text-gray-900'
          }
          ${value ?
            isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
            : ''
          }`}
        keyboardType="numeric"
        maxLength={1}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        secureTextEntry
        placeholder="•"
        placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
      />
    </View>
  );
};

const PinModal = ({ values, onChange, isDark }) => {
  const inputsRef = useRef([]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className="w-full">
        <View className="flex-row justify-center items-center space-x-2">
          {[0, 1, 2, 3].map((index) => (
            <PinInput
              key={index}
              value={values[index]}
              index={index}
              onChangeText={onChange}
              inputsRef={inputsRef}
              isDark={isDark}
            />
          ))}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default PinModal;