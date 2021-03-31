import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Button, TextInput } from "react-native";

import firebase from "firebase";
require("firebase/firestore");

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchUsersData } from "../../redux/actions/index";

function Comment(props) {
  const [comments, setComments] = useState([]);
  const [postId, setPostId] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    function matchUserToComment(comments) {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].hasOwnProperty("user")) {
          continue;
        }

        //See if the user who commented is someone we follow as it will be in users state (in Redux)
        const user = props.users.find((x) => x.uid === comments[i].creator);

        //If someone other than whom currentUser follow than call action to fetch that user's data and update redux state users
        if (user == undefined) {
          props.fetchUsersData(comments[i].creator, false);
        } else {
          comments[i].user = user;
        }
      }
      setComments(comments);
    }

    //if its someone whom current user doesn't follow then after redux users update this useEffect will run
    //and at that time props.route.params.postId will be equal to postId
    if (props.route.params.postId !== postId) {
      firebase
        .firestore()
        .collection("posts")
        .doc(props.route.params.uid)
        .collection("userPosts")
        .doc(props.route.params.postId)
        .collection("comments")
        .get()
        .then((snapshot) => {
          let comments = snapshot.docs.map((doc) => {
            const data = doc.data();
            const id = doc.id;
            return { id, ...data };
          });
          matchUserToComment(comments);
        });

      //setting the postId to props.route.params.postId means we have already seen that posts comments
      setPostId(props.route.params.postId);
    } else {
      matchUserToComment(comments);
    }
  }, [props.route.params.postId, props.users]);

  const onCommentSend = () => {
    firebase
      .firestore()
      .collection("posts")
      .doc(props.route.params.uid)
      .collection("userPosts")
      .doc(props.route.params.postId)
      .collection("comments")
      .add({
        creator: firebase.auth().currentUser.uid,
        text,
      });
  };

  return (
    <View>
      <FlatList
        numColumns={1}
        horizontal={false}
        data={comments}
        renderItem={({ item }) => (
          <View>
            {item.user !== undefined ? <Text>{item.user.name}</Text> : null}
            <Text>{item.text}</Text>
          </View>
        )}
      />

      <View>
        <TextInput
          placeholder="comment..."
          onChangeText={(text) => setText(text)}
        />
        <Button onPress={() => onCommentSend()} title="Send" />
      </View>
    </View>
  );
}

const mapStateToProps = (store) => ({
  users: store.usersState.users,
});
const mapDispatchProps = (dispatch) =>
  bindActionCreators({ fetchUsersData }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Comment);
