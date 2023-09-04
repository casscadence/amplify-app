import React, { useState, useEffect } from 'react';
import './App.css';
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from 'aws-amplify';
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation
} from './graphql/mutations';

function App({ signOut }) {
  const [notes, setNotes] = useState([]);
  //notes will be an empty array because it will be multiple objects
  
  useEffect(() => {
    fetchNotes();
  }, [])
  //[] means runs once, when the page loads
  //this means that the fetchNotes() function will run once on page load

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    //sets callback function after fetching notes
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const url = await Storage.get(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setNotes(notesFromAPI);
  }
  //this will grab the notes from the database as a query
  //these will arrive as api data
  //then stores them as a constant
  //then sets the notes state to be those retrieved notes

  async function createNote(event) {
    //this function will take the form action event as its parameter
    event.preventDefault();
    //prevents a new window/tab from opening when the submit button is clicked for the form
    const form = new FormData(event.target);
    //grabs the form data from form submit
    const image = form.get('image');
    const data = {
      name: form.get('name'),
      description: form.get('description'),
      image: image.name,
    };
    //stores form data as an object called 'data' with key-value pairs as properties
    if (!!data.image) await Storage.put(data.name, image);
    //'!!' converts an object to a boolean
    //this is similar to data.image && to say something like if data.image exists, except not inverted
    //so '!!' is like saying if data.image exists, whereas '!' is like saying if data.image doesn't exist
    //this means if the form data contains an uploaded image, insert that image and name from the data into the database
    await API.graphql({
      query: createNoteMutation,
      variables: { input: data },
    });
    fetchNotes();
    event.target.reset();
    //creates a new note that is sent to graphql, using the form data as a database query
    //retrieves the updated notes
    //and resets the form event
  }

  async function deleteNote({ id, name }) {
    //grabs the id of the note to be deleted, to match it with the database
    const newNotes = notes.filter((note) => note.id !== id);
    //finds the matching note and stores it as a constant
    setNotes(newNotes);
    //sets notes to be that matched note
    await Storage.remove(name);
    //removes that note's name from the Storage
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
    //then deletes that note from the database, using a query
  }

  return (
    <View className="App">
      <Heading level={1}>My Notes App</Heading>
      {/* this will create the <h1> HTML element */}
      <View as='form' margin='3rem 0' onSubmit={createNote}>
        {/* this will create a form with a submit action, which occurs on a submit button click */}
        <Flex direction='row' justifyContent='center'>
          <TextField name='name' placeholder='Note Name' label='Note Name' labelHidden variation='quiet' required />
          {/* the name will be the key and its value will be the value */}
          <TextField name='description' placeholder='Note Description' label='Note Description' labelHidden variation='quiet' required />
          <View name="image" as="input" type="file" style={{ alignSelf: "end" }} />
          {/* this means create an input HTML element for image files */}
          <Button type='submit' variation='primary'>
            {/* submit type means the form using onSubmit will activate when this button is clicked */}
            Create Note
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Notes</Heading>
      <View margin='3rem 0'>
        {/* this will take all notes and map each of them to display in HTML */}
        {notes.map((note) => {
          <Flex key={note.id || note.name} direction='row' justifyContent='center' alignItems='center'>
            {/* Flex means a div with the flex property */}
            <Text as='strong' fontWeight={700}>
              {note.name}
            </Text>
            <Text as='span'>
              {note.description}
            </Text>
            {note.image && (
              <Image src={note.image} alt={`visual aid for ${notes.name}`} style={{ width: 400 }} />
            )}
            {/* this means, if a image exists for the note, then create an image HTML element with these set attributes */}
          <Button variation='link' onClick={() => {deleteNote(note)}}>
            Delete Note
          </Button>
          {/* each note will contain a button that will take the specific note being mapped and pass it as an argument to the deleteNote function */}
          {/* this is how matching that note's id to a note with the same id in the database works */}
        </Flex>
        })}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
      {/* signs out the user, part of amplify */}
    </View>
  );
}

export default withAuthenticator(App);
//^authenticates user, part of amplify