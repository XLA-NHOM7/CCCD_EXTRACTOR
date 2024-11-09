PORT = 8080
CONF_CONTENT_THRESHOLD = 0.7
IOU_CONTENT_THRESHOLD = 0.7

CORNER_MODEL_PATH = "sources/Database/OCR/weights/corner.pt"
CONTENT_MODEL_PATH = "sources/Database/OCR/weights/content.pt"
FACE_MODEL_PATH = "sources/Database/OCR/weights/face.pt"

DEVICE = "cpu"  # or "cuda:0" if using GPU
# Config directory
UPLOAD_FOLDER = "sources/Database/uploads"
SAVE_DIR = "sources/static/results"
FACE_DIR = "sources/static/face"
