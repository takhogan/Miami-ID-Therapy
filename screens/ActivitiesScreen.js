import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVITIES = [
  { id: 'breathing', name: 'Breathing', description: 'Guided breathing exercises' },
  { id: 'mindfulness', name: 'Mindfulness', description: 'Short mindfulness practices' },
  { id: 'journal', name: 'Journal', description: 'Reflection and journaling' },
  { id: 'movement', name: 'Movement', description: 'Gentle movement and stretch' },
  { id: 'grounding', name: 'Grounding', description: 'Grounding techniques' },
];

export default function ActivitiesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <Text style={styles.subtitle}>Choose an activity to get started</Text>
      </View>
      <View style={styles.panel}>
        {ACTIVITIES.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.button}
            onPress={() => navigation.navigate('ActivityDetail', { activity })}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonTitle}>{activity.name}</Text>
            <Text style={styles.buttonDescription}>{activity.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  subtitle: {
    fontSize: 17,
    color: '#6e6e73',
    marginTop: 4,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  buttonDescription: {
    fontSize: 14,
    color: '#6e6e73',
    marginTop: 4,
  },
});
