// Teachable Machine Model URL
const URL = "https://teachablemachine.withgoogle.com/models/EEx8BEFcM/";
let model, ctx, labelContainer, maxPredictions;

// ThingSpeak Write API key
const WRITE_API_KEY = "D3DGCRWFC4SVQ7D3";  
const CHANNEL_ID = 3063067;

// Load model
async function loadModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    const canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
}
loadModel();

// Send data to ThingSpeak (POST request)
function sendToThingSpeak(field, value) {
    const url = "https://api.thingspeak.com/update";
    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `api_key=${WRITE_API_KEY}&${field}=${value}`
    })
    .then(res => res.text())
    .then(data => console.log("ThingSpeak response:", data))
    .catch(err => console.error("ThingSpeak error:", err));
}

// Predict from uploaded file
async function predictFromFile() {
    const fileInput = document.getElementById("imageUpload");
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select an image file first!");
        return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(fileInput.files[0]);
    img.onload = async function () {
        const canvas = document.getElementById("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Run prediction
        const { pose, posenetOutput } = await model.estimatePose(canvas);
        const prediction = await model.predict(posenetOutput);

        let bestClass = "";
        let bestProb = 0;

        for (let i = 0; i < maxPredictions; i++) {
            const prob = prediction[i].probability.toFixed(2);
            const classPrediction = prediction[i].className + ": " + prob;
            labelContainer.childNodes[i].innerHTML = classPrediction;

            if (prob > bestProb) {
                bestProb = prob;
                bestClass = prediction[i].className;
            }
        }

        // Send result to ThingSpeak
        if (bestClass.toLowerCase().includes("forward")) {
            sendToThingSpeak("field1", 1);
        } else if (bestClass.toLowerCase().includes("backward")) {
            sendToThingSpeak("field2", 1);
        }
    };
}
