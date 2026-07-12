import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddEditCardScreen({ card, flashcards, setFlashcards }) {
  const router = useRouter();
  const cards = flashcards ?? [];
  const currentCard = card;

  const [question, setQuestion] = useState(currentCard?.question || "");
  const [answer, setAnswer] = useState(currentCard?.answer || "");

  const saveCard = () => {
    if (currentCard) {
      const updated = cards.map((item) =>
        item.id === currentCard.id ? { ...item, question, answer } : item,
      );
      setFlashcards(updated);
    } else {
      setFlashcards([
        ...cards,
        {
          id: Date.now().toString(),
          question,
          answer,
        },
      ]);
    }

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {currentCard ? "✏️ Edit Flashcard" : "➕ Add Flashcard"}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>QUESTION</Text>

        <TextInput
          placeholder="Write your question..."
          placeholderTextColor="#6B7280"
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={styles.label}>ANSWER</Text>

        <TextInput
          placeholder="Write your answer..."
          placeholderTextColor="#6B7280"
          style={[styles.input, styles.answerInput]}
          value={answer}
          onChangeText={setAnswer}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={saveCard}>
          <Text style={styles.buttonText}>Save Flashcard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A", // same as HomeScreen
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#7C3AED",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#7C3AED",
  },

  label: {
    color: "#A78BFA",
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 1,
  },

  input: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 12,
    color: "#E5E7EB",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#374151",
  },

  answerInput: {
    height: 100,
    textAlignVertical: "top",
  },

  button: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
  },

  buttonText: {
    textAlign: "center",
    color: "#EDE9FE",
    fontWeight: "700",
    fontSize: 15,
  },
});
