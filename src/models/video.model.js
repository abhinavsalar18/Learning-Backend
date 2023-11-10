import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },

        thumbnail: {
            type: String, //cloudinary url
            required: true
        },

        title: {
            type: String, 
            required: true
        },

        description: {
            type: String,
            required: true
        },

        duration: {
            type: Number, //duration will be provided by cloudinary after processing
            required: true
        },

        views: {
            type: Number,
            default: 0 
        },

        isPublished: {
            type: Boolean,
            default: true
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    }, 
    {
        timestamps: true
    }
);

// this plugin makes the aggregate code easy to write
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);