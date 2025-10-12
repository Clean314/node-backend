const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      '장소를 찾을 수 없습니다. 다시 시도해주세요.',
      500
    );
    return next(error); 
  }

  if (!place) {
    return next(new HttpError('해당 ID의 장소를 찾을 수 없습니다.', 404));
  }

  res.json(place.toObject({ getters: true })); // { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let place;
  try {
    place = await Place.find({creator: userId});
  } catch (err) {
    const error = new HttpError(
      '장소를 찾을 수 없습니다. 다시 시도해주세요.',  
      500
    );
    return next(error);
  }

  if (!place || place.length === 0) {
    return next(
      new HttpError('id에 해당하는 유저를 찾을 수 없읍니다', 404)
    );
  }

  res.json({places: place.map(p => p.toObject({getters: true}))});
}

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      throw new HttpError('유효하지 않은 입력입니다.', 422);
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
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
    creator
  });
    
    try {
      await createdPlace.save();
    } catch (err) {
      const error = new HttpError(
        'Place 생성에 실패했습니다. 다시 시도해주세요.',
        500
      );
      return next(error); // 이게 실행되어야 에러 핸들링 미들웨어로 넘어감
    }

  res.status(201).json({ place: createdPlace });
}

const updatePlace = (req, res, next) => {
  const {title, deletePlace} = req.body;
  const placeId = req.params.pid;

  const updatePlace = {
    ...DUMMY_PLACES.find(p=>p.id===placeId)
  };
  const placeIndex = DUMMY_PLACES.findIndex(p=>p.id===placeId);
  updatePlace.title = title;
  updatePlace.deletePlace = deletePlace;

  DUMMY_PLACES[placeIndex] = updatePlace;

  res.status(200).json({place: updatePlace});
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.pid;
  const place = DUMMY_PLACES.find(p => p.id === placeId);

  if (!place) {
    return next(new HttpError('해당 ID의 장소를 찾을 수 없습니다.', 404));
  }

  DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
  res.status(200).json({ message: '장소가 삭제되었습니다.', deletedPlace: place });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;