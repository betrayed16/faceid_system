from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, utils
from database import SessionLocal, engine
import numpy as np
import pickle

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    image_np = utils.decode_base64_image(user.image)
    face_vector, box, landmarks = utils.extract_face_vector(image_np)
    if face_vector is None:
        raise HTTPException(status_code=400, detail="No face detected.")
    # Serialize vector
    face_vector_bytes = pickle.dumps(face_vector)
    db_user = models.User(username=user.username, face_vector=face_vector_bytes)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Return box and landmarks in response for frontend overlay
    return {"id": db_user.id, "username": db_user.username, "created_at": db_user.created_at, "box": box, "landmarks": landmarks}

@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    image_np = utils.decode_base64_image(user.image)
    face_vector, box, landmarks = utils.extract_face_vector(image_np)
    if face_vector is None:
        # No face detected, return 'Unknown' and no box
        return {"username": "Unknown", "id": None, "box": None, "landmarks": []}
    users = db.query(models.User).all()
    best_match = None
    best_distance = float('inf')
    for db_user in users:
        face_bytes = db_user.face_vector
        if isinstance(face_bytes, (bytes, memoryview)):
            db_vector = pickle.loads(bytes(face_bytes))
        else:
            continue
        distance = np.linalg.norm(face_vector - db_vector)
        if distance < best_distance:
            best_distance = distance
            best_match = db_user
    if best_match:
        return {"username": best_match.username, "id": best_match.id, "box": box, "landmarks": landmarks}
    # No users in DB
    return {"username": "Unknown", "id": None, "box": box, "landmarks": landmarks} 