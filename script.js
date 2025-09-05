// Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/t0_vFD2BF/";  // replace with your model link

// ThingSpeak details
const WRITE_API_KEY = "WIWI6TCB3P7PP8P0"; // replace with your Write API Key
const CHANNEL_ID = "2885963";       // replace with your channel ID

let model, imageElement;

// Load model
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  console.log("Model loaded");
}

// When image is uploaded
document.getElementById("imageUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const img = document.getElementById("preview");
    img.src = e.target.result;
    img.style.display = "block";
    imageElement = img;

    predict();
  };
  reader.readAsDataURL(file);
});

// Predict and send to ThingSpeak
async function predict() {
  if (!model) {
    alert("Model not loaded yet!");
    return;
  }

  const prediction = await model.predict(imageElement);

  // Show probabilities for each class
  let resultText = "Predictions:\n";
  prediction.forEach(p => {
    resultText += `${p.className}: ${(p.probability * 100).toFixed(2)}%\n`;
  });
  document.getElementById("result").innerText = resultText;

  // Find the best class
  let bestClass = prediction.reduce((prev, current) =>
    (prev.probability > current.probability) ? prev : current
  ).className;

  // Send to ThingSpeak
  if (bestClass.toLowerCase() === "forward") {
    sendToThingSpeak(1, 0);
  } else if (bestClass.toLowerCase() === "backward") {
    sendToThingSpeak(0, 1);
  }
}

// Send to ThingSpeak
function sendToThingSpeak(forwardValue, backwardValue) {
  const url = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}&field1=${forwardValue}&field2=${backwardValue}`;

  fetch(url)
    .then(response => {
      if (response.ok) {
        console.log("Sent to ThingSpeak:", forwardValue, backwardValue);
      } else {
        console.error("ThingSpeak error");
      }
    })
    .catch(err => console.error("Fetch error:", err));
}

// Initialize model
init();
