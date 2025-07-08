import base64
import numpy as np
import onnxruntime as ort
from io import BytesIO
from PIL import Image
import cv2
from mtcnn import MTCNN
import mediapipe as mp

# Load ONNX model once
onnx_model_path = "face_xxs.onnx"  # Model should be in the backend directory
session = ort.InferenceSession(onnx_model_path)
input_shape = (112, 112)  # Typical for face embedding models

# Initialize MTCNN detector
mtcnn_detector = MTCNN()

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

def decode_base64_image(image_base64: str):
    image_data = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_data)).convert('RGB')
    return np.array(image)

def detect_and_crop_face(image_np: np.ndarray):
    # MTCNN for box, mediapipe for landmarks
    results = mtcnn_detector.detect_faces(image_np)
    if not results:
        print("MTCNN: No face detected")
        return None, None, None
    x, y, w, h = results[0]['box']
    x, y = max(0, x), max(0, y)
    x2, y2 = min(x + w, image_np.shape[1]), min(y + h, image_np.shape[0])
    print(f"MTCNN: Detected face at (x={x}, y={y}, w={w}, h={h}), image shape={image_np.shape}")
    if x2 <= x or y2 <= y:
        print("MTCNN: Invalid crop coordinates")
        return None, None, None
    cropped = image_np[y:y2, x:x2]
    # Use mediapipe to get landmarks (on the cropped face)
    rgb_cropped = cv2.cvtColor(cropped, cv2.COLOR_RGB2BGR)
    results_mp = face_mesh.process(rgb_cropped)
    landmarks = []
    if results_mp.multi_face_landmarks:
        for lm in results_mp.multi_face_landmarks[0].landmark:
            lx = int(lm.x * cropped.shape[1]) + x
            ly = int(lm.y * cropped.shape[0]) + y
            landmarks.append([lx, ly])
    return cropped, (x, y, w, h), landmarks

def preprocess_face(image_np: np.ndarray):
    # Resize to model input
    img = cv2.resize(image_np, input_shape)
    # Normalize to [-1, 1]
    img = img.astype(np.float32) / 127.5 - 1.0
    # HWC to CHW
    img = np.transpose(img, (2, 0, 1))
    # Add batch dimension
    img = np.expand_dims(img, axis=0)
    return img

def extract_face_vector(image_np: np.ndarray):
    face_img, box, landmarks = detect_and_crop_face(image_np)
    if face_img is None:
        return None, None, None
    img = preprocess_face(face_img)
    inputs = {session.get_inputs()[0].name: img}
    outputs = session.run(None, inputs)
    embedding = outputs[0][0]
    return embedding, box, landmarks 