import os
from typing import Optional

import databases
import numpy as np
import yolov5
from fastapi import Depends, File, Form, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from PIL import Image
from pydantic import BaseModel
from pylibsrtp import Session
from vietocr.tool.config import Cfg
from vietocr.tool.predictor import Predictor

import sources.Controllers.config as cfg
from sources import app, templates
from sources.Controllers import utils
from sources.Models import models
from sources.Models.database import SQLALCHEMY_DATABASE_URL, SessionLocal, engine
from sources.Models.models import Feedback

# tạo môi trường
database = databases.Database(SQLALCHEMY_DATABASE_URL)
models.Base.metadata.create_all(bind=engine)


async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# mở kết nối csdl
@app.on_event("startup")
async def startup_database():
    await database.connect()


# tắt kết nối csdl
@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


# mô hình yolov5
CORNER_MODEL = yolov5.load(cfg.CORNER_MODEL_PATH)
CONTENT_MODEL = yolov5.load(cfg.CONTENT_MODEL_PATH)
FACE_MODEL = yolov5.load(cfg.FACE_MODEL_PATH)

CONTENT_MODEL.conf = cfg.CONF_CONTENT_THRESHOLD
CONTENT_MODEL.iou = cfg.IOU_CONTENT_THRESHOLD

# Config directory
UPLOAD_FOLDER = cfg.UPLOAD_FOLDER
SAVE_DIR = cfg.SAVE_DIR
FACE_CROP_DIR = cfg.FACE_DIR




""" Recognizion detected parts in ID """
config = Cfg.load_config_from_name(
    "vgg_seq2seq"
)  # OR vgg_transformer -> acc || vgg_seq2seq -> time
# config = Cfg.load_config_from_file(cfg.OCR_CFG)
# config['weights'] = cfg.OCR_MODEL_PATH
config["cnn"]["pretrained"] = False
config["device"] = cfg.DEVICE
config["predictor"]["beamsearch"] = False
detector = Predictor(config)


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


@app.get("/home")
async def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})


@app.get("/id_card")
async def id_extract_page(request: Request):
    return templates.TemplateResponse("idcard.html", {"request": request})


@app.post("/uploader")
async def upload(file: UploadFile = File(...)):
    INPUT_IMG = os.listdir(UPLOAD_FOLDER)
    if INPUT_IMG is not None:
        for uploaded_img in INPUT_IMG:
            os.remove(os.path.join(UPLOAD_FOLDER, uploaded_img))

    file_location = f"./{UPLOAD_FOLDER}/{file.filename}"
    contents = await file.read()
    with open(file_location, "wb") as f:
        f.write(contents)

    # Validating file
    INPUT_FILE = os.listdir(UPLOAD_FOLDER)[0]
    if INPUT_FILE == "NULL":
        os.remove(os.path.join(UPLOAD_FOLDER, INPUT_FILE))
        error = "No file selected!"
        return JSONResponse(status_code=403, content={"message": error})
    elif INPUT_FILE == "WRONG_EXTS":
        os.remove(os.path.join(UPLOAD_FOLDER, INPUT_FILE))
        error = "This file is not supported!"
        return JSONResponse(status_code=404, content={"message": error})

    # return {"Filename": file.filename}
    return await extract_info()


@app.post("/extract")
# @app.api_route("/extract", methods=["GET", "POST"])
async def extract_info(ekyc=False, path_id=None):
    """Check if uploaded image exist"""
    if not os.path.isdir(cfg.UPLOAD_FOLDER):
        os.mkdir(cfg.UPLOAD_FOLDER)

    INPUT_IMG = os.listdir(UPLOAD_FOLDER)
    if INPUT_IMG is not None:
        if not ekyc:
            img = os.path.join(UPLOAD_FOLDER, INPUT_IMG[0])
        else:
            img = path_id

    CORNER = CORNER_MODEL(img)
    # CORNER.save(save_dir='results/')
    predictions = CORNER.pred[0]
    categories = predictions[:, 5].tolist()  # Class
    if len(categories) != 4:
        error = "Detecting corner failed!"
        return JSONResponse(status_code=401, content={"message": error})
    boxes = utils.class_Order(predictions[:, :4].tolist(), categories)  # x1, x2, y1, y2
    IMG = Image.open(img)
    center_points = list(map(utils.get_center_point, boxes))

    """ Temporary fixing """
    c2, c3 = center_points[2], center_points[3]
    c2_fix, c3_fix = (c2[0], c2[1] + 30), (c3[0], c3[1] + 30)
    center_points = [center_points[0], center_points[1], c2_fix, c3_fix]
    center_points = np.asarray(center_points)
    aligned = utils.four_point_transform(IMG, center_points)
    # Convert from OpenCV to PIL format
    aligned = Image.fromarray(aligned)
   

    CONTENT = CONTENT_MODEL(aligned)
    # CONTENT.save(save_dir='results/')
    predictions = CONTENT.pred[0]
    categories = predictions[:, 5].tolist()  # Class
    if 7 not in categories:
        if len(categories) < 9:
            error = "Missing fields! Detecting content failed!"
            return JSONResponse(status_code=402, content={"message": error})
    elif 7 in categories:
        if len(categories) < 10:
            error = "Missing fields! Detecting content failed!"
            return JSONResponse(status_code=402, content={"message": error})

    boxes = predictions[:, :4].tolist()

    """ Non Maximum Suppression """
    boxes, categories = utils.non_max_suppression_fast(np.array(boxes), categories, 0.7)
    boxes = utils.class_Order(boxes, categories)  # x1, x2, y1, y2
    if not os.path.isdir(SAVE_DIR):
        os.mkdir(SAVE_DIR)
    else:
        for f in os.listdir(SAVE_DIR):
            os.remove(os.path.join(SAVE_DIR, f))

    for index, box in enumerate(boxes):
        left, top, right, bottom = box
        if 5 < index < 9:
            # right = c3[0]
            right = right + 100
        cropped_image = aligned.crop((left, top, right, bottom))
        cropped_image.save(os.path.join(SAVE_DIR, f"{index}.jpg"))

    FIELDS_DETECTED = []  # Collecting all detected parts
    for idx, img_crop in enumerate(sorted(os.listdir(SAVE_DIR))):
        if idx > 0:
            img_ = Image.open(os.path.join(SAVE_DIR, img_crop))
            s = detector.predict(img_)
            FIELDS_DETECTED.append(s)

    if 7 in categories:
        FIELDS_DETECTED = (
            FIELDS_DETECTED[:6]
            + [FIELDS_DETECTED[6] + ", " + FIELDS_DETECTED[7]]
            + [FIELDS_DETECTED[8]]
        )

    response = {"data": FIELDS_DETECTED}

    response = jsonable_encoder(response)
    return JSONResponse(content=response)


@app.post("/download")
async def download(file: str = Form(...)):
    if file != "undefined":
        noti = "Download file successfully!"
        return JSONResponse(status_code=201, content={"message": noti})
    else:
        error = "No file to download!"
        return JSONResponse(status_code=405, content={"message": error})


