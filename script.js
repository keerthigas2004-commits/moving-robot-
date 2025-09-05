// Teachable Machine Model URL
const URL = "https://teachablemachine.withgoogle.com/models/EEx8BEFcM/";
let model, ctx, labelContainer, maxPredictions;

// ThingSpeak API details
const THINGSPEAK_API_KEY = "D3DGCRWFC4SVQ7D3";  // replace with your key
const FIELD1_URL = "https://api.thingspeak.com/update?api_key=" + THINGSPEAK_API_KEY + "&field1=1";
const FIELD2_URL = "https://api.thingspeak.com/update?api_key=" + THINGSPEAK_API_KEY + "&field2=1";

// Load the model
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

// Handle file upload and prediction
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

        // Send data to ThingSpeak
        if (bestClass.toLowerCase().includes("forward")) {
            fetch(FIELD1_URL);
        } else if (bestClass.toLowerCase().includes("backward")) {
            fetch(FIELD2_URL);
        }
    };
}
