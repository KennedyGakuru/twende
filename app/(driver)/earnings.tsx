import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EarningsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Earnings Screen</Text>
      <Text style={styles.subText}>Your earnings information will appear here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});