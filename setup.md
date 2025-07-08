# Face ID Recognition Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js and npm installed
- DBeaver (for database management)

## Step 1: Start Backend and Database
```bash
# From project root directory
docker-compose up --build
```
This will start:
- PostgreSQL database on port 5432
- FastAPI backend on port 8000

## Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

## Step 3: Start Frontend
```bash
# In a new terminal, from frontend directory
npm start
```
Frontend will run on http://localhost:3000

## Step 4: Connect DBeaver to Database
- Host: localhost
- Port: 5432
- Database: faceid_db
- Username: faceid_user
- Password: faceid_pass

## Step 5: Test the System
1. Open http://localhost:3000 in your browser
2. Allow camera access
3. Enter a username and click "Register" to register your face
4. Click "Login" to test face recognition

## Troubleshooting

### If Docker fails to start:
- Make sure Docker Desktop is running
- Check if ports 5432 and 8000 are available
- Try: `docker-compose down` then `docker-compose up --build`

### If frontend can't connect to backend:
- Make sure backend is running on port 8000
- Check browser console for CORS errors
- Verify the backend URL in frontend code

### If face recognition fails:
- Ensure good lighting
- Face should be clearly visible
- Try adjusting the threshold in backend/main.py (currently 0.6) 

Great! You have a face recognition model named `face_xxs.onnx`. This is an ONNX (Open Neural Network Exchange) model, which is different from the `face_recognition` library (which uses dlib under the hood).

**If you want to use your ONNX model (`face_xxs.onnx`) for face recognition instead of the default `face_recognition` library, you’ll need to:**

---

## 1. Use ONNX Runtime for Inference

You’ll need to use the `onnxruntime` Python package to load and run inference with your ONNX model.

**Install ONNX Runtime:**
Add this to your `backend/requirements.txt`:
```
onnxruntime
```

---

## 2. Update the Backend to Use Your ONNX Model

You’ll need to:
- Load `face_xxs.onnx` with ONNX Runtime.
- Preprocess the input image as required by your model.
- Run inference to get the face embedding/vector.
- Use this vector for registration and login.

---

## 3. Replace the Vector Extraction Logic

Currently, your backend uses:
```python
import face_recognition
face_recognition.face_encodings(image_np)
```
You’ll need to replace this with code that:
- Detects the face (you may need a face detector, or your ONNX model may include detection)
- Crops and preprocesses the face
- Runs the ONNX model to get the embedding

---

## 4. Example: Using ONNX Runtime

Here’s a **very basic** example of how you might use ONNX Runtime:

```python
import onnxruntime as ort
import numpy as np

# Load the model
session = ort.InferenceSession("face_xxs.onnx")

# Preprocess your image to match model input (resize, normalize, etc.)
# img = ... (numpy array, shape and dtype as required by your model)

# Run inference
inputs = {session.get_inputs()[0].name: img}
outputs = session.run(None, inputs)
face_vector = outputs[0]
```

**You will need to adapt the preprocessing to your model’s requirements!**

---

## 5. Next Steps

- Do you want to switch your backend to use this ONNX model for face recognition?
- If yes, do you know the input shape and preprocessing steps for `face_xxs.onnx`?
- Would you like me to help you write the code to use this ONNX model for face embedding extraction?

**Let me know if you want to proceed with this, and if you have documentation or sample code for your ONNX model’s input/output!** 