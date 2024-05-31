import { useState } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import { TouchableOpacity, View, Text, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import tw, { useDeviceContext } from 'twrnc';
import { Provider } from 'react-redux';
import { store } from './store';
import MasonryList from '@react-native-seoul/masonry-list';
import { useSearchNotesQuery, useAddNoteMutation, useDeleteNoteMutation, useUpdateNoteMutation } from './db';

function HomeScreen({ navigation }) {
  const { data: searchData } = useSearchNotesQuery("");
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (searchData) {
      setFilteredData(searchData.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      ));
    }
  }, [searchData, query]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("Edit", { data: item })}
      style={tw`w-[98%] mb-0.5 mx-auto bg-purple-300 rounded-sm px-1`}
    >
      <Text style={tw`text-lg font-bold`}>{item.title}</Text>
      <Text>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={tw`flex-1 items-center bg-purple-400`}>
      <TextInput
        style={tw`bg-white p-2 m-4 rounded w-[98%]`}
        placeholder="Search"
        value={query}
        onChangeText={setQuery}
      />
      {filteredData.length ? (
        <MasonryList
          style={tw`px-0.5 pt-0.5 pb-20`}
          data={filteredData}
          numColumns={2}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={tw`text-white mt-10`}>No notes found</Text>
      )}
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("AddNote");
        }}
        style={tw`bg-blue-500 rounded-full absolute bottom-[5%] right-8 mx-auto items-center flex-1 justify-center w-12 h-12`}
      >
        <Text style={tw`text-white text-center text-3xl mt--1`}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddNoteScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [addNote, { data: addNoteData }] = useAddNoteMutation();

  useEffect(() => {
    if (addNoteData != undefined) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Notes' }],
      });
    }
  }, [addNoteData]);

  const handleAddNote = () => {
    addNote({
      title,
      content,
    });
  };

  return (
    <View style={tw`flex-1 p-4 bg-purple-400`}>
      <TextInput
        style={tw`bg-white p-2 mb-4 rounded`}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={tw`bg-white p-2 mb-4 rounded`}
        placeholder="New Note"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity onPress={handleAddNote} style={tw`bg-blue-500 p-4 rounded-full`}>
        <Text style={tw`text-white text-center`}>Add Note</Text>
      </TouchableOpacity>
    </View>
  );
}

function EditScreen({ route, navigation }) {
  const { data } = route.params;
  const [title, setTitle] = useState(data.title);
  const [content, setContent] = useState(data.content);
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Notes' }],
            });
          }}
          style={tw`pl-4`}
        >
          <Text style={tw`text-white text-lg`}>{'<'} Back</Text> {/* Back arrow button */}
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            deleteNote({ id: data.id });
            navigation.reset({
              index: 0,
              routes: [{ name: 'Notes' }],
            });
          }}
          style={tw`pr-4`}
        >
          <Text style={tw`text-white text-lg`}>🗑️</Text>
        </TouchableOpacity>
      ),
      headerStyle: tw`bg-purple-300 border-0`, // Same as AddNoteScreen
      headerTintColor: `#fff`, // Same as AddNoteScreen
      headerTitleStyle: tw`font-bold`, // Same as AddNoteScreen
      headerShadowVisible: false, // Same as AddNoteScreen
      title: `Notes`, // Same as AddNoteScreen
    });
  }, [navigation, data.id]);

  const handleSaveNote = () => {
    updateNote({
      id: data.id,
      title,
      content,
    });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Notes' }],
    });
  };

  return (
    <View style={tw`flex-1 p-4 bg-purple-400`}>
      <TextInput
        style={tw`bg-white p-2 mb-4 rounded`}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={tw`bg-white p-2 mb-4 rounded`}
        placeholder="New Note"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity onPress={handleSaveNote} style={tw`bg-blue-500 p-4 rounded-full`}>
        <Text style={tw`text-white text-center`}>Save Note</Text>
      </TouchableOpacity>
    </View>
  );
}


const Stack = createNativeStackNavigator();

export default function App() {
  useDeviceContext(tw);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Notes">
          <Stack.Screen
            options={{
              headerStyle: tw`bg-purple-300 border-0`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // gets rid of border on device
            }}
            name="Notes"
            component={HomeScreen}
          />
          <Stack.Screen
            options={{
              headerStyle: tw`bg-purple-300 border-0`,
              headerTintColor: `#fff`,
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // gets rid of border on device
              title: `Notes`
            }}
            name="AddNote"
            component={AddNoteScreen}
          />
          <Stack.Screen
            options={{
              headerStyle: tw`bg-purple-300 border-0`,
              headerTintColor: `#fff`,
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // gets rid of border on device
              title: 'Notes',
            }}
            name="Edit"
            component={EditScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}