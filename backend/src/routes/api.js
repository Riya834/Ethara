const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Seat = require('../models/Seat');
const Project = require('../models/Project');

// GET seats with optional floor and zone filters
router.get('/seats', async (req, res) => {
  try {
    const { floor, zone } = req.query;
    let query = {};
    if (floor) query.floor = Number(floor);
    if (zone) query.zone = zone;
    
    // We limit to 500 seats to prevent payload explosion if no filter is applied
    const seats = await Seat.find(query).populate('assignedTo', 'name email role').limit(500);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET paginated employees
router.get('/employees', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    
    let query = {};
    if (search) {
      // Use text index if search is long enough, else regex
      query = { name: { $regex: search, $options: 'i' } };
    }
    
    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .populate('seat')
      .populate('project')
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalEmployees: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats optimized
router.get('/stats', async (req, res) => {
  try {
    const totalSeats = await Seat.estimatedDocumentCount();
    const occupiedSeats = await Seat.countDocuments({ status: 'Occupied' });
    const availableSeats = totalSeats - occupiedSeats; // optimization
    
    // Seat utilization by project - only get top 10 projects to avoid massive payload
    const projectUtilization = await User.aggregate([
      { $match: { seat: { $exists: true, $ne: null } } },
      { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'projectDetails' } },
      { $unwind: '$projectDetails' },
      { $group: { _id: '$projectDetails.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 } // Top 10 projects by seat allocation
    ]);
    
    res.json({
      totalSeats,
      occupiedSeats,
      availableSeats,
      projectUtilization
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Allocate seat
router.post('/allocate', async (req, res) => {
  try {
    const { userId, seatId } = req.body;
    const user = await User.findById(userId);
    const seat = await Seat.findById(seatId);
    
    if (!user || !seat) return res.status(404).json({ error: 'User or Seat not found' });
    if (seat.status === 'Occupied') return res.status(400).json({ error: 'Seat already occupied' });
    
    if (user.seat) {
      await Seat.findByIdAndUpdate(user.seat, { status: 'Available', assignedTo: null });
    }
    
    seat.status = 'Occupied';
    seat.assignedTo = user._id;
    await seat.save();
    
    user.seat = seat._id;
    user.isNewJoiner = false;
    user.allocationDate = new Date();
    await user.save();
    
    res.json({ message: 'Seat allocated successfully', seat, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Advanced Dynamic AI Chat
router.post('/chat', async (req, res) => {
  try {
    const { query } = req.body;
    let reply = "I can help you find seats, employees, and projects. Ask me 'Where is John' or 'Available seats on floor 2'.";
    const q = query.toLowerCase();
    
    // 1. Where is <Name>
    const nameMatch = q.match(/where is (?:located )?(?:seated )?([a-zA-Z\s]+)\??/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const user = await User.findOne({ name: { $regex: name, $options: 'i' } }).populate('seat').populate('project');
      
      if (user) {
        if (user.seat) {
          reply = `Found ${user.name}! They are seated on Floor ${user.seat.floor}, Zone ${user.seat.zone}, Seat ${user.seat.seatNumber}. ` +
                  (user.project ? `They work on the ${user.project.name}.` : '');
        } else {
          reply = `${user.name} does not have a seat assigned yet.`;
        }
      } else {
        reply = `I couldn't find an employee named "${name}" among the 5000 records.`;
      }
      return res.json({ reply });
    }

    // 2. Available seats on floor <N>
    const floorMatch = q.match(/available.*floor (\d+)/);
    if (floorMatch) {
      const floor = Number(floorMatch[1]);
      const available = await Seat.countDocuments({ floor: floor, status: 'Available' });
      reply = `There are currently ${available} seats available on Floor ${floor}.`;
      return res.json({ reply });
    }
    
    // 3. Project queries
    const projectMatch = q.match(/(?:who|how many).* (?:in|on).* project (.+)\??/);
    if (projectMatch) {
      const projectName = projectMatch[1].replace('?', '').trim();
      const project = await Project.findOne({ name: { $regex: projectName, $options: 'i' } });
      if (project) {
        const count = await User.countDocuments({ project: project._id });
        reply = `There are ${count} employees assigned to the ${project.name} (Team Size target: ${project.teamSize}).`;
      } else {
        reply = `I couldn't find a project matching "${projectName}".`;
      }
      return res.json({ reply });
    }

    // Fallback logic
    if (q.includes('available')) {
      const available = await Seat.countDocuments({ status: 'Available' });
      reply = `Across all floors, there are currently ${available} seats available out of 5000.`;
    }

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deallocate seat
router.post('/deallocate', async (req, res) => {
  try {
    const { userId, seatId } = req.body;
    let user = null;
    let seat = null;

    if (userId) {
      user = await User.findById(userId);
      if (user && user.seat) {
        seat = await Seat.findById(user.seat);
      }
    } else if (seatId) {
      seat = await Seat.findById(seatId);
      if (seat && seat.assignedTo) {
        user = await User.findById(seat.assignedTo);
      }
    }

    if (!user && !seat) {
      return res.status(404).json({ error: 'User or Seat not found or no allocation exists' });
    }

    if (seat) {
      seat.status = 'Available';
      seat.assignedTo = null;
      await seat.save();
    }

    if (user) {
      user.seat = null;
      user.allocationDate = null;
      await user.save();
    }

    res.json({ message: 'Seat deallocated successfully', seat, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
