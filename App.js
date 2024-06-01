import { useState, useEffect, useLayoutEffect } from 'react';
import { TouchableOpacity, View, Text, TextInput, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Provider } from 'react-redux';
import { store } from './store';
import MasonryList from '@react-native-seoul/masonry-list';
import { useSearchNotesQuery, useAddNoteMutation, 
      useDeleteNoteMutation, useUpdateNoteMutation, 
      useDeleteAllnotesMutation } from './db';


function HomeScreen({ navigation }) {
  const { data: searchData } = useSearchNotesQuery("");
  const [query, setQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [deleteAllNotes] = useDeleteAllnotesMutation();

  const deleteAllNotesWarning = () => {
    // Deleting all notes in the app
    deleteAllNotes();
    window.location.reload();
  };

  // Displaying notes if their title or content includes query string
  useEffect(() => {
    if (searchData) {
      setFilteredData(searchData.filter(note =>
        // Making all letters lower for case insensitive search
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      ));
    }
  }, [searchData, query]);  // Dependencies

  // Adding button to header to delete all notes
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={deleteAllNotesWarning}
          style={tw`pr-4`}
        >
          <Text style={tw`text-red-500 text-base font-bold`}>Delete All Notes</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation]); // Dependencies

  // Displaying created notes
  const renderItem = ({ item }) => (
    <TouchableOpacity
      // Allows user to edit note when clicking on it
      onPress={() => navigation.navigate("Edit", { data: item })}
      style={tw`w-[98%] mb-0.5 mx-auto bg-gray-800 rounded-base px-1`}
    >
      <Text style={tw`text-lg text-white`}>{item.title}</Text>
      <Text style={tw`text-white`}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={tw`flex-1 items-center bg-slate-950`}>
      <TextInput // Defining search bar
        style={tw`bg-gray-800 p-2 m-4 rounded w-[99%] text-white`}
        placeholder="Search"
        placeholderTextColor="white"
        onChangeText={setQuery}
      />

      {filteredData.length ? (
        <MasonryList // Displaying notes if there are any that match query
          style={tw`pt-0.5 pb-20`}
          data={filteredData}
          numColumns={2}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // No notes matched query
        <Text style={tw`text-white mt-10`}>No Notes Found</Text>
      )}

      <TouchableOpacity
        // Button to add notes
        onPress={() => {
          // Going to add note page
          navigation.navigate("AddNote");
        }}
        style={tw`bg-blue-500 rounded-full absolute bottom-[5%] right-8 mx-auto
            items-center flex-1 justify-center w-12 h-12`}
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

  // Goes back to home page after new note is created
  useEffect(() => {
    if (addNoteData != undefined) {
      navigation.navigate("Home");
    }
  }, [addNoteData]); // Dependencies

  // Adding note to database
  const handleAddNote = () => {
    // Making note title Untitled if no title is inputted
    let noteTitle = title.trim() === '' ? 'Untitled' : title;

    addNote({
      title: noteTitle, // Updating note title instantly
      content,
    });
  };

  // Making it so that when the back button is pressed the note is saved
  useEffect(() => {
    const beforeRemoveListener = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Save note and then navigate back to home screen
      handleAddNote();

      // Allow navigation after saving
      navigation.dispatch(e.data.action);
    });

    return beforeRemoveListener;
  }, [navigation, title, content]); // Dependencies

  return (
    <View style={tw`flex-1 p-4 bg-slate-950`}>
      <TextInput // Title input box
        style={tw`p-2 mb-4 rounded text-white bg-gray-800`}
        placeholder="Title"
        placeholderTextColor="white"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput // Note content input box
        style={tw`p-2 mb-4 flex-1 rounded text-white bg-gray-800`}
        placeholder="Note"
        placeholderTextColor="white"
        value={content}
        onChangeText={setContent}
        multiline
      />
    </View>
  );
}


function EditScreen({ route, navigation }) {
  const { data } = route.params;
  const [title, setTitle] = useState(data.title);
  const [content, setContent] = useState(data.content);
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  // Automatically saving note as title or content is being edited
  useEffect(() => {
    updateNote({
      id: data.id,
      title,
      content,
    });
  }, [title, content]);  // Dependencies

  useLayoutEffect(() => {
    navigation.setOptions({
      // Adding trash can emoji button that allows for note to be deleted
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            // Deleting note with this ID and going back to home page
            deleteNote({ id: data.id });
            navigation.navigate("Home");
          }}
          style={tw`pr-4`}
        >
          <Text style={tw`text-white text-lg`}>🗑️</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, data.id]); // Dependencies

  return (
    <View style={tw`flex-1 p-4 bg-slate-950`}>
      <TextInput // Title input box
        style={tw`p-2 mb-4 rounded text-white bg-gray-800`}
        placeholder="Title"
        placeholderTextColor="white"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput // Note content input box
        style={tw`p-2 mb-4 flex-1 rounded text-white bg-gray-800`}
        placeholder="New Note"
        placeholderTextColor="white"
        value={content}
        onChangeText={setContent}
        multiline
      />
    </View>
  );
}


// Creating navigation stack
const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen // Creating home page
            options={{
              headerStyle: tw`bg-slate-950 border-0`,
              headerTintColor: '#fff',
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // Gets rid of border on device
              title: `Notes`
            }}
            name="Home"
            component={HomeScreen}
          />
          <Stack.Screen // Creating add note page
            options={{
              headerStyle: tw`bg-slate-950 border-0`,
              headerTintColor: `#fff`,
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // Gets rid of border on device
              title: `Notes`
            }}
            name="AddNote"
            component={AddNoteScreen}
          />
          <Stack.Screen // Creating edit note page
            options={{
              headerStyle: tw`bg-slate-950 border-0`,
              headerTintColor: `#fff`,
              headerTitleStyle: tw`font-bold`,
              headerShadowVisible: false, // Gets rid of border on device
              title: `Notes`,
            }}
            name="Edit"
            component={EditScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}