const express = require('express');
const jsonPath = __dirname + '/public/crafts/crafts.json';

const app = express();
app.use(express.static('public'));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

const cors = require('cors');
app.use(cors());

const multer = require('multer');
const storage = multer.memoryStorage();
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, "./public/crafts/");
//     },
//     filename: (req, file, cb) => {
//       cb(null, file.originalname);
//     },
// });
const upload = multer({ storage: storage });

const mongoose = require("mongoose");
mongoose
  .connect(`mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.dero9go.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/testdb`)
  .then(() => console.log("Connected to mongodb..."))
  .catch((err) => console.error("could not connect ot mongodb...", err));

const mongooseSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    supplies: [String],
  });

const Craft = mongoose.model("Craft", mongooseSchema);

Craft.countDocuments().then((count) => {
    if (count === 0) {
        populateDatabase();
    }
});

const populateDatabase = async () => {
    const fs = require('fs');
    const crafts = require(jsonPath);
    console.log('No crafts found in database. Adding crafts from JSON file...');
    crafts.forEach(async (craft) => {
        const image = fs.readFileSync(__dirname + `/public/crafts/${craft.image}`);
        const newCraft = new Craft({
            name: craft.name,
            image: Buffer.from(image.buffer).toString('base64'),
            description: craft.description,
            supplies: craft.supplies,
        });
        console.log(`Adding craft: ${craft.name}...`);
        newCraft.save().catch((error) => { console.error(error); });
    });
};

app.get('/api/crafts', async (req, res) => {
    try {
        const result = await Craft.find();
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

const validateImage = (file) => {
    if (file.size > 1000000) {
        return null;
    }
    return Buffer.from(file.buffer).toString('base64');
};

const joi = require('joi');

const schema = joi.object({
    _id: joi.allow(""),
    name: joi.string().min(4).required(),
    description: joi.string().min(10).required(),
    supplies: joi.array().items(joi.string().min(4)).required(),
});

app.post('/api/crafts', upload.single('image'), async (req, res) => {
    const validated = schema.validate(req.body);
    if (validated.error) {
        res.status(400).send(validated.error.details[0].message);
        return;
    }

    const newCraft = new Craft({
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        supplies: req.body.supplies,
    });

    if (req.file) {
        const image = validateImage(req.file);
        if (image == null) {
            res.status(400).send('Image too large');
            return;
        }
        newCraft.image = image;
    }

    try {
        await newCraft.save();
        res.status(201).send('Craft added');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


app.put('/api/crafts/:id', upload.single('image'), async (req, res) => {
    const craft = await Craft.findById(req.params.id);
    if (!craft) {
        res.status(404).send('Craft not found');
        return;
    }

    const validated = schema.validate(req.body);
    if (validated.error) {
        res.status(400).send(validated.error.details[0].message);
        return;
    }

    craft.name = req.body.name;
    craft.description = req.body.description;
    craft.supplies = req.body.supplies;

    if (req.file) {
        craft.image = validateImage(req.file);
    }

    try {
        await craft.save();
        res.status(200).send('Craft updated');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/api/crafts/:id', async (req, res) => {
    try {
        const craft = await Craft.findByIdAndDelete(req.params.id);
        if (!craft) {
            res.status(404).send('Craft not found');
            return;
        }
        res.status(200).send('Craft deleted');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server listenig on port 3000');
});