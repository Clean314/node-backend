const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");

const Place = require("../models/place");
const User = require("../models/user");
const { mongoose } = require("mongoose");


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "장소를 찾을 수 없습니다. 다시 시도해주세요.",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("해당 ID의 장소를 찾을 수 없습니다.", 404));
  }

  res.json(place.toObject({ getters: true })); // { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "장소를 찾을 수 없습니다. 다시 시도해주세요.",
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(new HttpError("id에 해당하는 유저를 찾을 수 없읍니다", 404));
  }

  res.json({ places: userWithPlaces.places.map((p) => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("유효하지 않은 입력입니다.", 422);
    return next(error);
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg",
    creator,
  });

  
  if (!mongoose.Types.ObjectId.isValid(creator)) {
    const error = new HttpError("유효하지 않은 사용자 ID 형식입니다.", 400);
    return next(error);
  }

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Place 생성에 실패했습니다. 다시 시도해주세요.",
      500
    );
    console.log(err);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("해당 유저를 찾을 수 없습니다.", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();

  } catch (err) {
    const error = new HttpError(
      "Place 생성에 실패했습니다. 다시 시도해주세요.",
      500
    );
    return next(error); // 이게 실행되어야 에러 핸들링 미들웨어로 넘어감
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const { title, deletePlace } = req.body;
  const placeId = req.params.pid;

  const updatePlace = {
    ...DUMMY_PLACES.find((p) => p.id === placeId),
  };
  const placeIndex = DUMMY_PLACES.findIndex((p) => p.id === placeId);
  updatePlace.title = title;
  updatePlace.deletePlace = deletePlace;

  DUMMY_PLACES[placeIndex] = updatePlace;

  res.status(200).json({ place: updatePlace });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try{
    place = await Place.findById(placeId).populate('creator');
  }catch(err){
    const error = new HttpError(
      "장소를 삭제할 수 없습니다. 다시 시도해주세요.",
      500
    );
    return next(error);
  }

  if (!place) {
    return next(new HttpError("해당 ID의 장소를 찾을 수 없습니다.", 404));
  }
  

  // placeId로 장소를 삭제할 수도 있지만, 깨진 참조를 방지하기 위해 place.creator.places에서 해당 장소를 제거해야 함
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await place.deleteOne({ session: sess });
    place.creator.places.pull(place); // user.places.pull(placeId)
    await place.creator.save({ session: sess }); // user.save()

    await sess.commitTransaction();
    sess.endSession();

  } catch (err) {
    const error = new HttpError(
      "장소를 삭제할 수 없습니다. 다시 시도해주세요.",
      500
    );
    console.log(err);
    return next(error);
  }

  res.status(200).json({ message: "장소가 삭제되었습니다.", deletedPlace: place });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;