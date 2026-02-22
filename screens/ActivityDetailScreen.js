import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityDetailScreen({ route, navigation }) {
  const { activity } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.description}>{activity.description}</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Activity content goes here</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>Back to Activities</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  description: {
    fontSize: 17,
    color: '#6e6e73',
    marginTop: 8,
  },
  placeholder: {
    marginTop: 32,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  placeholderText: {
    fontSize: 15,
    color: '#8e8e93',
  },
  backButton: {
    margin: 20,
    paddingVertical: 16,
    backgroundColor: '#1d1d1f',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
});
