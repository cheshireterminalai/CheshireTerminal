Usage
This library is primarily meant for development in vanilla JavaScript projects, or as a base for libraries tailored to specific frameworks. It is recommended to check whether your specific framework has it’s own library. However, you can use this library in any JavaScript-based project.

​
Initialize conversation
First, initialize the Conversation instance:


const conversation = await Conversation.startSession(options);
This will kick off the websocket connection and start using microphone to communicate with the ElevenLabs Conversational AI agent. Consider explaining and allowing microphone access in your apps UI before the Conversation kicks off:


// call after explaning to the user why the microphone access is needed
await navigator.mediaDevices.getUserMedia();
​
Session configuration
The options passed to startSession specifiy how the session is established. There are two ways to start a session:

Using Agent ID
Agent ID can be acquired through ElevenLabs UI. For public agents, you can use the ID directly:


const conversation = await Conversation.startSession({
  agentId: "<your-agent-id>",
});
Using a signed URL
If the conversation requires authorization, you will need to add a dedicated endpoint to your server that will request a signed url using the ElevenLabs API and pass it back to the client.

Here’s an example of how it could be set up:


// Node.js server

app.get("/signed-url", yourAuthMiddleware, async (req, res) => {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
    {
      method: "GET",
      headers: {
        // Requesting a signed url requires your ElevenLabs API key
        // Do NOT expose your API key to the client!
        "xi-api-key": process.env.XI_API_KEY,
      },
    }
  );

  if (!response.ok) {
    return res.status(500).send("Failed to get signed URL");
  }

  const body = await response.json();
  res.send(body.signed_url);
});

// Client

const response = await fetch("/signed-url", yourAuthHeaders);
const signedUrl = await response.text();

const conversation = await Conversation.startSession({ signedUrl });
​
Optional callbacks
The options passed to startSession can also be used to register optional callbacks:

onConnect - handler called when the conversation websocket connection is established.
onDisconnect - handler called when the conversation websocket connection is ended.
onMessage - handler called when a new text message is received. These can be tentative or final transcriptions of user voice, replies produced by LLM. Primarily used for handling conversation transcription.
onError - handler called when an error is encountered.
onStatusChange - handler called whenever connection status changes. Can be connected, connecting and disconnected (initial).
onModeChange - handler called when a status changes, eg. agent switches from speaking to listening, or the other way around.
​
Return value
startSession returns a Conversation instance that can be used to control the session. The method will throw an error if the session cannot be established. This can happen if the user denies microphone access, or if the websocket connection fails.

endSession
A method to manually end the conversation. The method will end the conversation and disconnect from websocket. Afterwards the conversation instance will be unusable and can be safely discarded.


await conversation.endSession();
getId
A method returning the conversation ID.


const id = conversation.getId();
setVolume
A method to set the output volume of the conversation. Accepts object with volume field between 0 and 1.


await conversation.setVolume({ volume: 0.5 });
getInputVolume / getOutputVolume
Methods that return the current input/output volume on a scale from 0 to 1 where 0 is -100 dB and 1 is -30 dB.


const inputVolume = await conversation.getInputVolume();
const outputVolume = await conversation.getOutputVolume();
getInputByteFrequencyData / getOutputByteFrequencyData
Methods that return Uint8Arrays containg the current input/output frequency data. See AnalyserNode.getByteFrequencyData for more information.