import { Switch, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContextProvider';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000' : '#fff'
      }}
    >
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            marginBottom: 32,
            color: isDark ? '#fff' : '#000'
          }}
        >
          Settings
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text
            style={{
              fontSize: 16,
              color: isDark ? '#fff' : '#000'
            }}
          >
            Dark Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#2563eb' }}
            thumbColor={isDark ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}