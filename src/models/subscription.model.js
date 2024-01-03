import mongoose from "mongoose"

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {
            type: mongoose.Schema.Types.ObjectId, // user who will subscribe to the channel
            ref: "User",
            required: true
        },

        channel: {
            type: mongoose.Schema.Types.ObjectId, // channel to whom user subscribed 
            ref: "User",
            required: true
        }
    }, { timestamps: true }
);



export const Subscription = mongoose.model("Subscription", subscriptionSchema);