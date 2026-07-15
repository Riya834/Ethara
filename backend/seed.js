const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./src/models/User');
const Seat = require('./src/models/Seat');
const Project = require('./src/models/Project');

const MONGO_URI = 'mongodb://127.0.0.1:27017/ethara-seats';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Starting mass seeding...');

    await User.deleteMany({});
    await Seat.deleteMany({});
    await Project.deleteMany({});

    // 1. Create 100 Projects
    console.log('Generating 100 projects...');
    const projectDocs = [];
    for (let i = 0; i < 100; i++) {
      projectDocs.push({
        name: `${faker.company.catchPhraseAdjective()} ${faker.company.buzzNoun()} Initiative ${i}`,
        teamSize: 0
      });
    }
    const createdProjects = await Project.insertMany(projectDocs);

    // 2. Create 5000 Seats (10 Floors, 10 Zones (A-J), 50 seats per zone)
    console.log('Generating 5000 seats...');
    const seatDocs = [];
    const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let floor = 1; floor <= 10; floor++) {
      for (const zone of zones) {
        for (let num = 1; num <= 50; num++) {
          seatDocs.push({
            floor,
            zone,
            seatNumber: `${zone}-${num}`
          });
        }
      }
    }
    const createdSeats = await Seat.insertMany(seatDocs);

    // 3. Create 5000 Users
    console.log('Generating 5000 employees...');
    const userDocs = [];
    const roles = ['Employee', 'HR', 'Admin', 'Project Manager'];
    
    for (let i = 0; i < 5000; i++) {
      // 80% get a project, 20% no project
      const projectId = Math.random() > 0.2 ? createdProjects[Math.floor(Math.random() * createdProjects.length)]._id : null;
      // 90% get a seat, 10% new joiners pending allocation
      const hasSeat = Math.random() > 0.1;
      let seatId = null;
      
      if (hasSeat) {
        // Pop a seat from the array so we don't assign two people to same seat
        const seatObj = createdSeats.pop();
        if(seatObj) {
            seatId = seatObj._id;
            seatObj.status = 'Occupied';
        }
      }

      const user = {
        name: faker.person.fullName(),
        email: `${faker.internet.username()}_${i}@ethara.ae`.toLowerCase(),
        role: roles[Math.floor(Math.random() * roles.length)],
        project: projectId,
        seat: seatId,
        isNewJoiner: !seatId,
        allocationDate: seatId ? faker.date.recent({ days: 30 }) : null
      };
      userDocs.push(user);
    }
    
    // Batch insert users (5000 is small enough for single insertMany on modern Mongo, but let's do it safely)
    const createdUsers = await User.insertMany(userDocs);

    // 4. Update the occupied seats with assignedTo
    console.log('Updating seat occupancy mapping...');
    const occupiedSeatUpdates = createdUsers
      .filter(u => u.seat)
      .map(u => ({
        updateOne: {
          filter: { _id: u.seat },
          update: { $set: { status: 'Occupied', assignedTo: u._id } }
        }
      }));
      
    // Execute bulk write in chunks of 1000
    for(let i = 0; i < occupiedSeatUpdates.length; i += 1000) {
       await Seat.bulkWrite(occupiedSeatUpdates.slice(i, i + 1000));
    }

    // 5. Update Project team sizes
    console.log('Calculating project team sizes...');
    const projectCounts = await User.aggregate([
      { $match: { project: { $ne: null } } },
      { $group: { _id: "$project", count: { $sum: 1 } } }
    ]);
    
    const projectUpdates = projectCounts.map(pc => ({
      updateOne: {
        filter: { _id: pc._id },
        update: { $set: { teamSize: pc.count } }
      }
    }));
    
    if (projectUpdates.length > 0) {
      await Project.bulkWrite(projectUpdates);
    }

    console.log('Database seeded successfully with 5000 employees!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding database:', err);
    mongoose.disconnect();
  }
};

seedDatabase();
