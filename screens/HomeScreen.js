import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFlashcards } from "../context/FlashcardContext";

import FlashCard from "../components/FlashCard";

export default function HomeScreen({ flashcards, setFlashcards }) {
  const router = useRouter();
  const { setEditingCard } = useFlashcards();
  const [currentIndex, setCurrentIndex] = useState(0);

  const cards = flashcards ?? [];
  const count = cards.length;
  const card = cards[currentIndex] ?? {
    question: "No flashcards yet",
    answer: "Tap Add Flashcard to create your first card.",
  };

  const nextCard = () => {
    if (currentIndex < count - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const deleteCard = () => {
    if (count === 0) {
      return;
    }

    Alert.alert("Delete Card", "Remove this flashcard?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = cards.filter((_, index) => index !== currentIndex);
          setFlashcards(updated);
          setCurrentIndex(0);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⚡ Flash Study</Text>

      {/* Card */}
      <View style={styles.cardWrapper}>
        <FlashCard question={card.question} answer={card.answer} />
      </View>

      <Text style={styles.counter}>
        {count > 0 ? currentIndex + 1 : 0} / {count}
      </Text>

      {/* Navigation */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={previousCard}
          disabled={count === 0}
        >
          <Text style={styles.navText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={nextCard}
          disabled={count === 0}
        >
          <Text style={styles.navText}>Next ▶</Text>
        </TouchableOpacity>
      </View>

      {/* Add */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          setEditingCard(null);
          router.push("/AddEdit");
        }}
      >
        <Text style={styles.addText}>+ Add Flashcard</Text>
      </TouchableOpacity>

      {/* Edit/Delete */}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => {
            setEditingCard(cards[currentIndex]);
            router.push("/AddEdit");
          }}
          disabled={count === 0}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={deleteCard}
          disabled={count === 0}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#0B0F1A",
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#7C3AED",
    marginBottom: 20,
  },

  cardWrapper: {
    marginVertical: 20,
  },

  counter: {
    textAlign: "center",
    color: "#94A3B8",
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },

  navBtn: {
    flex: 1,
    marginHorizontal: 5,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#7C3AED",
  },

  navText: {
    textAlign: "center",
    color: "#A78BFA",
    fontWeight: "600",
  },

  addBtn: {
    backgroundColor: "#7C3AED",
    padding: 15,
    borderRadius: 14,
    marginVertical: 12,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.4,
    elevation: 5,
  },

  addText: {
    textAlign: "center",
    color: "#EDE9FE",
    fontWeight: "700",
  },

  editBtn: {
    flex: 1,
    backgroundColor: "#F59E0B",
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    padding: 14,
    borderRadius: 12,
  },

  btnText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },
});
