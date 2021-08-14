const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const wrapAsync = require('../utilities/wrapAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');
const multer  = require('multer')
const Campground = require('../models/campground');
const {storage} = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(wrapAsync(campgrounds.index))
    .post( 
        isLoggedIn, 
        upload.array('image'),
        validateCampground, 
        wrapAsync(campgrounds.createCampground)
        );
  

// router/new is a single route, no grouping required
router
    .get('/new', 
    isLoggedIn, 
    campgrounds.renderNewForm
    );
// ------

router.route('/:id')
    .get(wrapAsync(campgrounds.showCampground))
    .put( 
        isLoggedIn, 
        isAuthor, 
        validateCampground, 
        wrapAsync(campgrounds.updateCampground)
    )
    .delete( 
        isLoggedIn, 
        isAuthor, 
        wrapAsync(campgrounds.deleteCampground)
    );

router.get('/:id/edit', 
    isLoggedIn, 
    isAuthor, 
    wrapAsync(campgrounds.renderEditForm)
    );

module.exports = router;

// router.get('/', 
//     wrapAsync(campgrounds.index)
//     );


// router.post('/', 
//     isLoggedIn, 
//     validateCampground, 
//     wrapAsync(campgrounds.createCampground)
//     );

// router.get('/:id', 
//     wrapAsync(campgrounds.showCampground)
//     );


// router.put('/:id', 
//     isLoggedIn, 
//     isAuthor, 
//     validateCampground, 
//     wrapAsync(campgrounds.updateCampground)
//     );

// router.delete('/:id', 
//     isLoggedIn, 
//     isAuthor, 
//     wrapAsync(campgrounds.deleteCampground)
//     );

