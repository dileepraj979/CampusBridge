import mongoose from 'mongoose';

const busStopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  morningPickupTime: { type: String, required: true },
  eveningDropTime: { type: String, required: true },
  sequence: { type: Number, required: true }
}, { _id: false });

const transportRouteSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  routeName: {
    type: String,
    required: true
  },
  busNumber: {
    type: String,
    required: true
  },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  totalCapacity: {
    type: Number,
    required: true,
    default: 50
  },
  allocatedSeats: {
    type: Number,
    required: true,
    default: 0
  },
  occupancyStatus: {
    type: String,
    enum: ['NORMAL', 'NEAR_CAPACITY', 'OVERFLOW_ALERT'],
    default: 'NORMAL'
  },
  stops: [busStopSchema]
}, {
  timestamps: true
});

const TransportRoute = mongoose.model('TransportRoute', transportRouteSchema);
export default TransportRoute;
