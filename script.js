// 🔗 Replace this with your Teachable Machine model URL
const URL = "https://teachablemachine.withgoogle.com/models/t0_vFD2BF/";

// 🔑 Replace with your ThingSpeak Write API Key
const WRITE_API_KEY = "WIWI6TCB3P7PP8P0";

let model, maxPredictions;

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
}

init();

document.getElementById("imageUpload").addEventListener("change", handleImage);

async function handleImage(event) {
  const file = event.target.files[0];
  const img = document.getElementById("uploadedImage");
  img.src = URL.createObjectURL(file);
  img.style.display = "block";

  img.onload = async () => {
    const prediction = await model.predict(img);

    // Find best prediction
    let bestClass = prediction[0].className;
    let bestProb = prediction[0].probability;
    for (let i = 1; i < prediction.length; i++) {
      if (prediction[i].probability > bestProb) {
        bestClass = prediction[i].className;
        bestProb = prediction[i].probability;
      }
    }

    // Show prediction
    document.getElementById("prediction").innerText =
      "Prediction: " + bestClass + " (" + (bestProb * 100).toFixed(2) + "%)";

    // Send to ThingSpeak
    if (bestClass.toLowerCase() === "forward") {
      sendToThingSpeak(1, 0);
    } else if (bestClass.toLowerCase() === "backward") {
      sendToThingSpeak(0, 1);
    }
  };
}

function sendToThingSpeak(forwardValue, backwardValue) {
  const url = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}&field1=${forwardValue}&field2=${backwardValue}`;
  fetch(url)
    .then(() => {
      document.getElementById("forwardVal").innerText = forwardValue;
      document.getElementById("backwardVal").innerText = backwardValue;
      console.log("Sent to ThingSpeak:", forwardValue, backwardValue);
    })
    .catch(error => console.error("Error:", error));
}
