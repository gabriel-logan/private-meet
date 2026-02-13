

import { StatusBar,  Text,  useColorScheme, View,  } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <SafeAreaView>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View>
        <Text>Private Meet Mobile App</Text>
      </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}


export default App;
