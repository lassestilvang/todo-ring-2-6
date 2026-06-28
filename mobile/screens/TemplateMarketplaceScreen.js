import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Bookmark, BookmarkCheck } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS, getAuthHeaders } from '../config/api';
import { useNavigation } from '@react-navigation/native';

export default function TemplateMarketplaceScreen() {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedTemplates, setSavedTemplates] = useState(new Set());

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'work', name: 'Work' },
    { id: 'personal', name: 'Personal' },
    { id: 'health', name: 'Health' },
    { id: 'finance', name: 'Finance' },
    { id: 'learning', name: 'Learning' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const url = selectedCategory === 'all'
        ? `${ENDPOINTS.templateMarketplace}`
        : `${ENDPOINTS.templateMarketplace}?category=${selectedCategory}`;

      const res = await fetch(url, {
        headers: getAuthHeaders(token),
      });
      const json = await res.json();
      if (json.success) {
        setTemplates(json.data.templates || json.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(ENDPOINTS.tasks, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          priority: template.priority,
          estimateHours: template.estimateHours,
          estimateMinutes: template.estimateMinutes,
          labelIds: template.labelIds || [],
        }),
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert('Success', 'Task created from template!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create task from template');
    }
  };

  const toggleSaveTemplate = (id) => {
    const newSaved = new Set(savedTemplates);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedTemplates(newSaved);
  };

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTemplate = ({ item }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateTitle}>{item.title}</Text>
        <TouchableOpacity onPress={() => toggleSaveTemplate(item.id)}>
          {savedTemplates.has(item.id) ? (
            <BookmarkCheck size={24} color="#3b82f6" />
          ) : (
            <Bookmark size={24} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.templateDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.templateFooter}>
        <View style={styles.templateMeta}>
          <Text style={styles.templateMetaText}>
            {item.estimateHours}h {item.estimateMinutes}m
          </Text>
          <Text style={styles.templateMetaText}>
            {item.priority} priority
          </Text>
        </View>

        <TouchableOpacity
          style={styles.useButton}
          onPress={() => handleUseTemplate(item)}
        >
          <Text style={styles.useButtonText}>Use Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Template Marketplace</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search templates..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplate}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No templates found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 14,
    color: '#6c757d',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  templateMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  useButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  useButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 4,
  },
});