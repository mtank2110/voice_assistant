import React, { useEffect, useState } from 'react'
import img from './ai-human.avif'


const App = () => {

  const [transcript, setTranscript] = useState("") // state variable transcript to store what user says
  const [isListening, setIsListening] = useState(false) // tracks whether app listening to microphone or not
  const [information, setInformation] = useState("") // holds response or information which assistant gives back.
  const [voices, setvoice] = useState([]) // state variable voices to store available speech synthesis voices

  // Checks which SpeechRecognition API is available (different browsers expose it differently).
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  // This object will actually listen to speech and fire events when speech is detected.
  const recognition = new SpeechRecognition();


  // Load all available voices from the browser for speech synthesis
  const loadVoice = () =>{
    const allVoice = window.speechSynthesis.getVoices();
    setvoice(allVoice)
  }


  useEffect(() => {
    // voices always don't populate immediately, browser take time to load.
    // if browser supports onvoiceschanged event then assign loadVoice (from above), else call loadVoice directly
    if(window.speechSynthesis.onvoiceschanged !== undefined){
      window.speechSynthesis.onvoiceschanged = loadVoice
    }else{
      loadVoice(); // if doesn't load then directly call the function.
    }
  }, [])



  const startListening = () =>{
    // begins speech recognition.
    recognition.start();
    setIsListening(true);
  }

  recognition.onresult = (event) =>{
    // gets the recognized spoken words
    const spokenText = event.results[0][0].transcript.toLowerCase();
    // updates the transcript state to display what the user said on screen.
    setTranscript(spokenText)
    // passes the text to your custom logic to decide what to do (open a site, fetch data, etc.).
    handleVoiceCommand(spokenText)
  }

  // speech recognition stops, when user stops speaking
 recognition.onend = () =>setIsListening(false)

 // converts string into audible speech using the Web Speech Synthesis API.
  const speakText = (text)=>{
    if(voices.length === 0){
      console.warn("No voice available yet.")
      return;
    }

// Creates a new speech object holding the text you want to speak.
    const utterance = new SpeechSynthesisUtterance(text);
// 
    const maleEnglishVoice = voices.find((voice)=>
    voice.lang.startsWith("en-") && voice.name.toLowerCase().includes("male"))|| voices.find((voice)=>voice.lang.startsWith("en-")) ||voices[0]

    utterance.voice = maleEnglishVoice;
    utterance.lang =  maleEnglishVoice.lang || "en-US";
    utterance.rate = 1;
    utterance.pitch = 1
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance)

  }
  
  // Listens for specific keywords/commands.
  // Decides what to do (open a site, introduce itself, fetch Wikipedia info, or just run a Google search).
  // Speaks a response and updates UI with information text
  // Uses asynchronous fetching if the query matches a known famous person
  const handleVoiceCommand = async (command) =>{
    if (command.startsWith("open ")) {
      const site = command.split("open ")[1].trim();

      const sitesMap = {
        youtube: "https://www.youtube.com",
        facebook: "https://www.facebook.com",
        google: "https://www.google.com",
        twitter: "https://www.twitter.com",
        instagram: "https://www.instagram.com",
        github: "https://www.github.com",
        linkedin: "https://www.linkedin.com"
      };

      if (sitesMap[site]) {
        speakText(`Opening ${site}`);
        window.open(sitesMap[site], "_blank");
        setInformation(`Opened ${site}`);
      } else {
        speakText(`I don't know how to open ${site}`);
        setInformation(`Could not find the website for  ${site}`);
      }
      return;
    }

    if (command.includes("what is your name")) {
      const response =
        "Hello Sir I'm Friday, Your voice assistant.";
      speakText(response);
      setInformation(response);
      return;
    } else if (command.includes("hello friday")) {
      const response = "Hello Sir I'm Friday, how can I help you?";
      speakText(response);
      setInformation(response);
      return;
    } else if (command.includes("what is your age")) {
      const response = "Hello Sir I'm Friday, I'm 2 days old.";
      speakText(response);
      setInformation(response);
      return;
    }

    // List of famous people
    // If famous people are mentioned in the command, call Wikipedia's REST API to fetch summary about that person.
    const famousPeople = [
      "bill gates",
      "mark zuckerberg",
      "elon musk",
      "steve jobs",
      "warren buffet",
      "barack obama",
      "jeff bezos",
      "sundar pichai",
      "mukesh ambani",
      "virat kohli",
      "sachin tendulkar",
      "brian lara",
    ];
// If data is found → speak it, display it, and open a Google search as backup
// If no data → just say "couldn't find info" and still open a Google search.
    if(famousPeople.some((person)=>command.includes(person))){
      const person = famousPeople.find((person)=>command.includes(person))
      const personData = await fetchPersonData(person)

      if(personData){
        const infoText = `${personData.name}, ${personData.extract}`
        setInformation(infoText)
        speakText(infoText)

        performGoogleSeach(command)
      }else{
        const fallbackMessage = "I couldn't find detailed information"
      
        speakText(fallbackMessage)
        performGoogleSeach(command)
      }

    }else{
      const fallbackMessage = `Here is the information about ${command}`;

      speakText(fallbackMessage);
      performGoogleSeach(command);
    }
  }

  const fetchPersonData = async (person) =>{
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(person)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if(data && data.title && data.extract){
        return {
// Wikipedia extracts can be long. We split at the first period to return only the first sentence — short enough for speech synthesis to read naturally
          name:data.title,
          extract:data.extract.split('.')[0]
        }
      }else{
        return null
      }
      
    } catch (error) {
      console.error('error')
      return null
    }

  }

  const performGoogleSeach = (query) =>{
// We don't use a "Google API" directly, we just open a regular search URL in a new browser tab:
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    window.open(searchUrl,"_blank");

  }


  return (
    <div>
      <div className="voice-assistant">
        <img src={img} alt="AI" className="ai-image" />
        <h2>Voice Assistant (Friday)</h2>

        <button className="btn" onClick={startListening} disabled={isListening}>
          <i className="fas fa-microphone"></i>
          {isListening ? "Listening..." : "Start Listening"}
        </button>
        <p className="tarnscript">{transcript}</p>
        <p className="information">
         {information}
        </p>
      </div>
    </div>
  );
}

export default App