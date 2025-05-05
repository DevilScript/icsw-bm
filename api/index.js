const express = require('express');
   const mongoose = require('mongoose');
   const cors = require('cors');

   const app = express();
   app.use(cors());
   app.use(express.json());

   // เชื่อมต่อ MongoDB
   mongoose.connect(process.env.MONGODB_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true
   }).catch(err => console.error('MongoDB connection error:', err));

   // Schema สำหรับ idData
   const idSchema = new mongoose.Schema({
     id: String,
     clan: String,
     faction: String,
     kagune: String,
     isKaguneV2: Boolean,
     rank: String,
     rc: Number,
     gp: Number,
     price: Number,
     link: String,
     isActive: Boolean
   });

   // Schema สำหรับ wipeData
   const wipeSchema = new mongoose.Schema({
     clan: String,
     faction: String,
     count: Number
   });

   const Id = mongoose.model('Id', idSchema);
   const Wipe = mongoose.model('Wipe', wipeSchema);

   // API สำหรับ idData
   app.get('/api/ids', async (req, res) => {
     try {
       const ids = await Id.find();
       res.json(ids);
     } catch (err) {
       res.status(500).json({ error: 'Failed to fetch IDs' });
     }
   });

   app.post('/api/ids', async (req, res) => {
     try {
       const newId = new Id(req.body);
       await newId.save();
       res.json(newId);
     } catch (err) {
       res.status(500).json({ error: 'Failed to save ID' });
     }
   });

   app.put('/api/ids/:id', async (req, res) => {
     try {
       const updatedId = await Id.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
       if (!updatedId) {
         return res.status(404).json({ error: 'ID not found' });
       }
       res.json(updatedId);
     } catch (err) {
       res.status(500).json({ error: 'Failed to update ID' });
     }
   });

   app.delete('/api/ids/:id', async (req, res) => {
     try {
       const result = await Id.deleteOne({ id: req.params.id });
       if (result.deletedCount === 0) {
         return res.status(404).json({ error: 'ID not found' });
       }
       res.json({ success: true });
     } catch (err) {
       res.status(500).json({ error: 'Failed to delete ID' });
     }
   });

   // API สำหรับ wipeData
   app.get('/api/wipe', async (req, res) => {
     try {
       const wipeData = await Wipe.find();
       res.json(wipeData);
     } catch (err) {
       res.status(500).json({ error: 'Failed to fetch wipe data' });
     }
   });

   app.post('/api/wipe', async (req, res) => {
     try {
       const { clan, faction, count } = req.body;
       const existing = await Wipe.findOne({ clan, faction });
       if (existing) {
         existing.count = count;
         await existing.save();
         res.json(existing);
       } else {
         const newWipe = new Wipe({ clan, faction, count });
         await newWipe.save();
         res.json(newWipe);
       }
     } catch (err) {
       res.status(500).json({ error: 'Failed to save wipe data' });
     }
   });

   module.exports = app;