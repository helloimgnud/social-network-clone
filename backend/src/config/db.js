// // server/src/config/db.js
// import mongoose from "mongoose";

// const connectDB = async () => {
//   try {
//     const uri = process.env.MONGO_URI || "mongodb://localhost:27017/instagram_clone";
//     const conn = await mongoose.connect(uri, {
//     });
//     console.log(`MongoDB connected: ${conn.connection.host}`);
//   } catch (err) {
//     console.error("MongoDB connection error:", err.message);
//     process.exit(1);
//   }
// };

// export default connectDB;

// backend/src/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(' MongoDB connected successfully');
    } catch (error) {
        console.error(' MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;