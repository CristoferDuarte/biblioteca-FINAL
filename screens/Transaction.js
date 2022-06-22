import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Alert
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config"
import { ThemeProvider } from "@react-navigation/native";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      book_id: "",
      student_id: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false
    };
  }

  getCameraPermissions = async domState => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" é verdadeiro se o usuário concedeu permissão
          status === "granted" é falso se o usuário não concedeu permissão
        */
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "book_id") {
      this.setState({
        book_id: data,
        domState: "normal",
        scanned: true
      });
    } else if (domState === "student_id") {
      this.setState({
        student_id: data,
        domState: "normal",
        scanned: true
      });
    }
  };
  handleTransaction = async()=>{
    var { bookId } = this.state;
    var { studentId } = this.state;
    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);
    var transactionType = await this.checkBookAvaible(bookId);
    if (!transactionType){
      this.setState({
        bookId:"",studentId:""
      })
      Alert.alert("O livro não existe no banco de dados")
    }else if(transactionType === "issue") {
      var isElegible=await this.checkStudentEligibilityForBookIssue(studentId)
      if (isElegible) {

      
        var {book_name,study_name } = this.state;
        this.initiateBookIssue(bookId,studentId,book_name,study_name);
        alert("Livro entregue ao aluno(a)")
      }
    }else {
      var isElegible=await this.checkStudentEligibilityForBookReturn(studentId,bookId)
      if (isElegible) {
        var {book_name,study_name } = this.state;
        this.initiateBookReturn(bookId,studentId,book_name,study_name);
        alert("Livro devolvido para a biblioteca")
      } 
    }
    db.collection("books")
      .doc(book_id)
      .get()
      .then(doc => {
        console.log(doc.data())
        var book = doc.data();
        if (book.is_book_available) {
          var{book_name,study_name}= this.state;
          this.initiateBookIssue(book_id,student_id,book_name,study_name);
        } else {
          var{book_name,study_name}= this.state;
          this.initiateBookReturn(book_id,student_id,book_name,study_name);
        }
      });
  };
  getBookDetails = bookId => {
    bookId = bookId.trim();
    db.collection("books")
      .where("book_id", "==", bookId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            book_name: doc.data().book_details.book_name
          });
        });
      });
  };
  getStudentDetails = studentId => {
    studentId = studentId.trim();
    db.collection("students")
      .where("student_id", "==", studentId)
      .get()
      .then(snapshot => {
        snapshot.docs.map(doc => {
          this.setState({
            study_name: doc.data().student_details.study_name
          });
        });
      });
  };
  initiateBookIssue = async(book_id,student_id,book_name,study_name)=>{
    db.collection ("transactions").add({
      book_id:book_id,
      student_id:student_id,
      book_name:book_name,
      study_name:study_name,
      date:firebase.firestore.Timestamp.now.toDate(),
      transaction_type:"issue"
    });
    db.collection("books").doc(book_id)
    .update({is_book_available:false});
    db.collection("students").doc(student_id)
    .update({number_of_book_issued:firebase.firestore.FieldValue.increment(1)});
    this.setState({
      book_id:"",
      student_id:""
    })
    
 }
  

  initiateBookReturn = async(book_id,student_id,book_name,study_name)=>{
    db.collection ("transactions").add({
      book_id:book_id,
      student_id:student_id,
      book_name:book_name,
      study_name:study_name,
      date:firebase.firestore.Timestamp.now.toDate(),
      transaction_type:"issue"
    });
    db.collection("books").doc(book_id)
    .update({is_book_available:false});
    db.collection("students").doc(student_id)
    .update({number_of_book_issued:firebase.firestore.FieldValue.increment(1)});
    this.setState({
      book_id:"",
      student_id:""
    })
  };
  checkBookAvaible = async bookId =>{
    const bookRef = await db
    .collection("books")
    .where("book_id","==",bookId)
    .get();
    var transactionType = "";
    if (bookRef.docs.length == 0) {
      transactionType = false
    }else {
      bookRef.docs.map(doc=>{
        transactionType=doc.data().is_book_available?"issue":"return"
      })
    }
    return transactionType

  }

  render() {
    const { book_id, student_id, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>

      
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={book_id}
                onChangeText = {text=>this.setState({book_id:text})}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("book_id")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Estudante"}
                placeholderTextColor={"#FFFFFF"}
                value={student_id}
                onChangeText = {text=>this.setState({student_id:text})}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("student_id")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
             style = {[styles.button,{marginTop:25}]}
             onPress = {this.handleTransaction}
            >
             <Text style = {[styles.buttonText]}> enviar </Text>
              </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  appName: {
    width: 180,
    resizeMode: "contain"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    //fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
   // fontFamily: "Rajdhani_600SemiBold"
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F48D20",
    borderRadius: 15
  },
  buttonText: {
    fontSize: 24,
    color: "#FFFFFF",
    //fontFamily: "Rajdhani_600SemiBold"
  }
});